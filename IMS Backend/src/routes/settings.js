// IMS Backend/src/routes/settings.js
import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { authenticateToken } from '../middleware/auth.js'; // 🔥 ДОБАВИТЬ ЭТУ СТРОКУ
const router = express.Router();

// ============================================================================
// 1. СПЕЦИФИЧНЫЕ МАРШРУТЫ (Должны быть ВЫШЕ, чем /:key)
// ============================================================================

// GET /api/settings/check — Проверяет, была ли выполнена первоначальная настройка
router.get('/check', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT setting_value FROM system_settings 
      WHERE setting_key = 'is_configured'
    `);
    
    const isConfigured = result.rows.length > 0 && result.rows[0].setting_value === 'true';
    res.json({ isConfigured });
  } catch (error) {
    console.error('Error checking setup status:', error);
    res.json({ isConfigured: false }); 
  }
});

// POST /api/settings/initial — Сохраняет первоначальные настройки
router.post('/initial', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { 
      company_name, company_phone, hourly_rate, currency_symbol, nds_rate,
      admin_username, admin_email, admin_password 
    } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(admin_password, saltRounds);

    // 🔥 Убрали updated_at, чтобы не было ошибок, если колонки нет
    await client.query(`
      INSERT INTO users (username, email, password_hash, role, full_name, is_active, created_at)
      VALUES ($1, $2, $3, 'admin', 'Главный Администратор', TRUE, NOW())
      ON CONFLICT (username) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = 'admin',
        full_name = 'Главный Администратор',
        is_active = TRUE
    `, [admin_username, admin_email, hashedPassword]);

    const settings = [
      { 
        key: 'company_name', 
        value: company_name, 
        type: 'string',
        description: 'Название компании'  // 🔥 Нормальное описание
      },
      { 
        key: 'company_phone', 
        value: company_phone, 
        type: 'string',
        description: 'Контактный телефон компании'
      },
      { 
        key: 'hourly_rate', 
        value: hourly_rate, 
        type: 'number',
        description: 'Ставка за час работы слесаря (₽)'
      },
      { 
        key: 'currency_symbol', 
        value: currency_symbol, 
        type: 'string',
        description: 'Символ валюты'
      },
      { 
        key: 'nds_rate', 
        value: nds_rate, 
        type: 'number',
        description: 'Ставка НДС (%)'
      },
      { 
        key: 'is_configured', 
        value: 'true', 
        type: 'boolean',
        description: 'Флаг: пройдена ли первоначальная настройка'
      }
    ];

    for (const setting of settings) {
      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
        VALUES ($1, $2, $3, 'general', $4)
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          description = EXCLUDED.description  
      `, [setting.key, setting.value, setting.type, setting.description]);
    }

    await client.query('COMMIT');
    console.log(`✅ Initial setup completed. Admin user '${admin_username}' created/updated.`);
    res.json({ success: true, message: 'Настройки и администратор успешно сохранены' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving initial settings:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// 2. ОБЩИЕ МАРШРУТЫ КОЛЛЕКЦИИ
// ============================================================================

// GET /api/settings — Получить все настройки
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
    const settings = {};
    result.rows.forEach(row => {
      let value = row.setting_value;
      if (row.setting_type === 'number') value = parseFloat(value);
      else if (row.setting_type === 'boolean') value = value === 'true';
      else if (row.setting_type === 'json') {
        try { value = JSON.parse(value); } catch (e) { console.warn('⚠️ Invalid JSON:', row.setting_key); }
      }
      settings[row.setting_key] = { value, type: row.setting_type, category: row.category, description: row.description };
    });
    res.json({ success: true, settings });
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings — Создать новую настройку
router.post('/', async (req, res) => {
  try {
    const { key, value, type, category, description } = req.body;
    if (!key || !value) return res.status(400).json({ error: 'key и value обязательны' });
    
    const result = await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = EXCLUDED.setting_value, setting_type = EXCLUDED.setting_type, category = EXCLUDED.category, description = EXCLUDED.description
      RETURNING *
    `, [key, String(value), type || 'string', category || 'general', description || '']);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error creating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// 3. МАРШРУТЫ С ПАРАМЕТРАМИ (Должны быть в САМОМ НИЗУ)
// ============================================================================

// GET /api/settings/:key — Получить одну настройку
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(`SELECT * FROM system_settings WHERE setting_key = $1 AND is_active = TRUE`, [key]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Настройка не найдена' });
    
    const row = result.rows[0];
    let value = row.setting_value;
    if (row.setting_type === 'number') value = parseFloat(value);
    else if (row.setting_type === 'boolean') value = value === 'true';
    else if (row.setting_type === 'json') value = JSON.parse(value);
    
    res.json({ success: true, key: row.setting_key, value, type: row.setting_type, description: row.description });
  } catch (error) {
    console.error('❌ Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/:key — Обновить настройку
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const check = await pool.query(`SELECT setting_type FROM system_settings WHERE setting_key = $1 AND is_active = TRUE`, [key]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Настройка не найдена' });
    
    const settingType = check.rows[0].setting_type;
    let stringValue = String(value);
    
    if (settingType === 'number' && isNaN(parseFloat(value))) return res.status(400).json({ error: 'Ожидается числовое значение' });
    if (settingType === 'boolean' && !['true', 'false', '1', '0'].includes(stringValue.toLowerCase())) return res.status(400).json({ error: 'Ожидается boolean значение' });
    if (settingType === 'json') {
      try { JSON.parse(stringValue); } catch (e) { return res.status(400).json({ error: 'Невалидный JSON' }); }
    }
    
    const result = await pool.query(`UPDATE system_settings SET setting_value = $1 WHERE setting_key = $2 RETURNING *`, [stringValue, key]);
    console.log(`✅ Setting updated: ${key} = ${stringValue}`);
    res.json({ success: true, message: 'Настройка обновлена', data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/settings/:key — Удалить настройку (мягкое удаление)
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(`UPDATE system_settings SET is_active = FALSE WHERE setting_key = $1 RETURNING *`, [key]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Настройка не найдена' });
    res.json({ success: true, message: 'Настройка удалена' });
  } catch (error) {
    console.error('❌ Error deleting setting:', error);
    res.status(500).json({ error: error.message });
  }
});
// ============================================================================
// POST /api/settings/restart — Мягкая перезагрузка системы
// ============================================================================
// ============================================================================
// POST /api/settings/restart — Мягкая перезагрузка системы
// ============================================================================
router.post('/restart', authenticateToken, async (req, res) => {
  // 🔥 Лог в самом начале, ДО любых проверок
  console.log('🔍 DEBUG /restart: req.user =', req.user);
  console.log(' DEBUG /restart: headers =', req.headers.authorization);

  try {
    if (!req.user || req.user.role?.toLowerCase() !== 'admin') {
      console.log(' DEBUG /restart: Проверка роли не пройдена. req.user.role =', req.user?.role);
      return res.status(403).json({ error: 'Доступ запрещен: только для администраторов' });
    }

    console.log('✅ DEBUG /restart: Проверка пройдена, выполняем перезагрузку');
    res.json({ 
      success: true, 
      message: 'Система перезагружена. Страница будет обновлена.' 
    });
  } catch (error) {
    console.error('❌ Error restarting system:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/settings/reset — Полный сброс системы
// ============================================================================
// ============================================================================
// POST /api/settings/reset — Полный сброс системы
// ============================================================================
router.post('/reset', authenticateToken, async (req, res) => {
  console.log('🔍 DEBUG /reset: req.user =', req.user);

  const client = await pool.connect();
  try {
    // 1. Проверка прав администратора
    if (!req.user || req.user.role?.toLowerCase() !== 'admin') {
      console.log('❌ DEBUG /reset: Проверка роли не пройдена');
      return res.status(403).json({ error: 'Доступ запрещен: только для администраторов' });
    }

    const { confirmReset } = req.body;
    if (confirmReset !== 'RESET_ALL_DATA') {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    await client.query('BEGIN');
    console.log('⚠️ FULL SYSTEM RESET initiated by user:', req.user.username);

    // 2. Динамически получаем список всех пользовательских таблиц
    // (исключаем системные таблицы PostgreSQL и таблицу настроек)
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename NOT IN ('system_settings', 'users')
      ORDER BY tablename
    `);

    const userTables = tablesResult.rows.map(row => row.tablename);
    console.log('📋 Таблицы для очистки:', userTables);

    // 3. Очищаем каждую таблицу, если она существует
    for (const table of userTables) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`  🗑️ Очищена таблица: ${table}`);
      } catch (err) {
        console.warn(`  ⚠️ Не удалось очистить ${table}: ${err.message}`);
      }
    }

    // 4. 🔥 СБРАСЫВАЕМ НАСТРОЙКИ К ЗАВОДСКИМ ЗНАЧЕНИЯМ (вместо удаления)
    const defaultSettings = [
      { key: 'hourly_rate', value: '1500', type: 'number', category: 'billing', description: 'Ставка за час работы слесаря (₽)' },
      { key: 'nds_rate', value: '20', type: 'number', category: 'billing', description: 'Ставка НДС (%)' },
      { key: 'warranty_work_days', value: '30', type: 'number', category: 'billing', description: 'Гарантия на работы (дней)' },
      { key: 'warranty_parts_days', value: '90', type: 'number', category: 'billing', description: 'Гарантия на запчасти (дней)' },
      { key: 'company_phone', value: '+7 (999) 123-45-67', type: 'string', category: 'general', description: 'Контактный телефон компании' },
      { key: 'company_name', value: 'TrackTime Performance', type: 'string', category: 'general', description: 'Название компании' },
      { key: 'currency_symbol', value: '₽', type: 'string', category: 'billing', description: 'Символ валюты' },
      { key: 'tax_rate', value: '0', type: 'number', category: 'billing', description: 'Налоговая ставка (%)' },
      { key: 'discount_enabled', value: 'true', type: 'boolean', category: 'billing', description: 'Разрешить скидки' },
      { key: 'auto_backup_enabled', value: 'false', type: 'boolean', category: 'system', description: 'Автоматическое резервное копирование' },
      { key: 'debug_mode', value: 'false', type: 'boolean', category: 'system', description: 'Режим отладки' },
      { key: 'is_configured', value: 'false', type: 'boolean', category: 'system', description: 'Флаг: пройдена ли первоначальная настройка' }
    ];

    for (const setting of defaultSettings) {
      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          setting_type = EXCLUDED.setting_type,
          category = EXCLUDED.category,
          description = EXCLUDED.description
      `, [setting.key, setting.value, setting.type, setting.category, setting.description]);
    }

    await client.query('COMMIT');
    console.log('✅ System reset completed successfully');

    res.json({ 
      success: true, 
      message: 'Система полностью сброшена. Перенаправление на страницу настройки...' 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting system:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});
export default router;