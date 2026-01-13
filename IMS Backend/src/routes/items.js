import express from 'express';
import { Item } from '../models/Item.js';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// <<<--- Маршрут для получения списка автомобилей --->
// <<<--- Обновим GET /api/cars --->
// В GET /api/items/cars
router.get('/cars', authenticateToken, async (req, res) => {
  try {
    // <<<--- Явно конвертируй дату в строку формата YYYY-MM-DD --->
    const result = await pool.query(`
      SELECT id, brand, model, vin, year, TO_CHAR(arrival_date, 'YYYY-MM-DD') AS arrival_date
      FROM cars
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cars:', err);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// <<<--- Обновим POST /api/cars --->
router.post('/cars', authenticateToken, async (req, res) => {
  const { brand, model, vin, arrival_date, year } = req.body; // <<<--- Добавили year

  if (!brand || !model || !vin || !arrival_date) {
    return res.status(400).json({ error: 'Brand, model, VIN, and arrival date are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO cars (brand, model, vin, arrival_date, year) VALUES ($1, $2, $3, $4, $5) RETURNING *', // <<<--- Добавили year
      [brand, model, vin, arrival_date, year || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding car:', err);
    if (err.code === '23505') { // duplicate key error
      res.status(400).json({ error: 'Car with this VIN already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add car' });
    }
  }
});
// <<<--- Обновим PUT /api/items/cars/:id --->
router.put('/cars/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { brand, model, year, vin, arrival_date } = req.body;

  if (!brand || !model || !vin || !arrival_date) {
    return res.status(400).json({ error: 'Brand, model, VIN, and arrival date are required' });
  }

  // <<<--- Проверь формат даты --->
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(arrival_date)) {
    return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
  }

  try {
    const result = await pool.query(
      'UPDATE cars SET brand=$1, model=$2, year=$3, vin=$4, arrival_date=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *',
      [brand, model, year || null, vin, arrival_date, parseInt(id)] // <<<--- Не конвертируем дату
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating car:', err);
    if (err.code === '23505') { // duplicate key error
      res.status(400).json({ error: 'Car with this VIN already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update car' });
    }
  }
});
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
router.post('/move', authenticateToken, async (req, res) => {
  const { qr_code, from_location_id, to_location_id, quantity, comment } = req.body; // <= Вот тут

  console.log('Received POST /api/items/move:', { qr_code, from_location_id, to_location_id, quantity, comment });

  if (!qr_code || !from_location_id || !to_location_id || quantity <= 0) { // <= Вот тут
    return res.status(400).json({ error: 'QR Code, From Location, To Location, and Quantity are required' }); // <= Вот тук
  }

  try {
    // <<<--- Вот тут найдём item_id по qr_code --->
    const itemResult = await pool.query('SELECT id FROM items WHERE qr_code = $1 AND location_id = $2', [qr_code, from_location_id]);
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in the specified location' });
    }

    const item = itemResult.rows[0];
    const item_id = item.id; // <= Вот тут

    // ... (остальной код, используя item_id)
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
    const existingItemResult = await pool.query('SELECT id FROM items WHERE qr_code = $1 AND location_id = $2', [qr_code, to_location_id]); // <= Вот тут
    if (existingItemResult.rows.length > 0) {
      // Объединим с существующим товаром
      await pool.query('UPDATE items SET quantity = quantity + $1 WHERE id = $2', [quantity, existingItemResult.rows[0].id]);
    } else {
      // Создадим новый товар в новой локации
      await pool.query(`
        INSERT INTO items (qr_code, name, description, quantity, status, location_id, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [qr_code, item.name, item.description, quantity, 'warehouse', to_location_id, item.created_by_user_id]);
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

// <<<--- УБЕРЁМ маршрут /locations из items.js --->>>

// <<<--- Обновим маршрут GET / --->
router.get('/', async (req, res) => {
  try {
    // <<<--- Добавим новые поля в SELECT --->
    const result = await pool.query(`
      SELECT 
        i.id,
        i.qr_code,
        i.name,
        i.description,
        i.quantity,
        i.status,
        l.name AS location_name,
        c.name AS category_name,
        m.name AS manufacturer_name,
        i.created_by_username,
        i.created_at,
        i.updated_at,
        i.part_number,  -- <<<--- Новое поле
        i.car_model,    -- <<<--- Новое поле
        i.vin_number    -- <<<--- Новое поле
      FROM items i
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN manufacturers m ON i.manufacturer_id = m.id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: err.message });
  }
});

// <<<--- Обновим маршрут POST / --->
router.post('/', authenticateToken, async (req, res) => {
  // <<<--- Добавим новые поля в деструктуризацию --->
  const { qr_code, name, description, quantity, location_id, category_id, manufacturer_id, part_number, car_model, vin_number } = req.body;

  console.log('Received POST /api/items:', { qr_code, name, description, quantity, location_id, category_id, manufacturer_id, part_number, car_model, vin_number });
  console.log('req.user:', req.user);

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

    // <<<--- Добавим новые поля в INSERT --->
    const result = await pool.query(
      `INSERT INTO items (qr_code, name, description, quantity, status, location_id, category_id, manufacturer_id, created_by_user_id, created_by_username, part_number, car_model, vin_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [qr_code, name, description, quantity, 'warehouse', location_id, category_id || null, manufacturer_id || null, req.user.id, req.user.username, part_number || null, car_model || null, vin_number || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in POST /api/items:', err);
    if (err.message.includes('duplicate key value violates unique constraint')) {
      res.status(400).json({ error: 'Item with this QR code already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get('/search-by-name/:name', authenticateToken, async (req, res) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // Ищем товары по имени (регистронезависимо, частичное совпадение)
    const result = await pool.query(
      'SELECT qr_code, name FROM items WHERE LOWER(name) LIKE LOWER($1) ORDER BY name LIMIT 10', // <= Возвращаем 10 результатов, сортируем по имени
      [`%${name}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Items not found' });
    }

    res.json(result.rows); // <= Вернём массив
  } catch (err) {
    console.error('Error searching items by name:', err);
    res.status(500).json({ error: err.message });
  }
});
// <<<--- Маршрут для обновления товара --->
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, quantity, status, location_id, category_id, manufacturer_id, part_number, car_model, vin_number } = req.body;

  console.log('Received PUT /api/items/:id:', { id, name, description, quantity, status, location_id, category_id, manufacturer_id, part_number, car_model, vin_number });

  if (!name || !quantity || !status || !location_id) {
    return res.status(400).json({ error: 'Name, quantity, status, and location_id are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE items SET name=$1, description=$2, quantity=$3, status=$4, location_id=$5, category_id=$6, manufacturer_id=$7, part_number=$8, car_model=$9, vin_number=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 RETURNING *`,
      [name, description, quantity, status, location_id, category_id || null, manufacturer_id || null, part_number || null, car_model || null, vin_number || null, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});
export default router;