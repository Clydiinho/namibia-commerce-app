import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { business_id } = req.query;
  if (!business_id) { res.status(400).json({ error: 'business_id required' }); return; }
  try {
    const result = await pool.query(`
      SELECT r.*, c.name as customer_name, c.phone_number 
      FROM rewards r 
      JOIN customers c ON r.customer_id = c.id 
      WHERE r.business_id = $1 
      ORDER BY r.created_at DESC LIMIT 100
    `, [business_id]);
    res.json({ rewards: result.rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/adjust', async (req: Request, res: Response): Promise<void> => {
  const { business_id, customer_id, reward_type, value, description } = req.body;
  
  if (!business_id || !customer_id || !reward_type || value === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO rewards (business_id, customer_id, reward_type, value, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [business_id, customer_id, reward_type, value, description || 'Manual adjustment']
    );

    if (reward_type === 'points_earned') {
      await client.query(
        `UPDATE customers SET points_balance = points_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND business_id = $3`,
        [value, customer_id, business_id]
      );
    } else if (reward_type === 'points_redeemed') {
      await client.query(
        `UPDATE customers SET points_balance = points_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND business_id = $3`,
        [value, customer_id, business_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Reward adjusted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to adjust reward:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
