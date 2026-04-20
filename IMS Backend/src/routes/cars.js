// IMS/server/routes/cars.js
import express from 'express';
import pool from '../config/db.js';
import { uploadCarPhotos } from '../middleware/upload.js';  // ← Импортируем наш middleware

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

export default router;