import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// <<<--- Получить всех контрагентов --->
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, type, fio, phone, email, address, inn, kpp, ogrn, company_name, legal_address FROM counterparties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching counterparties:', err);
    res.status(500).json({ error: 'Failed to fetch counterparties' });
  }
});

// <<<--- Создать контрагента --->
router.post('/', authenticateToken, async (req, res) => {
  const { type, fio, phone, email, address, inn, kpp, ogrn, company_name, legal_address } = req.body;

  if (type === 'legal' && (!company_name || !inn || !legal_address)) {
    return res.status(400).json({ error: 'Company name, INN, and legal address are required for legal entities' });
  }

  if (type === 'physical' && !fio) {
    return res.status(400).json({ error: 'FIO is required for physical persons' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO counterparties (type, fio, phone, email, address, inn, kpp, ogrn, company_name, legal_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        type, 
        type === 'physical' ? fio : null,
        phone || null, 
        email || null, 
        address || null, 
        inn || null, 
        kpp || null, 
        ogrn || null, 
        type === 'legal' ? company_name : null,
        type === 'legal' ? legal_address : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding counterparty:', err);
    res.status(500).json({ error: 'Failed to add counterparty' });
  }
});

// <<<--- Обновить контрагента --->
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, fio, phone, email, address, inn, kpp, ogrn, company_name, legal_address } = req.body;

  if (type === 'legal' && (!company_name || !inn || !legal_address)) {
    return res.status(400).json({ error: 'Company name, INN, and legal address are required for legal entities' });
  }

  if (type === 'physical' && !fio) {
    return res.status(400).json({ error: 'FIO is required for physical persons' });
  }

  try {
    const result = await pool.query(
      `UPDATE counterparties SET type=$1, fio=$2, phone=$3, email=$4, address=$5, inn=$6, kpp=$7, ogrn=$8, company_name=$9, legal_address=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 RETURNING *`,
      [
        type, 
        type === 'physical' ? fio : null,
        phone || null, 
        email || null, 
        address || null, 
        inn || null, 
        kpp || null, 
        ogrn || null, 
        type === 'legal' ? company_name : null,
        type === 'legal' ? legal_address : null,
        parseInt(id)
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Counterparty not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating counterparty:', err);
    res.status(500).json({ error: 'Failed to update counterparty' });
  }
});

// <<<--- Удалить контрагента --->
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM counterparties WHERE id = $1 RETURNING *', [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Counterparty not found' });
    }

    res.json({ message: 'Counterparty deleted successfully', deleted_counterparty: result.rows[0] });
  } catch (err) {
    console.error('Error deleting counterparty:', err);
    res.status(500).json({ error: 'Failed to delete counterparty' });
  }
});

export default router;