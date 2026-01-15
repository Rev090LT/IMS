import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// <<<--- Получить всех поставщиков --->
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, inn, ogrn, kpp, legal_address, actual_address FROM suppliers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// <<<--- Создать поставщика --->
router.post('/', authenticateToken, async (req, res) => {
  const { name, inn, ogrn, kpp, legal_address, actual_address } = req.body;

  if (!name || !inn || !legal_address) {
    return res.status(400).json({ error: 'Name, INN, and legal address are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO suppliers (name, inn, ogrn, kpp, legal_address, actual_address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, inn, ogrn || null, kpp || null, legal_address, actual_address || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding supplier:', err);
    res.status(500).json({ error: 'Failed to add supplier' });
  }
});

// <<<--- Обновить поставщика --->
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, inn, ogrn, kpp, legal_address, actual_address } = req.body;

  if (!name || !inn || !legal_address) {
    return res.status(400).json({ error: 'Name, INN, and legal address are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, inn=$2, ogrn=$3, kpp=$4, legal_address=$5, actual_address=$6, updated_at=CURRENT_TIMESTAMP
       WHERE id=$7 RETURNING *`,
      [name, inn, ogrn || null, kpp || null, legal_address, actual_address || null, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// <<<--- Удалить поставщика --->
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully', deleted_supplier: result.rows[0] });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;