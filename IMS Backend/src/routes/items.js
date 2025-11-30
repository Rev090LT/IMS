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
  const { qr_code, from_location, to_location, quantity } = req.body;

  if (!qr_code || !from_location || !to_location || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'qr_code, from_location, to_location, and quantity > 0 are required' });
  }

  try {
    // Проверим, достаточно ли товара на складе
    const item = await Item.getByQR(qr_code);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough quantity to move' });
    }

    // Обновим количество
    const updatedItem = await Item.updateQuantity(qr_code, -quantity);

    // Запишем перемещение в историю (пока просто возвращаем успех)
    // TODO: добавить запись в таблицу movements

    res.json({ message: 'Item moved successfully', item: updatedItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить все товары (GET /)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить новый товар (POST /) - Добавляем этот маршрут
router.post('/', authenticateToken, async (req, res) => {
  const { qr_code, name, description, quantity, location } = req.body;

  if (!qr_code || !name || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'qr_code, name, and quantity > 0 are required' });
  }

  try {
    const newItem = await Item.create({ qr_code, name, description, quantity, location });
    res.status(201).json(newItem);
  } catch (err) {
    // Если ошибка уникальности (qr_code уже существует)
    if (err.message.includes('duplicate key value violates unique constraint')) {
      res.status(400).json({ error: 'Item with this QR code already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Простой запрос для получения всех товаров
    const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err); // Добавим лог
    res.status(500).json({ error: err.message });
  }
});
export default router;