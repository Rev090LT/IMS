// IMS/server/routes/platforms.js
import express from 'express';
import pool from '../config/db.js';
import { guessPlatform } from '../utils/platform-guesser.js';

const router = express.Router();

// ============================================================================
// GET /api/platforms — Список всех платформ (с фильтрацией)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { manufacturer, search } = req.query;
    
    let query = 'SELECT * FROM vehicle_platforms WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (manufacturer) {
      query += ` AND manufacturer ILIKE $${paramIndex}`;
      params.push(`%${manufacturer}%`);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (platform_name ILIKE $${paramIndex} OR platform_code ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }
    
    query += ' ORDER BY manufacturer, platform_code';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/platforms/:code — Информация о конкретной платформе
// ============================================================================
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM vehicle_platforms WHERE platform_code = $1',
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Платформа не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching platform:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/platforms/:code/cars — Все авто на платформе
// ============================================================================
router.get('/:code/cars', async (req, res) => {
  try {
    const { code } = req.params;
    const { status = 'active' } = req.query;
    
    const result = await pool.query(`
      SELECT 
        c.id, c.vin, c.brand, c.model, c.generation, c.year, c.status,
        c.engine_type, c.transmission, c.color, c.mileage,
        cp.platform_confidence, cp.notes as platform_notes,
        (SELECT COUNT(*) FROM car_parts cp2 WHERE cp2.car_id = c.id) as parts_count,
        (SELECT COUNT(*) FROM car_parts cp2 WHERE cp2.car_id = c.id AND cp2.status = 'available') as available_parts
      FROM cars c
      JOIN car_platforms cp ON c.id = cp.car_id
      WHERE cp.platform_code = $1 
        AND c.status = $2
      ORDER BY c.brand, c.model, c.year
    `, [code, status]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching platform cars:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/platforms/stats — Статистика по платформам
// ============================================================================
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        vp.platform_code,
        vp.platform_name,
        vp.manufacturer,
        COUNT(cp.car_id) as cars_count,
        COUNT(DISTINCT c.brand || ' ' || c.model) as unique_models,
        MIN(c.year) as min_year,
        MAX(c.year) as max_year,
        SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_cars,
        SUM(CASE WHEN c.status = 'dismantling' THEN 1 ELSE 0 END) as dismantling_cars,
        SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed_cars
      FROM vehicle_platforms vp
      LEFT JOIN car_platforms cp ON vp.platform_code = cp.platform_code
      LEFT JOIN cars c ON cp.car_id = c.id
      GROUP BY vp.platform_code, vp.platform_name, vp.manufacturer
      ORDER BY cars_count DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/platforms — Создать новую платформу (админ)
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { platform_code, platform_name, manufacturer, years_active, description } = req.body;
    
    if (!platform_code || !platform_name || !manufacturer) {
      return res.status(400).json({ error: 'platform_code, platform_name и manufacturer обязательны' });
    }
    
    const result = await pool.query(
      `INSERT INTO vehicle_platforms 
       (platform_code, platform_name, manufacturer, years_active, description, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [platform_code, platform_name, manufacturer, years_active || null, description || null]
    );
    
    res.json({ success: true, platform: result.rows[0] });
  } catch (error) {
    console.error('Error creating platform:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PUT /api/platforms/:code — Обновить платформу (админ)
// ============================================================================
router.put('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { platform_name, manufacturer, years_active, description } = req.body;
    
    const result = await pool.query(
      `UPDATE vehicle_platforms 
       SET platform_name = COALESCE($1, platform_name),
           manufacturer = COALESCE($2, manufacturer),
           years_active = COALESCE($3, years_active),
           description = COALESCE($4, description)
       WHERE platform_code = $5
       RETURNING *`,
      [platform_name, manufacturer, years_active, description, code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Платформа не найдена' });
    }
    
    res.json({ success: true, platform: result.rows[0] });
  } catch (error) {
    console.error('Error updating platform:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/cars/:id/assign-platform — Привязать авто к платформе
// ============================================================================
router.post('/cars/:id/assign-platform', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform_code, confidence = 'verified', notes } = req.body;
    
    if (!platform_code) {
      return res.status(400).json({ error: 'platform_code обязателен' });
    }
    
    // Проверяем что платформа существует
    const platform = await pool.query(
      'SELECT platform_code FROM vehicle_platforms WHERE platform_code = $1',
      [platform_code]
    );
    
    if (platform.rows.length === 0) {
      return res.status(404).json({ error: 'Платформа не найдена' });
    }
    
    // Проверяем что авто существует
    const car = await pool.query('SELECT id FROM cars WHERE id = $1', [id]);
    if (car.rows.length === 0) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    // Привязываем (INSERT или UPDATE)
    const existing = await pool.query(
      'SELECT id FROM car_platforms WHERE car_id = $1',
      [id]
    );
    
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE car_platforms 
         SET platform_code = $1, platform_confidence = $2, notes = $3, updated_at = NOW()
         WHERE car_id = $4
         RETURNING *`,
        [platform_code, confidence, notes || null, id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO car_platforms 
         (car_id, platform_code, platform_confidence, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [id, platform_code, confidence, notes || null]
      );
    }
    
    res.json({ success: true, car_platform: result.rows[0] });
  } catch (error) {
    console.error('Error assigning platform:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/cars/:id/auto-assign-platform — Авто-определение платформы
// ============================================================================
router.post('/cars/:id/auto-assign-platform', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем данные авто
    const car = await pool.query(
      'SELECT brand, model, year, generation FROM cars WHERE id = $1',
      [id]
    );
    
    if (car.rows.length === 0) {
      return res.status(404).json({ error: 'Авто не найдено' });
    }
    
    const { brand, model, year, generation } = car.rows[0];
    
    // Угадываем платформу
    const guessedPlatform = guessPlatform(brand, model, year);
    
    if (!guessedPlatform) {
      return res.json({
        success: false,
        message: 'Не удалось определить платформу автоматически',
        suggestion: null
      });
    }
    
    // Получаем информацию о платформе
    const platformInfo = await pool.query(
      'SELECT * FROM vehicle_platforms WHERE platform_code = $1',
      [guessedPlatform]
    );
    
    // Привязываем к авто
    const existing = await pool.query(
      'SELECT id FROM car_platforms WHERE car_id = $1',
      [id]
    );
    
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE car_platforms 
         SET platform_code = $1, platform_confidence = 'probable', 
             notes = COALESCE(notes || '; ', '') || 'Авто-определение: ' || NOW(),
             updated_at = NOW()
         WHERE car_id = $2
         RETURNING *`,
        [guessedPlatform, id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO car_platforms 
         (car_id, platform_code, platform_confidence, notes, created_at, updated_at)
         VALUES ($1, $2, 'probable', 'Авто-определение', NOW(), NOW())
         RETURNING *`,
        [id, guessedPlatform]
      );
    }
    
    res.json({
      success: true,
      platform: {
        code: guessedPlatform,
        name: platformInfo.rows[0]?.platform_name,
        manufacturer: platformInfo.rows[0]?.manufacturer,
        confidence: 'probable'
      },
      message: `Платформа определена: ${guessedPlatform} (${platformInfo.rows[0]?.platform_name})`
    });
    
  } catch (error) {
    console.error('Error auto-assigning platform:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/platforms/suggest — Подсказки платформ для авто
// ============================================================================
router.get('/suggest', async (req, res) => {
  try {
    const { brand, model, year } = req.query;
    
    if (!brand || !model) {
      return res.status(400).json({ error: 'brand и model обязательны' });
    }
    
    // Угадываем платформу
    const guessedPlatform = guessPlatform(brand, model, year);
    
    // Получаем информацию
    let platformInfo = null;
    if (guessedPlatform) {
      const result = await pool.query(
        'SELECT * FROM vehicle_platforms WHERE platform_code = $1',
        [guessedPlatform]
      );
      platformInfo = result.rows[0] || null;
    }
    
    // Ищем похожие платформы по описанию
    const similar = await pool.query(
      `SELECT platform_code, platform_name, manufacturer, description
       FROM vehicle_platforms
       WHERE description ILIKE $1 OR platform_name ILIKE $1
       LIMIT 5`,
      [`%${model}%`]
    );
    
    res.json({
      guessed: guessedPlatform,
      platform_info: platformInfo,
      similar: similar.rows
    });
  } catch (error) {
    console.error('Error suggesting platform:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;