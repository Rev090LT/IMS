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
  const { qr_code, quantity } = req.body;

  if (!qr_code || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'qr_code and quantity > 0 required' });
  }

  try {
    const updatedItem = await Item.dispose(qr_code, quantity);
    res.json({ message: 'Item disposed successfully', item: updatedItem });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Перемещение товара (новый маршрут)
router.post('/move', authenticateToken, async (req, res) => {
  const { qr_code, from_location_id, to_location_id, quantity } = req.body;

  if (!qr_code || from_location_id === undefined || to_location_id === undefined || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'qr_code, from_location_id, to_location_id, and quantity > 0 are required' });
  }

  try {
    // Начинаем транзакцию
    await pool.query('BEGIN');

    // Проверим, существует ли товар
    const item = await Item.getByQR(qr_code); // <-- getByQR использует JOIN
    if (!item) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }

    // Проверим, что товар действительно находится на from_location_id
    if (item.location_id != from_location_id) { // <-- Сравниваем с location_id
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Item is not at the specified "from" location' });
    }

    // Проверим, достаточно ли товара на from_location
    if (item.quantity < quantity) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough quantity to move' });
    }

    // Обновим количество (уменьшаем на from_location)
    await Item.updateQuantity(qr_code, -quantity);

    // Обновим локацию (теперь товар на to_location)
    await Item.updateLocation(qr_code, to_location_id); // <-- updateLocation использует location_id

    // Запишем историю перемещения
    await pool.query(`
      INSERT INTO movements (item_id, from_location_id, to_location_id, employee_id, action_type, quantity, date)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [item.id, from_location_id, to_location_id, req.user.id, 'move', quantity]);

    // Зафиксируем транзакцию
    await pool.query('COMMIT');

    res.json({ message: 'Item moved successfully', item: { ...item, quantity: item.quantity - quantity, location_id: to_location_id } });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error moving item:', err);
    res.status(500).json({ error: err.message });
  }
});

// IMS Backend/src/routes/items.js
router.post('/move', authenticateToken, async (req, res) => {
  const { qr_code, from_location_id, to_location_id, quantity } = req.body;

  if (!qr_code || from_location_id === undefined || to_location_id === undefined || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'qr_code, from_location_id, to_location_id, and quantity > 0 are required' });
  }

  try {
    // Начинаем транзакцию
    await pool.query('BEGIN');

    // Проверим, существует ли товар
    const item = await Item.getByQR(qr_code);
    if (!item) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }

    // Проверим, что товар действительно находится на from_location_id
    if (item.location_id != from_location_id) { // != для сравнения с NULL
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Item is not at the specified "from" location' });
    }

    // Проверим, достаточно ли товара на from_location
    if (item.quantity < quantity) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough quantity to move' });
    }

    // Обновим количество (уменьшаем на from_location)
    await Item.updateQuantity(qr_code, -quantity);

    // Обновим локацию (теперь товар на to_location)
    await Item.updateLocation(qr_code, to_location_id);

    // Запишем историю перемещения
    await pool.query(`
      INSERT INTO movements (item_id, from_location_id, to_location_id, employee_id, action_type, quantity, date)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [item.id, from_location_id, to_location_id, req.user.id, 'move', quantity]);

    // Зафиксируем транзакцию
    await pool.query('COMMIT');

    res.json({ message: 'Item moved successfully', item: { ...item, quantity: item.quantity - quantity, location_id: to_location_id } });
  } catch (err) {
    await pool.query('ROLLBACK');
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
  const { qr_code, name, description, quantity, location_id } = req.body; // <-- location_id

  if (!qr_code || !name || !quantity || quantity <= 0 || !location_id) { // <-- location_id обязательна
    return res.status(400).json({ error: 'qr_code, name, quantity, and location_id are required' });
  }

  try {
    // Передаём location_id в Item.create
    const newItem = await Item.create({ qr_code, name, description, quantity, location_id }, req.user.username);
    res.status(201).json(newItem);
  } catch (err) {
    if (err.message.includes('duplicate key value violates unique constraint')) {
      res.status(400).json({ error: 'Item with this QR code already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;