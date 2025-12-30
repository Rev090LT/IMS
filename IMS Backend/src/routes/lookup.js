// IMS Backend/src/routes/lookup.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Получить все категории
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;

  console.log('Received POST /api/lookup/categories:', { name, description });

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Проверим, не существует ли уже
    const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const result = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description', [name.trim(), description?.trim() || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: err.message });
  }
});

// Получить всех производителей
router.get('/manufacturers', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM manufacturers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching manufacturers:', err);
    res.status(500).json({ error: err.message });
  }
});


// Добавить нового производителя
router.post('/manufacturers', async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Manufacturer name is required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM manufacturers WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Manufacturer already exists' });
    }

    const result = await pool.query('INSERT INTO manufacturers (name) VALUES ($1) RETURNING id, name', [name.trim()]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding manufacturer:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;