// IMS Backend/src/routes/locations.js
import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// Добавить новую локацию
router.post('/', authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Location name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO locations (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // duplicate key value violates unique constraint
      res.status(400).json({ error: 'A location with this name already exists' });
    } else {
      console.error('Error creating location:', err);
      res.status(500).json({ error: err.message });
    }
  }
});

// Получить все локации
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description FROM locations ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;