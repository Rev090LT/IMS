// IMS Backend/src/routes/stock.js
import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

router.use(authenticateToken);

// ============================================================================
// GET /api/stock/by-locations (Остатки всех товаров по всем складам)
// ============================================================================
router.get('/by-locations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.qr_code,
        i.name,
        i.part_number,
        l.id as location_id,
        l.name as location_name,
        COALESCE(i.quantity, 0) as quantity,
        i.updated_at
      FROM items i
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE l.is_active = true
      ORDER BY i.name, l.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock by locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/stock/by-locations/:qr_code (Остатки конкретного товара по складам)
// ============================================================================
router.get('/by-locations/:qr_code', async (req, res) => {
  try {
    const { qr_code } = req.params;
    
    const result = await pool.query(`
      SELECT 
        l.id as location_id,
        l.name as location_name,
        COALESCE(i.quantity, 0) as quantity,
        i.updated_at
      FROM locations l
      LEFT JOIN items i ON i.location_id = l.id AND i.qr_code = $1
      WHERE l.is_active = true
      ORDER BY l.name
    `, [qr_code]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock for item:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;