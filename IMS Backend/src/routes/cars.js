// IMS/server/routes/cars.js
import express from 'express';
import pool from '../config/db.js';
import { uploadCarPhotos } from '../middleware/upload.js';  // ← Импортируем наш middleware
import { decodeVinSmart, guessPlatformFromData } from '../utils/vin-decoder.js';

const router = express.Router();

// Получить все автомобили (с фильтрацией)
router.get('/', async (req, res) => {
  try {
    const { brand, model, status, search } = req.query;
    
    let query = `
      SELECT 
        c.*,
        l.name as location_name,
        u.username as created_by_username,
        (SELECT COUNT(*) FROM car_parts cp WHERE cp.car_id = c.id) as parts_count,
        (SELECT COUNT(*) FROM car_parts cp WHERE cp.car_id = c.id AND cp.status = 'available') as available_parts
      FROM cars c
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (brand) {
      query += ` AND c.brand ILIKE $${paramIndex}`;
      params.push(`%${brand}%`);
      paramIndex++;
    }

    if (model) {
      query += ` AND c.model ILIKE $${paramIndex}`;
      params.push(`%${model}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (c.vin ILIKE $${paramIndex} OR c.brand ILIKE $${paramIndex} OR c.model ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Ошибка при получении автомобилей' });
  }
});

// Получить автомобиль по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const carResult = await pool.query(
      'SELECT * FROM cars WHERE id = $1',
      [id]
    );

    if (carResult.rows.length === 0) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }

    const car = carResult.rows[0];

    // Получаем юридическую информацию
    const legalResult = await pool.query(
      'SELECT * FROM car_legal_info WHERE car_id = $1',
      [id]
    );

    // Получаем совместимые авто
    const compatibilityResult = await pool.query(
      `SELECT 
        cc.*,
        c2.vin as compatible_vin,
        c2.year as compatible_year
       FROM car_compatibility cc
       LEFT JOIN cars c2 ON cc.compatible_brand = c2.brand 
        AND cc.compatible_model = c2.model
       WHERE cc.source_car_id = $1`,
      [id]
    );

    // Получаем запчасти на этом авто
    const partsResult = await pool.query(
      'SELECT * FROM car_parts WHERE car_id = $1 ORDER BY part_category, part_name',
      [id]
    );

    res.json({
      car,
      legal_info: legalResult.rows[0] || null,
      compatibility: compatibilityResult.rows,
      parts: partsResult.rows
    });
  } catch (error) {
    console.error('Error fetching car details:', error);
    res.status(500).json({ error: 'Ошибка при получении информации об автомобиле' });
  }
});

// Поиск по VIN
router.get('/search/vin/:vin', async (req, res) => {
  try {
    const { vin } = req.params;
    
    // Ищем точное совпадение
    const exactMatch = await pool.query(
      'SELECT * FROM cars WHERE vin = $1',
      [vin]
    );

    // Ищем совместимые авто
    const compatible = await pool.query(
      `SELECT DISTINCT ON (c.id)
        c.*,
        cc.compatibility_note
       FROM cars c
       JOIN car_compatibility cc ON c.id = cc.source_car_id
       WHERE cc.compatible_brand = (SELECT brand FROM cars WHERE vin = $1)
         AND cc.compatible_model = (SELECT model FROM cars WHERE vin = $1)
       ORDER BY c.id`,
      [vin]
    );

    res.json({
      exact: exactMatch.rows[0] || null,
      compatible: compatible.rows
    });
  } catch (error) {
    console.error('Error searching by VIN:', error);
    res.status(500).json({ error: 'Ошибка поиска по VIN' });
  }
});

// Создать автомобиль
router.post('/', async (req, res) => {
  try {
    const {
      vin, brand, model, generation, year, color,
      engine_type, engine_volume, transmission, drive_type, body_type,
      mileage, arrival_date, purchase_price, location_id, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO cars 
       (vin, brand, model, generation, year, color, engine_type, engine_volume,
        transmission, drive_type, body_type, mileage, arrival_date, purchase_price,
        location_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [vin, brand, model, generation || null, year || null, color || null,
       engine_type || null, engine_volume || null, transmission || null,
       drive_type || null, body_type || null, mileage || null, arrival_date,
       purchase_price || null, location_id || null, notes || null]
    );

    res.json({ success: true, car: result.rows[0] });
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Ошибка при создании автомобиля' });
  }
});

// Добавить совместимость
router.post('/:id/compatibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { compatible_brand, compatible_model, compatible_generation, compatibility_note } = req.body;

    const result = await pool.query(
      `INSERT INTO car_compatibility 
       (source_car_id, compatible_brand, compatible_model, compatible_generation, compatibility_note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source_car_id, compatible_brand, compatible_model, compatible_generation) 
       DO UPDATE SET compatibility_note = $5
       RETURNING *`,
      [id, compatible_brand, compatible_model, compatible_generation || null, compatibility_note || null]
    );

    res.json({ success: true, compatibility: result.rows[0] });
  } catch (error) {
    console.error('Error adding compatibility:', error);
    res.status(500).json({ error: 'Ошибка при добавлении совместимости' });
  }
});

// Добавить запчасть на авто
router.post('/:id/parts', async (req, res) => {
  try {
    const { id } = req.params;
    const { part_name, part_category, part_number, condition, price, status, location_note, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO car_parts 
       (car_id, part_name, part_category, part_number, condition, price, status, location_note, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, part_name, part_category || null, part_number || null, condition || null,
       price || null, status || 'available', location_note || null, notes || null]
    );

    res.json({ success: true, part: result.rows[0] });
  } catch (error) {
    console.error('Error adding car part:', error);
    res.status(500).json({ error: 'Ошибка при добавлении запчасти' });
  }
});

// Обновить юридическую информацию
router.put('/:id/legal', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pts_number, sts_number, registration_number, owner_name, owner_inn,
      purchase_contract_number, purchase_contract_date, purchase_contract_url,
      customs_declaration, write_off_reason, write_off_date, is_arrested, is_залоговый, notes
    } = req.body;

    // Проверяем существует ли запись
    const existing = await pool.query(
      'SELECT id FROM car_legal_info WHERE car_id = $1',
      [id]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE car_legal_info 
         SET pts_number = $1, sts_number = $2, registration_number = $3,
             owner_name = $4, owner_inn = $5, purchase_contract_number = $6,
             purchase_contract_date = $7, purchase_contract_url = $8,
             customs_declaration = $9, write_off_reason = $10, write_off_date = $11,
             is_arrested = $12, is_залоговый = $13, notes = $14, updated_at = CURRENT_TIMESTAMP
         WHERE car_id = $15
         RETURNING *`,
        [pts_number, sts_number, registration_number, owner_name, owner_inn,
         purchase_contract_number, purchase_contract_date, purchase_contract_url,
         customs_declaration, write_off_reason, write_off_date, is_arrested, is_залоговый, notes, id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO car_legal_info 
         (car_id, pts_number, sts_number, registration_number, owner_name, owner_inn,
          purchase_contract_number, purchase_contract_date, purchase_contract_url,
          customs_declaration, write_off_reason, write_off_date, is_arrested, is_залоговый, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [id, pts_number, sts_number, registration_number, owner_name, owner_inn,
         purchase_contract_number, purchase_contract_date, purchase_contract_url,
         customs_declaration, write_off_reason, write_off_date, is_arrested, is_залоговый, notes]
      );
    }

    res.json({ success: true, legal_info: result.rows[0] });
  } catch (error) {
    console.error('Error updating legal info:', error);
    res.status(500).json({ error: 'Ошибка при обновлении юридической информации' });
  }
});

// Удалить автомобиль
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cars WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Ошибка при удалении автомобиля' });
  }
});

// PUT /api/cars/:id - обновление технической информации
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand, model, generation, year, color, engine_type, engine_volume,
      transmission, drive_type, body_type, mileage, arrival_date,
      purchase_price, status, location_id, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE cars SET
        brand = COALESCE($1, brand),
        model = COALESCE($2, model),
        generation = COALESCE($3, generation),
        year = COALESCE($4, year),
        color = COALESCE($5, color),
        engine_type = COALESCE($6, engine_type),
        engine_volume = COALESCE($7, engine_volume),
        transmission = COALESCE($8, transmission),
        drive_type = COALESCE($9, drive_type),
        body_type = COALESCE($10, body_type),
        mileage = COALESCE($11, mileage),
        arrival_date = COALESCE($12, arrival_date),
        purchase_price = COALESCE($13, purchase_price),
        status = COALESCE($14, status),
        location_id = COALESCE($15, location_id),
        notes = COALESCE($16, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $17 RETURNING *`,
      [brand, model, generation, year, color, engine_type, engine_volume,
       transmission, drive_type, body_type, mileage, arrival_date,
       purchase_price, status, location_id, notes, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Авто не найдено' });
    res.json({ success: true, car: result.rows[0] });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Ошибка: ' + error.message });
  }
});

// PUT /api/cars/:id/legal - обновление юридической информации
router.put('/:id/legal', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pts_number, sts_number, registration_number, owner_name, owner_inn,
      purchase_contract_number, purchase_contract_date, purchase_contract_url,
      customs_declaration, write_off_reason, write_off_date,
      is_arrested, is_залоговый, notes
    } = req.body;

    const existing = await pool.query('SELECT id FROM car_legal_info WHERE car_id = $1', [id]);
    let result;

    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE car_legal_info SET
          pts_number = COALESCE($1, pts_number),
          sts_number = COALESCE($2, sts_number),
          registration_number = COALESCE($3, registration_number),
          owner_name = COALESCE($4, owner_name),
          owner_inn = COALESCE($5, owner_inn),
          purchase_contract_number = COALESCE($6, purchase_contract_number),
          purchase_contract_date = COALESCE($7, purchase_contract_date),
          purchase_contract_url = COALESCE($8, purchase_contract_url),
          customs_declaration = COALESCE($9, customs_declaration),
          write_off_reason = COALESCE($10, write_off_reason),
          write_off_date = COALESCE($11, write_off_date),
          is_arrested = COALESCE($12, is_arrested),
          is_залоговый = COALESCE($13, is_залоговый),
          notes = COALESCE($14, notes),
          updated_at = CURRENT_TIMESTAMP
         WHERE car_id = $15 RETURNING *`,
        [pts_number, sts_number, registration_number, owner_name, owner_inn,
         purchase_contract_number, purchase_contract_date, purchase_contract_url,
         customs_declaration, write_off_reason, write_off_date,
         is_arrested, is_залоговый, notes, id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO car_legal_info 
         (car_id, pts_number, sts_number, registration_number, owner_name, owner_inn,
          purchase_contract_number, purchase_contract_date, purchase_contract_url,
          customs_declaration, write_off_reason, write_off_date,
          is_arrested, is_залоговый, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [id, pts_number, sts_number, registration_number, owner_name, owner_inn,
         purchase_contract_number, purchase_contract_date, purchase_contract_url,
         customs_declaration, write_off_reason, write_off_date,
         is_arrested, is_залоговый, notes]
      );
    }

    res.json({ success: true, legal_info: result.rows[0] });
  } catch (error) {
    console.error('Error updating legal info:', error);
    res.status(500).json({ error: 'Ошибка: ' + error.message });
  }
});

// POST /api/cars/:id/photos
router.post('/:id/photos', uploadCarPhotos.array('photos', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📤 Upload request for car #', id);
    console.log('📁 Files received:', req.files?.length || 0);
    console.log('📁 Filenames:', req.files?.map(f => f.filename));
    
    const car = await pool.query('SELECT photos FROM cars WHERE id = $1', [id]);
    if (car.rows.length === 0) {
      console.error('❌ Car not found:', id);
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    // 🔧 Безопасное получение existingPhotos
    let existingPhotos = car.rows[0].photos;
    console.log(' Existing photos from DB:', existingPhotos, typeof existingPhotos);
    
    // Если null/undefined — создаём пустой массив
    if (existingPhotos === null || existingPhotos === undefined) {
      existingPhotos = [];
    }
    // Если строка — парсим JSON
    else if (typeof existingPhotos === 'string') {
      try {
        existingPhotos = JSON.parse(existingPhotos);
      } catch (e) {
        console.error('⚠️ Failed to parse existing photos, resetting to []');
        existingPhotos = [];
      }
    }
    // Если не массив — конвертируем
    else if (!Array.isArray(existingPhotos)) {
      console.warn('⚠️ existingPhotos is not an array, converting:', typeof existingPhotos);
      existingPhotos = Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos];
    }
    
    // 🔧 Создаём новые URL ТОЛЬКО как массив
    const newUrls = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        const url = `/uploads/cars/${file.filename}`;
        newUrls.push(url);
      });
    }
    
    console.log('🆕 New URLs:', newUrls);
    
    // 🔧 Явно создаём новый массив (не изменяем existingPhotos!)
    const allPhotos = [];
    existingPhotos.forEach(photo => allPhotos.push(photo));
    newUrls.forEach(photo => allPhotos.push(photo));
    
    console.log('💾 Final photos array:', allPhotos);
    console.log('💾 Type:', Array.isArray(allPhotos) ? 'ARRAY' : typeof allPhotos);
    
    // 🔧 Сериализуем в JSON СТРОКУ перед отправкой
    const photosJson = JSON.stringify(allPhotos);
    console.log('📝 JSON string:', photosJson);
    
    // Проверяем что это валидный JSON
    try {
      JSON.parse(photosJson);
      console.log('✅ Valid JSON');
    } catch (e) {
      console.error('❌ Invalid JSON:', e);
      throw new Error('Invalid JSON generated');
    }
    
    // 🔧 Обновляем БД с явным указанием типа
    await pool.query(
      'UPDATE cars SET photos = $1::jsonb WHERE id = $2',
      [photosJson, id]
    );
    
    console.log('✅ Photos saved successfully');
    res.json({ success: true, photos: allPhotos });
    
  } catch (error) {
    console.error('❌ Error uploading car photos:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Ошибка при загрузке фото: ' + error.message });
  }
});

// DELETE /api/cars/:id/photos
router.delete('/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    let { photo_url } = req.body;
    
    console.log('🗑️ Delete request for car #', id);
    console.log('📥 Request body:', req.body);
    console.log('📷 photo_url type:', typeof photo_url, photo_url);
    
    // 🔧 Преобразуем photo_url в строку если нужно
    if (!photo_url) {
      return res.status(400).json({ error: 'photo_url is required' });
    }
    
    // Если это объект — извлекаем URL
    if (typeof photo_url === 'object') {
      if (photo_url.url) {
        photo_url = photo_url.url;
      } else if (photo_url.photo_url) {
        photo_url = photo_url.photo_url;
      } else {
        photo_url = JSON.stringify(photo_url);
      }
    }
    
    // Преобразуем в строку
    photo_url = String(photo_url).trim();
    
    console.log('✅ Final photo_url:', photo_url);
    
    if (!photo_url) {
      return res.status(400).json({ error: 'Invalid photo_url' });
    }
    
    const car = await pool.query('SELECT photos FROM cars WHERE id = $1', [id]);
    if (car.rows.length === 0) {
      console.error('❌ Car not found:', id);
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    // Безопасное получение массива фото
    let photos = car.rows[0].photos;
    console.log('📸 Existing photos:', photos, typeof photos);
    
    if (photos === null || photos === undefined) {
      photos = [];
    } else if (typeof photos === 'string') {
      try {
        photos = JSON.parse(photos);
      } catch (e) {
        console.error('⚠️ Failed to parse photos, resetting to []');
        photos = [];
      }
    } else if (!Array.isArray(photos)) {
      console.warn('⚠️ photos is not an array, converting');
      photos = Array.isArray(photos) ? photos : [photos];
    }
    
    // Фильтруем
    const updated = [];
    photos.forEach(p => {
      if (String(p) !== photo_url) {
        updated.push(String(p));
      }
    });
    
    console.log('🗑️ Removed photo, remaining:', updated);
    
    // Явная сериализация
    const photosJson = JSON.stringify(updated);
    console.log('📝 JSON string:', photosJson);
    
    // Валидация
    try {
      JSON.parse(photosJson);
      console.log('✅ Valid JSON');
    } catch (e) {
      console.error('❌ Invalid JSON:', e);
      throw new Error('Invalid JSON generated');
    }
    
    // Обновляем БД
    await pool.query(
      'UPDATE cars SET photos = $1::jsonb WHERE id = $2',
      [photosJson, id]
    );
    
    // Удаляем файл с диска
    if (photo_url.startsWith('/uploads/cars/')) {
      const fileName = photo_url.split('/').pop();
      const filePath = path.join(__dirname, '..', 'uploads', 'cars', fileName);
      
      import('fs').then(fs => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ File deleted from disk:', filePath);
        }
      }).catch(err => {
        console.error('⚠️ Could not delete file from disk:', err);
      });
    }
    
    console.log('✅ Photo deleted successfully');
    res.json({ success: true, photos: updated });
    
  } catch (error) {
    console.error('❌ Error deleting car photo:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Ошибка при удалении фото: ' + error.message });
  }
});

// ============================================================================
// ПОИСК СОВМЕСТИМЫХ АВТО ПО VIN/МОДЕЛИ
// ============================================================================

// GET /api/cars/:id/compatible — получить все совместимые авто
router.get('/:id/compatible', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, confidence } = req.query;
    
    // Проверяем существование авто
    const car = await pool.query('SELECT id, brand, model, generation, year FROM cars WHERE id = $1', [id]);
    if (car.rows.length === 0) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    
    // 🔧 ПРОСТОЙ ЗАПРОС: без DISTINCT json_build_object
    let query = `
      SELECT 
        pc.compatible_brand,
        pc.compatible_model,
        pc.compatible_generation,
        pc.compatible_years,
        pc.compatibility_type,
        pc.confidence_level,
        COUNT(DISTINCT pc.source_part_id) as parts_count,
        STRING_AGG(DISTINCT pc.source_part_category, ', ') FILTER (WHERE pc.source_part_category IS NOT NULL) as categories
      FROM part_compatibility pc
      WHERE pc.source_car_id = $1
    `;
    
    const params = [id];
    let paramIndex = 2;
    
    // Фильтры
    if (category) {
      query += ` AND (pc.part_category_filter = $${paramIndex} OR pc.source_part_category = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }
    
    if (confidence) {
      query += ` AND pc.confidence_level = $${paramIndex}`;
      params.push(confidence);
      paramIndex++;
    }
    
    // 🔧 Группировка только по скалярным полям (без jsonb)
    query += `
      GROUP BY 
        pc.compatible_brand, 
        pc.compatible_model, 
        pc.compatible_generation,
        pc.compatibility_type,
        pc.confidence_level,
        pc.compatible_years
      ORDER BY parts_count DESC, compatible_brand, compatible_model
    `;
    
    const result = await pool.query(query, params);
    
    // 🔧 Отдельный запрос для деталей запчастей (если нужно)
    const partsByModel = {};
    for (const row of result.rows) {
      const partsQuery = `
        SELECT 
          source_part_name,
          source_part_category,
          compatibility_type,
          compatibility_notes
        FROM part_compatibility
        WHERE source_car_id = $1
          AND compatible_brand = $2
          AND compatible_model = $3
          AND (compatible_generation = $4 OR compatible_generation IS NULL)
        LIMIT 10
      `;
      const partsResult = await pool.query(partsQuery, [
        id, 
        row.compatible_brand, 
        row.compatible_model, 
        row.compatible_generation || null
      ]);
      partsByModel[`${row.compatible_brand}_${row.compatible_model}`] = partsResult.rows;
    }
    
    // Форматируем результат
    const formattedResults = result.rows.map(row => ({
      ...row,
      parts: partsByModel[`${row.compatible_brand}_${row.compatible_model}`] || [],
      // Парсим compatible_years если он пришёл как строка
      compatible_years: typeof row.compatible_years === 'string' 
        ? (() => { try { return JSON.parse(row.compatible_years); } catch { return row.compatible_years; } })()
        : row.compatible_years
    }));
    
    res.json({
      source_car: car.rows[0],
      compatible_models: formattedResults,
      total_models: formattedResults.length
    });
    
  } catch (error) {
    console.error('Error fetching compatible cars:', error);
    res.status(500).json({ error: 'Ошибка: ' + error.message });
  }
});

// ============================================================================
// ПОИСК ЗАПЧАСТЕЙ ДЛЯ СОВМЕСТИМОГО АВТО
// ============================================================================

// GET /api/cars/:id/compatible/:targetBrand/:targetModel/parts
router.get('/:id/compatible/:targetBrand/:targetModel/parts', async (req, res) => {
  try {
    const { id, targetBrand, targetModel } = req.params;
    const { generation, category } = req.query;
    
    let query = `
      SELECT 
        pc.source_part_name,
        pc.source_part_category,
        pc.compatibility_type,
        pc.compatibility_notes,
        pc.confidence_level,
        cp.condition,
        cp.price,
        cp.status as part_status,
        cp.location_note
      FROM part_compatibility pc
      LEFT JOIN car_parts cp ON pc.source_part_id = cp.id
      WHERE pc.source_car_id = $1
        AND pc.compatible_brand = $2
        AND pc.compatible_model = $3
    `;
    
    const params = [id, targetBrand, targetModel];
    let paramIndex = 4;
    
    if (generation) {
      query += ` AND (pc.compatible_generation = $${paramIndex} OR pc.compatible_generation IS NULL)`;
      params.push(generation);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND (pc.part_category_filter = $${paramIndex} OR pc.source_part_category = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }
    
    query += ` ORDER BY pc.source_part_category, pc.source_part_name`;
    
    const result = await pool.query(query, params);
    
    res.json({
      source_car_id: id,
      target: { brand: targetBrand, model: targetModel, generation },
      parts: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching compatible parts:', error);
    res.status(500).json({ error: 'Ошибка: ' + error.message });
  }
});

// ============================================================================
// ДОБАВИТЬ СОВМЕСТИМОСТЬ
// ============================================================================

// POST /api/cars/:id/compatibility
router.post('/:id/compatibility', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      compatible_brand,
      compatible_model,
      compatible_generation,
      compatible_years, // массив [1999, 2000]
      compatible_engine_types,
      compatibility_type = 'bidirectional',
      part_category_filter,
      compatibility_notes,
      confidence_level = 'verified',
      // Опционально: конкретные запчасти
      parts = [] // [{part_id: 123, part_name: "Генератор"}, ...]
    } = req.body;
    
    if (!compatible_brand || !compatible_model) {
      return res.status(400).json({ error: 'Марка и модель совместимого авто обязательны' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Если указаны конкретные запчасти — создаём записи для каждой
      if (parts.length > 0) {
        for (const part of parts) {
          await client.query(
            `INSERT INTO part_compatibility 
             (source_car_id, source_part_id, source_part_name, source_part_category,
              compatible_brand, compatible_model, compatible_generation,
              compatible_years, compatible_engine_types,
              compatibility_type, part_category_filter,
              compatibility_notes, confidence_level, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (source_car_id, source_part_id, compatible_brand, compatible_model, compatible_generation)
             DO UPDATE SET 
               compatibility_notes = COALESCE($12, part_compatibility.compatibility_notes),
               updated_at = CURRENT_TIMESTAMP`,
            [
              id,
              part.part_id || null,
              part.part_name,
              part.category || null,
              compatible_brand,
              compatible_model,
              compatible_generation || null,
              compatible_years || null,
              compatible_engine_types || null,
              compatibility_type,
              part_category_filter || null,
              compatibility_notes || null,
              confidence_level,
              req.user?.id || null
            ]
          );
        }
      } else {
        // Если запчасти не указаны — создаём "общую" совместимость для категории
        await client.query(
          `INSERT INTO part_compatibility 
           (source_car_id, source_part_name, source_part_category,
            compatible_brand, compatible_model, compatible_generation,
            compatible_years, compatible_engine_types,
            compatibility_type, part_category_filter,
            compatibility_notes, confidence_level, created_by)
           VALUES ($1, 'Все запчасти категории', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT DO NOTHING`,
          [
            id,
            part_category_filter || null,
            compatible_brand,
            compatible_model,
            compatible_generation || null,
            compatible_years || null,
            compatible_engine_types || null,
            compatibility_type,
            part_category_filter || null,
            compatibility_notes || null,
            confidence_level,
            req.user?.id || null
          ]
        );
      }
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'Совместимость добавлена' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error adding compatibility:', error);
    res.status(500).json({ error: 'Ошибка: ' + error.message });
  }
});

// ============================================================================
// VIN ДЕКОДЕР (интеграция с внешними API)
// ============================================================================

// GET /api/cars/vin/decode/:vin
router.get('/vin/decode/:vin', async (req, res) => {
  try {
    const { vin } = req.params;
    
    // 1. Сначала ищем в своей базе
    const localCar = await pool.query(
      'SELECT id, brand, model, generation, year, engine_type FROM cars WHERE vin = $1',
      [vin.toUpperCase()]
    );
    
    if (localCar.rows.length > 0) {
      return res.json({
        source: 'local',
        found: true,
        car: localCar.rows[0]
      });
    }
    
    // 2. Если не нашли — пробуем внешние API (опционально)
    // NHTSA API (бесплатно, но только для рынка США)
    try {
      const nhtsaResponse = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
      );
      const nhtsaData = await nhtsaResponse.json();
      
      if (nhtsaData.Results?.length > 0) {
        const result = nhtsaData.Results[0];
        const decoded = {
          source: 'nhtsa',
          found: true,
          vin: vin.toUpperCase(),
          brand: result.Make?.Value || null,
          model: result.Model?.Value || null,
          year: result.ModelYear?.Value ? parseInt(result.ModelYear.Value) : null,
          body_type: result.BodyClass?.Value || null,
          engine: result.EngineConfiguration?.Value || null,
          engine_cylinders: result.Cylinders?.Value ? parseInt(result.Cylinders.Value) : null,
          drive_type: result.DriveType?.Value || null,
          plant_country: result.PlantCountry?.Value || null,
          raw: result // Все данные на всякий случай
        };
        
        return res.json(decoded);
      }
    } catch (e) {
      console.log('NHTSA API error (optional):', e.message);
      // Не прерываем выполнение, просто пробуем дальше
    }
    
    // 3. Если ничего не нашли
    res.json({
      source: null,
      found: false,
      vin: vin.toUpperCase(),
      message: 'Автомобиль не найден в базе и не распознан внешними сервисами'
    });
    
  } catch (error) {
    console.error('Error decoding VIN:', error);
    res.status(500).json({ error: 'Ошибка декодирования VIN: ' + error.message });
  }
});

// ============================================================================
// ГИБРИДНАЯ СОВМЕСТИМОСТЬ — НОВЫЕ МАРШРУТЫ
// ============================================================================


// 1. Поиск авто на той же платформе
router.get('/:id/same-platform', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Находим платформу текущего авто
    const platform = await pool.query(`
      SELECT cp.platform_code, vp.platform_name, vp.manufacturer, cp.platform_confidence
      FROM car_platforms cp
      JOIN vehicle_platforms vp ON cp.platform_code = vp.platform_code
      WHERE cp.car_id = $1 AND cp.platform_confidence != 'unknown'
    `, [id]);
    
    if (platform.rows.length === 0) {
      return res.json({ 
        source_car_id: id, 
        platform: null, 
        compatible_cars: [],
        message: 'Платформа для этого авто не определена'
      });
    }
    
    // Ищем другие авто на той же платформе
    const compatible = await pool.query(`
      SELECT 
        c.id, c.vin, c.brand, c.model, c.generation, c.year, c.status,
        c.engine_type, c.transmission,
        cp.platform_confidence,
        (SELECT COUNT(*) FROM car_parts cp2 WHERE cp2.car_id = c.id AND cp2.status = 'available') as available_parts
      FROM cars c
      JOIN car_platforms cp ON c.id = cp.car_id
      WHERE cp.platform_code = $1 
        AND c.id != $2 
        AND c.status = 'active'
      ORDER BY c.brand, c.model, c.year
      LIMIT 50
    `, [platform.rows[0].platform_code, id]);
    
    res.json({
      source_car_id: id,
      platform: platform.rows[0],
      compatible_cars: compatible.rows,
      total: compatible.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching same-platform cars:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Поиск по характеристикам (двигатель, КПП, годы)
router.get('/:id/compatible-by-specs', async (req, res) => {
  try {
    const { id } = req.params;
    const { min_score = 2 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        compatible_id as id,
        compatible_brand as brand,
        compatible_model as model,
        compatible_generation as generation,
        compatible_year as year,
        compatibility_score,
        engine_match,
        transmission_match,
        year_match,
        generation_match
      FROM car_compatibility_by_specs
      WHERE source_id = $1 AND compatibility_score >= $2
      ORDER BY compatibility_score DESC, compatible_brand, compatible_model
      LIMIT 50
    `, [id, parseInt(min_score)]);
    
    res.json({
      source_car_id: id,
      min_score: parseInt(min_score),
      compatible_cars: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching spec-compatible cars:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Умный VIN-поиск (локально + внешние API)
router.get('/vin/decode-smart/:vin', async (req, res) => {
  try {
    const { vin } = req.params;
    const result = await decodeVinSmart(vin, true, pool);
    
    // Если нашли во внешнем API — пытаемся угадать платформу
    if (result.found && result.source !== 'local') {
      const guessedPlatform = guessPlatformFromData(result.data);
      result.platform_guess = guessedPlatform;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error in smart VIN decode:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Быстрое добавление авто из VIN-поиска
router.post('/vin/add-from-decode', async (req, res) => {
  try {
    const { vin, decoded_data, platform_code } = req.body;
    
    if (!vin || !decoded_data?.brand || !decoded_data?.model) {
      return res.status(400).json({ error: 'VIN, марка и модель обязательны' });
    }
    
    const result = await pool.query(
      `INSERT INTO cars 
       (vin, brand, model, generation, year, engine_type, transmission, drive_type, 
        body_type, status, arrival_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', CURRENT_DATE, $10)
       RETURNING *`,
      [
        vin.toUpperCase(),
        decoded_data.brand,
        decoded_data.model,
        decoded_data.generation || null,
        decoded_data.year || null,
        decoded_data.engine_type || null,
        decoded_data.transmission || null,
        decoded_data.drive_type || null,
        decoded_data.body_type || null,
        req.user?.id || null
      ]
    );
    
    const carId = result.rows[0].id;
    
    // Если угадали платформу — привязываем
    if (platform_code) {
      await pool.query(
        `INSERT INTO car_platforms (car_id, platform_code, platform_confidence, notes)
         VALUES ($1, $2, 'probable', 'Авто-определение через VIN decode')`,
        [carId, platform_code]
      );
    }
    
    res.json({ 
      success: true, 
      car: result.rows[0],
      message: 'Автомобиль добавлен из VIN-декодера'
    });
    
  } catch (error) {
    console.error('Error adding car from VIN decode:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Голосование за совместимость
router.post('/compatibility/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { vote_type, comment } = req.body;
    
    if (!['confirm', 'reject'].includes(vote_type)) {
      return res.status(400).json({ error: 'vote_type must be "confirm" or "reject"' });
    }
    
    await pool.query(
      `INSERT INTO compatibility_votes (compatibility_id, user_id, vote_type, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (compatibility_id, user_id) 
       DO UPDATE SET vote_type = $3, comment = $4, created_at = NOW()`,
      [id, req.user?.id, vote_type, comment || null]
    );
    
    res.json({ success: true, message: 'Голос записан' });
    
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Привязка авто к платформе
router.post('/:id/platform', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform_code, confidence = 'verified', notes } = req.body;
    
    // Проверяем что платформа существует
    const platform = await pool.query(
      'SELECT platform_code FROM vehicle_platforms WHERE platform_code = $1',
      [platform_code]
    );
    
    if (platform.rows.length === 0) {
      return res.status(400).json({ error: 'Платформа не найдена' });
    }
    
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
        `INSERT INTO car_platforms (car_id, platform_code, platform_confidence, notes)
         VALUES ($1, $2, $3, $4)
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

export default router;