import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { business_id } = req.query;
  if (!business_id) { res.status(400).json({ error: 'business_id required' }); return; }
  try {
    const result = await pool.query('SELECT * FROM products WHERE business_id = $1 ORDER BY name', [business_id]);
    res.json({ products: result.rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { business_id, stock_quantity, price, is_active } = req.body;
  try {
    await pool.query(
      'UPDATE products SET stock_quantity = $1, price = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND business_id = $5',
      [stock_quantity, price, is_active, id, business_id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { business_id, name, description, price, stock_quantity, is_active } = req.body;
  if (!business_id || !name || price === undefined || stock_quantity === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO products (business_id, name, description, price, stock_quantity, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [business_id, name, description || '', price, stock_quantity, is_active !== undefined ? is_active : true]
    );
    res.status(201).json({ message: 'Product created', product: result.rows[0] });
  } catch (err) {
    console.error('Failed to create product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { business_id } = req.query;
  
  if (!business_id) {
    res.status(400).json({ error: 'business_id required' });
    return;
  }

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING id',
      [id, business_id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Product not found or access denied' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
