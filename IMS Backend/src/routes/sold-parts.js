import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// <<<--- Получить все проданные запчасти --->
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sp.*,
        c.fio as counterparty_fio,
        c.company_name as counterparty_company_name,
        s.name as supplier_name
      FROM sold_parts sp
      LEFT JOIN counterparties c ON sp.counterparty_id = c.id
      LEFT JOIN suppliers s ON sp.supplier_id = s.id
      ORDER BY sp.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sold parts:', err);
    res.status(500).json({ error: 'Failed to fetch sold parts' });
  }
});

export default router;