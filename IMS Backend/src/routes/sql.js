import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Эндпоинт для выполнения SQL-запросов
router.post('/execute', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Проверим, что запрос не начинается с DDL/DML (для безопасности)
  const trimmedQuery = query.trim().toUpperCase();
  if (
    trimmedQuery.startsWith('DROP') ||
    trimmedQuery.startsWith('DELETE') ||
    trimmedQuery.startsWith('UPDATE') ||
    trimmedQuery.startsWith('INSERT') ||
    trimmedQuery.startsWith('ALTER') ||
    trimmedQuery.startsWith('CREATE') ||
    trimmedQuery.startsWith('TRUNCATE')
  ) {
    return res.status(400).json({ error: 'This type of query is not allowed' });
  }

  try {
    const result = await pool.query(query);
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields ? result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) : [],
    });
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;