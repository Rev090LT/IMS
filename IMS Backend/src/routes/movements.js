// IMS Backend/src/routes/movements.js
import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// Получить историю перемещений
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Запрос с JOIN, чтобы получить имена товаров и локаций
    const query = `
      SELECT
        m.id,
        m.item_id,
        i.qr_code AS item_qr_code,
        i.name AS item_name,
        l_from.name AS from_location_name,
        l_to.name AS to_location_name,
        m.quantity,
        m.action_type,
        u.username AS employee_username,
        m.comment,
        m.date
      FROM movements m
      LEFT JOIN items i ON m.item_id = i.id
      LEFT JOIN locations l_from ON m.from_location_id = l_from.id
      LEFT JOIN locations l_to ON m.to_location_id = l_to.id
      LEFT JOIN users u ON m.employee_id = u.id
      ORDER BY m.date DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching movement history:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;