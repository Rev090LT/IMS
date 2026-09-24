import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/users — список пользователей с фильтрацией по роли
router.get('/', async (req, res) => {
  try {
    const { role, active, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT id, username, full_name, role, phone, email,
             is_active, last_login, created_at
      FROM users WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    if (active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(active === 'true');
      paramIndex++;
    }
    
    query += ` ORDER BY username LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;