import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/crm/customers — список клиентов с пагинацией
router.get('/', async (req, res) => {
  try {
    const { limit = 200, offset = 0, search } = req.query;
    
    let query = `
      SELECT id, name, phone_primary, phone_secondary, email,
             loyalty_level, last_visit_date, created_at
      FROM crm_customers WHERE is_active = TRUE
    `;
    const params = [];
    
    if (search) {
      query += ` AND (name ILIKE $1 OR phone_primary ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY last_visit_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Получаем общее количество для пагинации
    const countQuery = `SELECT COUNT(*) FROM crm_customers WHERE is_active = TRUE` + 
      (search ? ` AND (name ILIKE $1 OR phone_primary ILIKE $1 OR email ILIKE $1)` : '');
    const count = await pool.query(countQuery, search ? [`%${search}%`] : []);
    
    res.json({
      customers: result.rows,
      total: parseInt(count.rows[0]?.count || 0),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;