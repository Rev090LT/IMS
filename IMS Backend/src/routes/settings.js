// IMS Backend/src/routes/settings.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ============================================================================
// GET /api/settings — Получить все настройки
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM system_settings WHERE is_active = TRUE';
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    query += ' ORDER BY category, setting_key';
    
    const result = await pool.query(query, params);
    
    // Преобразуем в удобный формат
    const settings = {};
    result.rows.forEach(row => {
      let value = row.setting_value;
      
      // Автоматическое преобразование типов
      if (row.setting_type === 'number') {
        value = parseFloat(value);
      } else if (row.setting_type === 'boolean') {
        value = value === 'true';
      } else if (row.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.warn('⚠️ Invalid JSON for setting:', row.setting_key);
        }
      }
      
      settings[row.setting_key] = {
        value,
        type: row.setting_type,
        category: row.category,
        description: row.description
      };
    });
    
    res.json({ success: true, settings });
    
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/settings/:key — Получить одну настройку
// ============================================================================
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM system_settings 
      WHERE setting_key = $1 AND is_active = TRUE
    `, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    const row = result.rows[0];
    let value = row.setting_value;
    
    if (row.setting_type === 'number') {
      value = parseFloat(value);
    } else if (row.setting_type === 'boolean') {
      value = value === 'true';
    } else if (row.setting_type === 'json') {
      value = JSON.parse(value);
    }
    
    res.json({ 
      success: true, 
      key: row.setting_key,
      value,
      type: row.setting_type,
      description: row.description
    });
    
  } catch (error) {
    console.error('❌ Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PUT /api/settings/:key — Обновить настройку
// ============================================================================
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Проверяем существование
    const check = await pool.query(`
      SELECT setting_type FROM system_settings 
      WHERE setting_key = $1 AND is_active = TRUE
    `, [key]);
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    const settingType = check.rows[0].setting_type;
    let stringValue = String(value);
    
    // Валидация типа
    if (settingType === 'number' && isNaN(parseFloat(value))) {
      return res.status(400).json({ error: 'Ожидается числовое значение' });
    }
    
    if (settingType === 'boolean' && !['true', 'false', '1', '0'].includes(stringValue.toLowerCase())) {
      return res.status(400).json({ error: 'Ожидается boolean значение' });
    }
    
    if (settingType === 'json') {
      try {
        JSON.parse(stringValue);
      } catch (e) {
        return res.status(400).json({ error: 'Невалидный JSON' });
      }
    }
    
    // Обновляем
    const result = await pool.query(`
      UPDATE system_settings 
      SET setting_value = $1, updated_at = NOW()
      WHERE setting_key = $2
      RETURNING *
    `, [stringValue, key]);
    
    console.log(`✅ Setting updated: ${key} = ${stringValue}`);
    
    res.json({ 
      success: true, 
      message: 'Настройка обновлена',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/settings — Создать новую настройку
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { key, value, type, category, description } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ error: 'key и value обязательны' });
    }
    
    const result = await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (setting_key) 
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        setting_type = EXCLUDED.setting_type,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        updated_at = NOW()
      RETURNING *
    `, [key, String(value), type || 'string', category || 'general', description || '']);
    
    res.json({ success: true, data: result.rows[0] });
    
  } catch (error) {
    console.error('❌ Error creating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DELETE /api/settings/:key — Удалить настройку (мягкое удаление)
// ============================================================================
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await pool.query(`
      UPDATE system_settings 
      SET is_active = FALSE, updated_at = NOW()
      WHERE setting_key = $1
      RETURNING *
    `, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    res.json({ success: true, message: 'Настройка удалена' });
    
  } catch (error) {
    console.error('❌ Error deleting setting:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;