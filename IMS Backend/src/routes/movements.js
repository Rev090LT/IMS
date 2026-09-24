// IMS Backend/src/routes/movements.js
import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// Применяем middleware аутентификации
router.use(authenticateToken);

// ============================================================================
// GET /api/movements (История перемещений)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        m.item_id,
        i.name AS item_name,
        i.part_number,
        i.qr_code,
        m.quantity,
        
        -- 🔥 ID складов с множественными алиасами
        m.from_location_id,
        m.from_location_id AS source_location_id,
        m.to_location_id,
        m.to_location_id AS target_location_id,
        
        -- 🔥 Названия складов со ВСЕМИ возможными именами, которые может ждать фронтенд
        l1.name AS source_name,
        l1.name AS from_location_name,
        l1.name AS source_location_name,
        l1.name AS from_name,
        l1.name AS source,
        
        l2.name AS target_name,
        l2.name AS to_location_name,
        l2.name AS target_location_name,
        l2.name AS to_name,
        l2.name AS target,
        
        m.comment AS notes,
        m.comment AS comment,
        m.moved_at AS date,
        m.moved_at AS moved_at,
        m.moved_at AS created_at
      FROM movements m
      LEFT JOIN items i ON m.item_id = i.id
      LEFT JOIN locations l1 ON m.from_location_id = l1.id
      LEFT JOIN locations l2 ON m.to_location_id = l2.id
      WHERE m.action_type = 'transfer'
      ORDER BY m.moved_at DESC
      LIMIT 100
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching movement history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/movements (Создание перемещения)
// ============================================================================
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // Начинаем транзакцию
    
    // Фронтенд отправляет: qr_code, from_location_id, to_location_id, quantity, notes
    const { qr_code, from_location_id, to_location_id, quantity, notes } = req.body;
    
    // 1. ВАЛИДАЦИЯ
    if (!qr_code || !quantity || quantity <= 0 || !from_location_id || !to_location_id) {
      return res.status(400).json({ error: 'Некорректные данные для перемещения' });
    }
    if (parseInt(from_location_id) === parseInt(to_location_id)) {
      return res.status(400).json({ error: 'Склад отправления и назначения совпадают' });
    }

    // 2. ИЩЕМ ТОВАР НА СКЛАДЕ-ИСТОЧНИКЕ ПО QR-КОДУ И ЛОКАЦИИ
    // 🔥 ИСПРАВЛЕНО: заменили category на category_id
    const sourceCheck = await client.query(`
      SELECT id, name, part_number, category_id, qr_code, quantity, location_id 
      FROM items 
      WHERE qr_code = $1 AND location_id = $2
    `, [qr_code, from_location_id]);

    if (sourceCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Товар с таким QR-кодом не найден на складе источнике' });
    }

    const sourceItem = sourceCheck.rows[0];
    const currentQty = parseFloat(sourceItem.quantity) || 0;
    
    if (currentQty < quantity) {
      return res.status(400).json({ error: `Недостаточно товара. Доступно: ${currentQty}, запрошено: ${quantity}` });
    }

    // 3. СПИСЫВАЕМ СО СКЛАДА-ИСТОЧНИКА (без изменений)
    await client.query(`
      UPDATE items 
      SET quantity = quantity - $1, updated_at = NOW()
      WHERE qr_code = $2 AND location_id = $3
    `, [quantity, qr_code, from_location_id]);

    // 4. ОПРИХОДУЕМ НА СКЛАД-НАЗНАЧЕНИЕ (ИСПРАВЛЕНО: ON CONFLICT по паре полей)
    await client.query(`
      INSERT INTO items (name, part_number, category_id, qr_code, quantity, location_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (qr_code, location_id) 
      DO UPDATE SET 
        quantity = items.quantity + EXCLUDED.quantity,
        updated_at = NOW()
    `, [
      sourceItem.name, 
      sourceItem.part_number, 
      sourceItem.category_id, 
      qr_code, 
      quantity, 
      to_location_id
    ]);
    // 5. ЗАПИСЫВАЕМ В ЖУРНАЛ ПЕРЕМЕЩЕНИЙ (используем правильные имена колонок!)
    await client.query(`
      INSERT INTO movements (
        item_id, 
        from_location_id, 
        to_location_id, 
        quantity, 
        action_type, 
        comment, 
        moved_at
      ) VALUES ($1, $2, $3, $4, 'transfer', $5, NOW())
    `, [sourceItem.id, from_location_id, to_location_id, quantity, notes || '']);

    await client.query('COMMIT'); // Подтверждаем изменения
    
    res.json({ 
      success: true, 
      message: 'Перемещение успешно выполнено' 
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Отменяем всё при ошибке
    console.error('❌ Error creating movement:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;