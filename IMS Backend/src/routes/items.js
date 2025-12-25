import express from 'express';
import { Item } from '../models/Item.js';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js'; // <= Добавим это

const router = express.Router();

// Получить товар по QR-коду
router.get('/:qr_code', authenticateToken, async (req, res) => {
  const { qr_code } = req.params;
  try {
    const item = await Item.getByQR(qr_code);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Списание товара
router.post('/dispose', authenticateToken, async (req, res) => {
  const { qr_code, quantity } = req.body; // <= Принимаем qr_code

  if (!qr_code || quantity <= 0) {
    return res.status(400).json({ error: 'QR код и количество обязательны' });
  }

  try {
    // Найдём товар по qr_code
    const itemResult = await pool.query('SELECT * FROM items WHERE qr_code = $1', [qr_code]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemResult.rows[0];

    if (item.quantity < quantity) {
      return res.status(400).json({ error: 'Невозможно списать позицию, которой нет в наличии' });
    }

    // Обновим количество
    const newQuantity = item.quantity - quantity;
    await pool.query('UPDATE items SET quantity = $1 WHERE qr_code = $2', [newQuantity, qr_code]);

    // Запишем в историю
    await pool.query(`
      INSERT INTO movements (item_id, from_location_id, to_location_id, employee_id, action_type, quantity, comment)
      VALUES ($1, $2, NULL, $3, 'dispose', $4, 'Disposed via modal')
    `, [item.id, item.location_id, req.user.id, quantity]);

    // Проверим, стало ли количество 0
    if (newQuantity === 0) {
      // Установим статус 'disposed'
      await pool.query('UPDATE items SET status = $1 WHERE qr_code = $2', ['disposed', qr_code]);
    } else if (item.status === 'disposed' && newQuantity > 0) {
      // Если был 'disposed', но количество > 0, вернём статус 'warehouse'
      await pool.query('UPDATE items SET status = $1 WHERE qr_code = $2', ['warehouse', qr_code]);
    }

    res.status(200).json({ message: 'Позиция успешно списана', newQuantity });
  } catch (err) {
    console.error('Error disposing item:', err);
    res.status(500).json({ error: err.message });
  }
});

// Перемещение товара (новый маршрут)

// IMS Backend/src/routes/items.js
router.post('/move', authenticateToken, async (req, res) => {
  const { item_id, from_location_id, to_location_id, quantity, comment } = req.body;

  if (!item_id || !from_location_id || !to_location_id || quantity <= 0) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Найдём товар
    const itemResult = await pool.query('SELECT * FROM items WHERE id = $1 AND location_id = $2', [item_id, from_location_id]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in the specified location' });
    }

    const item = itemResult.rows[0];

    if (item.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough quantity to move' });
    }

    // Обновим количество в старой локации
    const newQuantity = item.quantity - quantity;
    await pool.query('UPDATE items SET quantity = $1 WHERE id = $2', [newQuantity, item_id]);

    // Если товара не осталось на старой локации, проверим статус
    if (newQuantity === 0) {
      await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['disposed', item_id]);
    } else if (item.status === 'disposed' && newQuantity > 0) {
      await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['warehouse', item_id]);
    }

    // Проверим, существует ли уже товар в новой локации
    const existingItemResult = await pool.query('SELECT id FROM items WHERE qr_code = $1 AND location_id = $2', [item.qr_code, to_location_id]);
    if (existingItemResult.rows.length > 0) {
      // Объединим с существующим товаром
      await pool.query('UPDATE items SET quantity = quantity + $1 WHERE id = $2', [quantity, existingItemResult.rows[0].id]);
    } else {
      // Создадим новый товар в новой локации
      await pool.query(`
        INSERT INTO items (qr_code, name, description, quantity, status, location_id, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [item.qr_code, item.name, item.description, quantity, 'warehouse', to_location_id, item.created_by_user_id]);
    }

    // Запишем в историю
    await pool.query(`
      INSERT INTO movements (item_id, from_location_id, to_location_id, employee_id, action_type, quantity, comment)
      VALUES ($1, $2, $3, $4, 'move', $5, $6)
    `, [item_id, from_location_id, to_location_id, req.user.id, quantity, comment || null]);

    res.status(200).json({ message: 'Item moved successfully' });
  } catch (err) {
    console.error('Error moving item:', err);
    res.status(500).json({ error: err.message });
  }
});
// Алиас для совместимости с AddItemModal и MoveModal
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    // Просто делаем запрос к базе данных для получения локаций
    const result = await pool.query('SELECT id, name FROM locations ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching locations for items route:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    // ПРАВИЛЬНЫЙ запрос с JOIN
    const query = `
      SELECT
        i.id,
        i.qr_code,
        i.name,
        i.description,
        i.quantity,
        i.status,
        i.location_id,
        l.name AS location_name, -- <-- Вот это создаёт поле location_name
        i.created_by_username,
        i.created_at,
        i.updated_at
      FROM items i
      LEFT JOIN locations l ON i.location_id = l.id -- <-- JOIN с locations
      ORDER BY i.created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { qr_code, name, description, quantity, location_id } = req.body;

  if (!qr_code || !name || !quantity || quantity <= 0 || !location_id) {
    return res.status(400).json({ error: 'qr_code, name, quantity, and location_id are required' });
  }

  try {
    // Проверим, нет ли уже товара с таким qr_code
    const existingItemResult = await pool.query('SELECT id, quantity, status FROM items WHERE qr_code = $1', [qr_code]);
    if (existingItemResult.rows.length > 0) {
      // Объединим с существующим товаром
      const existingItem = existingItemResult.rows[0];
      const newQuantity = existingItem.quantity + quantity;

      await pool.query('UPDATE items SET quantity = $1 WHERE id = $2', [newQuantity, existingItem.id]);

      // Если статус был 'disposed', но количество > 0, вернём статус 'warehouse'
      if (existingItem.status === 'disposed') {
        await pool.query('UPDATE items SET status = $1 WHERE id = $2', ['warehouse', existingItem.id]);
      }

      res.status(200).json({ message: 'Item quantity updated', item_id: existingItem.id });
      return;
    }

    // Создаём новый товар
    const result = await pool.query(
      `INSERT INTO items (qr_code, name, description, quantity, status, location_id, created_by_user_id, created_by_username)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [qr_code, name, description, quantity, 'warehouse', location_id, req.user.id, req.user.username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes('duplicate key value violates unique constraint')) {
      res.status(400).json({ error: 'Item with this QR code already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;