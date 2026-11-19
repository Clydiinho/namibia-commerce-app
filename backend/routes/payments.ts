import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { sendCustomerConfirmation, sendBusinessNotification } from '../services/whatsapp';

const router = Router();

/**
 * GET /orders
 * Retrieves a list of orders for a business.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { business_id } = req.query;
  if (!business_id) { res.status(400).json({ error: 'business_id required' }); return; }
  try {
    const result = await pool.query(`
      SELECT o.*, c.name as customer_name, c.phone_number 
      FROM orders o 
      JOIN customers c ON o.customer_id = c.id 
      WHERE o.business_id = $1 
      ORDER BY o.created_at DESC LIMIT 100
    `, [business_id]);
    res.json({ orders: result.rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

/**
 * POST /orders
 * Creates a new order, validates stock, creates/updates the customer, 
 * calculates totals, saves line items, and triggers WhatsApp notifications.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { business_id, customer_phone, customer_name, items } = req.body;

  // Basic validation
  if (!business_id || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Missing required fields: business_id, customer_phone, or items.' });
    return;
  }

  // Get a dedicated client from the pool to run a database transaction
  const client = await pool.connect();

  try {
    // 1. Begin Transaction
    // We use a transaction so that if any step fails (e.g., insufficient stock), 
    // the entire order process is rolled back and no partial data is saved.
    await client.query('BEGIN');

    // 2. Find or Create Customer
    // Multi-tenancy: We ensure the customer is linked to the specific business_id.
    // If the customer already exists for this business, we update their name.
    const customerResult = await client.query(
      `INSERT INTO customers (business_id, phone_number, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (business_id, phone_number) 
       DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [business_id, customer_phone, customer_name || 'Valued Customer']
    );
    const customerId = customerResult.rows[0].id;

    // 3. Validate Stock and Calculate Total
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (quantity <= 0) {
        throw new Error(`Invalid quantity for product ${product_id}`);
      }

      // Deduct stock immediately to prevent race conditions.
      // The WHERE clause ensures we only deduct if there is enough stock and the product belongs to the business.
      const productResult = await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND business_id = $3 AND stock_quantity >= $1 AND is_active = true
         RETURNING name, price`,
        [quantity, product_id, business_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${product_id} is out of stock, inactive, or does not exist.`);
      }

      const product = productResult.rows[0];
      const subtotal = product.price * quantity;
      totalAmount += subtotal;

      processedItems.push({
        product_id,
        quantity,
        unit_price: product.price,
        subtotal
      });
    }

    // 4. Create the Order Record
    const orderResult = await client.query(
      `INSERT INTO orders (business_id, customer_id, status, total_amount)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id`,
      [business_id, customerId, totalAmount]
    );
    const orderId = orderResult.rows[0].id;

    // 5. Save Order Line Items
    for (const pItem of processedItems) {
      await client.query(
        `INSERT INTO order_items (business_id, order_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [business_id, orderId, pItem.product_id, pItem.quantity, pItem.unit_price, pItem.subtotal]
      );
    }

    // 6. Commit Transaction
    // Everything succeeded, save changes to the database.
    await client.query('COMMIT');

    // 7. Send WhatsApp Notifications (Async, non-blocking)
    // We fetch the business phone number to notify the owner
    const businessResult = await client.query(
      `SELECT whatsapp_number FROM businesses WHERE id = $1`,
      [business_id]
    );
    
    if ((businessResult.rowCount ?? 0) > 0) {
      const businessPhone = businessResult.rows[0].whatsapp_number;
      
      // Fire and forget notifications
      sendCustomerConfirmation(business_id, customer_phone, orderId, totalAmount).catch(console.error);
      sendBusinessNotification(business_id, businessPhone, orderId, totalAmount).catch(console.error);
    }

    // 8. Return Success Response
    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId,
      total_amount: totalAmount,
      status: 'pending'
    });

  } catch (error: any) {
    // If anything fails, rollback the transaction to restore stock and undo inserts
    await client.query('ROLLBACK');
    console.error('Order creation failed:', error);
    res.status(400).json({ error: error.message || 'Failed to create order' });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
});

/**
 * GET /orders/:id
 * Retrieves the status and details of a specific order.
 * Requires business_id in the query string to enforce multi-tenancy.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.id;
  const businessId = req.query.business_id;

  if (!businessId) {
    res.status(400).json({ error: 'business_id query parameter is required for multi-tenancy.' });
    return;
  }

  try {
    // Fetch the main order details, ensuring it belongs to the requested business
    const orderResult = await pool.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, 
              c.name as customer_name, c.phone_number as customer_phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1 AND o.business_id = $2`,
      [orderId, businessId]
    );

    if (orderResult.rowCount === 0) {
      res.status(404).json({ error: 'Order not found or access denied.' });
      return;
    }

    const order = orderResult.rows[0];

    // Fetch the line items for this order
    const itemsResult = await pool.query(
      `SELECT oi.quantity, oi.unit_price, oi.subtotal, p.name as product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1 AND oi.business_id = $2`,
      [orderId, businessId]
    );

    order.items = itemsResult.rows;

    res.status(200).json({ order });
  } catch (error: any) {
    console.error('Failed to fetch order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /orders/:id/status
 * Updates the status of an order.
 */
router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { business_id, status } = req.body;
  if (!business_id || !status) { res.status(400).json({ error: 'business_id and status required' }); return; }
  try {
    await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND business_id = $3',
      [status, id, business_id]
    );
    res.json({ message: 'Status updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

export default router;
