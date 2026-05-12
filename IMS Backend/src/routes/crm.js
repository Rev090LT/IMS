// IMS/server/routes/crm.js
import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';
import { importServicesFromExcel, getServiceStats } from '../utils/service-importer.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = join(__dirname, '..', 'uploads', 'services');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `services-${Date.now()}${extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /xlsx|xls/;
    const ext = allowed.test(extname(file.originalname).toLowerCase());
    cb(null, ext);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ==================== УСЛУГИ ====================

// POST /api/crm/services/import — Импорт услуг из Excel
// В обработчике POST /api/crm/services/import:
router.post('/services/import', serviceUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    
    // 🔍 Опции импорта из query/body
    const options = {
      dryRun: req.body.dryRun === 'true' || req.query.dryRun === 'true',
      importGroups: req.body.importGroups === 'true',
      updatePrices: req.body.updatePrices === 'true'
    };
    
    const result = await importServicesFromExcel(req.file.path, options);
    
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: options.dryRun 
        ? `🔍 Предпросмотр: ${result.imported} будет добавлено, ${result.updated} обновлено`
        : `✅ Импортировано: ${result.imported}, обновлено: ${result.updated}, пропущено: ${result.skipped}`,
      stats: {
        ...result,
        // 🔍 Не показываем все ошибки в предпросмотре, только первые 10
        errors: result.errors?.slice(0, 10) || []
      }
    });
    
  } catch (error) {
    console.error('Error importing services:', error);
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch {} }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services — Поиск услуг с фильтрацией
router.get('/services', async (req, res) => {
  try {
    const { search, category, min_hours, max_hours, is_group, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT id, service_code, name, full_name, category,
             labor_hours, base_price, comment, additional,
             is_active, created_at
      FROM services WHERE is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR service_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    if (min_hours) {
      query += ` AND labor_hours >= $${paramIndex}`;
      params.push(parseFloat(min_hours));
      paramIndex++;
    }
    if (max_hours) {
      query += ` AND labor_hours <= $${paramIndex}`;
      params.push(parseFloat(max_hours));
      paramIndex++;
    }
    
    query += ` ORDER BY category, name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    let countQuery = `SELECT COUNT(*) FROM services WHERE is_active = TRUE`;
    const countParams = [];
    let countParamIndex = 1;
    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR full_name ILIKE $${countParamIndex} OR service_code ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (category && category !== 'all') {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    const count = await pool.query(countQuery, countParams);
    
    res.json({
      services: result.rows,
      total: parseInt(count.rows[0]?.count || 0),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services/tree — Иерархия услуг (категории + подкатегории)
router.get('/services/tree', async (req, res) => {
  try {
    const { include_inactive } = req.query;
    const activeFilter = include_inactive === 'true' ? '' : 'AND is_active = TRUE';
    
    // Получаем все категории (группы)
    const categories = await pool.query(`
      SELECT DISTINCT category as name, category as id, NULL as parent_id, true as is_group,
             COUNT(*) FILTER (WHERE is_active = TRUE) as services_count
      FROM services 
      WHERE category IS NOT NULL ${activeFilter}
      GROUP BY category
      ORDER BY category
    `);
    
    // Получаем все услуги внутри категорий
    const services = await pool.query(`
      SELECT id, service_code, name, full_name, category as parent_id,
             labor_hours, base_price, false as is_group, is_active
      FROM services 
      WHERE category IS NOT NULL ${activeFilter}
      ORDER BY category, name
    `);
    
    // Формируем дерево
    const tree = categories.rows.map(cat => ({
      ...cat,
      children: services.rows.filter(s => s.parent_id === cat.id)
    }));
    
    res.json(tree);
  } catch (error) {
    console.error('Error fetching services tree:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services/categories — Список категорий со статистикой
router.get('/services/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category,
             COUNT(*) as services_count,
             ROUND(AVG(labor_hours), 2) as avg_hours,
             ROUND(AVG(base_price)) as avg_price,
             MIN(labor_hours) as min_hours,
             MAX(labor_hours) as max_hours
      FROM services
      WHERE is_active = TRUE AND category IS NOT NULL
      GROUP BY category
      ORDER BY services_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services/stats — Статистика по услугам
router.get('/services/stats', async (req, res) => {
  try {
    const stats = await getServiceStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services/:id — Получение услуги по ID
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, service_code, name, full_name, category,
             labor_hours, base_price, comment, additional,
             is_active, created_at, updated_at
      FROM services WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Услуга не найдена' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/services — Создание новой услуги
router.post('/services', async (req, res) => {
  try {
    const { service_code, name, full_name, category, labor_hours, base_price, comment, additional } = req.body;
    
    const result = await pool.query(`
      INSERT INTO services (service_code, name, full_name, category,
                           labor_hours, base_price, comment, additional, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING id, created_at
    `, [service_code, name, full_name, category, labor_hours, base_price, comment, additional]);
    
    res.status(201).json({
      success: true,
      message: 'Услуга успешно создана',
      service: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/crm/services/:id — Обновление услуги
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, full_name, category, labor_hours, base_price, comment, additional, is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE services SET
        name = COALESCE($1, name), full_name = COALESCE($2, full_name),
        category = COALESCE($3, category), labor_hours = COALESCE($4, labor_hours),
        base_price = COALESCE($5, base_price), comment = COALESCE($6, comment),
        additional = COALESCE($7, additional), is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [name, full_name, category, labor_hours, base_price, comment, additional, is_active, id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Услуга не найдена' });
    res.json({ success: true, message: 'Услуга успешно обновлена', service: result.rows[0] });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/crm/services/:id — Мягкое удаление услуги
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE services SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1 AND is_active = TRUE RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Услуга не найдена или уже удалена' });
    res.json({ success: true, message: 'Услуга успешно удалена' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/services/bulk-update — Массовое обновление услуг
router.post('/services/bulk-update', async (req, res) => {
  try {
    const { service_ids, updates } = req.body;
    if (!Array.isArray(service_ids) || !updates) {
      return res.status(400).json({ error: 'Требуется массив service_ids и объект обновлений' });
    }
    
    const setClauses = [];
    const params = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (['labor_hours', 'base_price'].includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        params.push(parseFloat(value));
      } else {
        setClauses.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
    setClauses.push(`updated_at = NOW()`);
    
    params.push(service_ids);
    
    const result = await pool.query(`
      UPDATE services SET ${setClauses.join(', ')}
      WHERE id = ANY($${paramIndex}) RETURNING id
    `, params);
    
    res.json({
      success: true,
      message: `Обновлено ${result.rows.length} услуг`,
      updated_count: result.rows.length
    });
  } catch (error) {
    console.error('Error bulk updating services:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services/search/autocomplete — Автодополнение для поиска услуг
router.get('/services/search/autocomplete', async (req, res) => {
  try {
    const { q, category, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.json([]);
    
    const result = await pool.query(`
      SELECT id, service_code, name, full_name, category, labor_hours, base_price
      FROM services
      WHERE is_active = TRUE 
        AND (name ILIKE $1 OR full_name ILIKE $1 OR service_code ILIKE $1)
        ${category && category !== 'all' ? 'AND category = $2' : ''}
      ORDER BY 
        CASE WHEN name ILIKE $1 THEN 0 ELSE 1 END,
        name
      LIMIT $${category && category !== 'all' ? 3 : 2}
    `, category && category !== 'all' ? [`%${q}%`, category, parseInt(limit)] : [`%${q}%`, parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in service autocomplete:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ЗАКАЗ-НАРЯДЫ ====================

// GET /api/crm/work-orders — Список заказ-нарядов с фильтрацией
router.get('/work-orders', async (req, res) => {
  try {
    const { search, status, customer_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT wo.id, wo.order_number, wo.status, wo.promised_at, wo.completed_at,
             wo.vehicle_info, wo.complaint, wo.notes, wo.final_total,
             c.name as customer_name, c.phone_primary,
             u.username as master_name,
             wo.created_at, wo.updated_at
      FROM work_orders wo
      LEFT JOIN crm_customers c ON wo.customer_id = c.id
      LEFT JOIN users u ON wo.assigned_master::text = u.id::text
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (wo.order_number::text ILIKE $${paramIndex} OR wo.complaint::text ILIKE $${paramIndex} OR wo.notes::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status && status !== 'all') {
      query += ` AND wo.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (customer_id) {
      query += ` AND wo.customer_id = $${paramIndex}`;
      params.push(customer_id);
      paramIndex++;
    }
    if (date_from) {
      query += ` AND wo.created_at >= $${paramIndex}::date`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      query += ` AND wo.created_at <= $${paramIndex}::date`;
      params.push(date_to);
      paramIndex++;
    }
    
    query += ` ORDER BY wo.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    let countQuery = `SELECT COUNT(*) FROM work_orders WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;
    if (search) {
      countQuery += ` AND (order_number::text ILIKE $${countParamIndex} OR complaint::text ILIKE $${countParamIndex} OR notes::text ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (customer_id) {
      countQuery += ` AND customer_id = $${countParamIndex}`;
      countParams.push(customer_id);
      countParamIndex++;
    }
    if (date_from) {
      countQuery += ` AND created_at >= $${countParamIndex}::date`;
      countParams.push(date_from);
      countParamIndex++;
    }
    if (date_to) {
      countQuery += ` AND created_at <= $${countParamIndex}::date`;
      countParams.push(date_to);
      countParamIndex++;
    }
    
    const count = await pool.query(countQuery, countParams);
    
    res.json({
      work_orders: result.rows,
      total: parseInt(count.rows[0]?.count || 0),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/work-orders/:id — Детали заказ-наряда
router.get('/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [wo, items, history] = await Promise.all([
      pool.query(`
        SELECT wo.*,
               c.name as customer_name, c.phone_primary, c.phone_secondary, c.loyalty_level,
               v.brand, v.model, v.vin, v.year, v.license_plate,
               u.username as master_name, l.name as bay_name
        FROM work_orders wo
        LEFT JOIN crm_customers c ON wo.customer_id = c.id
        LEFT JOIN cars v ON wo.vehicle_id = v.id
        LEFT JOIN users u ON wo.assigned_master::text = u.id::text
        LEFT JOIN locations l ON wo.assigned_bay::text = l.id::text
        WHERE wo.id = $1
      `, [id]),
      pool.query(`
        SELECT woi.*,
               s.name as service_name, s.labor_hours as service_hours,
               p.name as part_name, p.part_number, p.manufacturer
        FROM work_order_items woi
        LEFT JOIN services s ON woi.service_id = s.id
        LEFT JOIN parts p ON woi.part_id = p.id
        WHERE woi.work_order_id = $1
        ORDER BY woi.item_type, woi.created_at
      `, [id]),
      pool.query(`
        SELECT * FROM work_order_status_history
        WHERE work_order_id = $1 ORDER BY changed_at DESC
      `, [id])
    ]);
    
    if (wo.rows.length === 0) return res.status(404).json({ error: 'Заказ-наряд не найден' });
    
    res.json({
      work_order: wo.rows[0],
      items: items.rows,
      history: history.rows
    });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/work-orders — Создание заказ-наряда
router.post('/work-orders', async (req, res) => {
  try {
    const { customer_id, vehicle_id, complaint, notes, promised_at, assigned_master, assigned_bay } = req.body;
    const orderNumber = `WO-${Date.now().toString().slice(-6)}`;
    
    const result = await pool.query(`
      INSERT INTO work_orders (order_number, customer_id, vehicle_id, complaint, notes,
                               promised_at, assigned_master, assigned_bay, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'in_progress')
      RETURNING id, order_number, created_at
    `, [orderNumber, customer_id, vehicle_id, complaint, notes, promised_at, assigned_master, assigned_bay]);
    
    res.status(201).json({
      success: true,
      message: 'Заказ-наряд успешно создан',
      work_order: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/crm/work-orders/:id/status — Обновление статуса
router.put('/work-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['in_progress', 'waiting_parts', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });
    
    await pool.query('BEGIN');
    try {
      await pool.query(`UPDATE work_orders SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
      await pool.query(
        `INSERT INTO work_order_status_history (work_order_id, old_status, new_status, changed_by, notes)
         SELECT $1, status, $2, $3, $4 FROM work_orders WHERE id = $1`,
        [id, status, req.user?.id || null, notes || null]
      );
      await pool.query('COMMIT');
      res.json({ success: true, message: `Статус обновлён на "${status}"` });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating work order status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/work-orders/:id/items — Добавление элемента
router.post('/work-orders/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_type, service_id, part_id, quantity, labor_hours, unit_price, comment } = req.body;
    
    const totalPrice = (labor_hours || 0) * (unit_price || 0) + (part_id ? (quantity || 1) * (unit_price || 0) : 0);
    
    const result = await pool.query(`
      INSERT INTO work_order_items (work_order_id, item_type, service_id, part_id,
                                    quantity, labor_hours, unit_price, total_price, comment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [id, item_type, service_id, part_id, quantity || 1, labor_hours, unit_price, totalPrice, comment]);
    
    await pool.query(`
      UPDATE work_orders SET 
        final_total = (SELECT COALESCE(SUM(total_price), 0) FROM work_order_items WHERE work_order_id = $1),
        updated_at = NOW()
      WHERE id = $1
    `, [id]);
    
    res.status(201).json({ success: true, message: 'Элемент добавлен', item: result.rows[0] });
  } catch (error) {
    console.error('Error adding work order item:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/crm/work-orders/:id/items/:item_id — Удаление элемента
router.delete('/work-orders/:id/items/:item_id', async (req, res) => {
  try {
    const { id, item_id } = req.params;
    
    await pool.query('BEGIN');
    try {
      await pool.query(`DELETE FROM work_order_items WHERE id = $1 AND work_order_id = $2`, [item_id, id]);
      await pool.query(`
        UPDATE work_orders SET 
          final_total = (SELECT COALESCE(SUM(total_price), 0) FROM work_order_items WHERE work_order_id = $1),
          updated_at = NOW()
        WHERE id = $1
      `, [id]);
      await pool.query('COMMIT');
      res.json({ success: true, message: 'Элемент удалён' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting work order item:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/work-orders/:id/clone — Клонирование заказ-наряда
router.post('/work-orders/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_customer_id, new_vehicle_id, notes_prefix } = req.body;
    
    await pool.query('BEGIN');
    try {
      // Получаем исходный заказ-наряд
      const original = await pool.query(`SELECT * FROM work_orders WHERE id = $1`, [id]);
      if (original.rows.length === 0) throw new Error('Заказ-наряд не найден');
      
      const orig = original.rows[0];
      const newOrderNumber = `WO-${Date.now().toString().slice(-6)}`;
      
      // Создаём новый заказ-наряд
      const newWo = await pool.query(`
        INSERT INTO work_orders (order_number, customer_id, vehicle_id, complaint, notes,
                                 promised_at, assigned_master, assigned_bay, status, vehicle_info)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
        RETURNING id, order_number
      `, [
        newOrderNumber,
        new_customer_id || orig.customer_id,
        new_vehicle_id || orig.vehicle_id,
        orig.complaint,
        notes_prefix ? `${notes_prefix}: ${orig.notes || ''}` : orig.notes,
        null, orig.assigned_master, orig.assigned_bay, orig.vehicle_info
      ]);
      
      // Копируем элементы
      await pool.query(`
        INSERT INTO work_order_items (work_order_id, item_type, service_id, part_id,
                                      quantity, labor_hours, unit_price, total_price, comment)
        SELECT $1, item_type, service_id, part_id, quantity, labor_hours, unit_price, total_price, comment
        FROM work_order_items WHERE work_order_id = $2
      `, [newWo.rows[0].id, id]);
      
      await pool.query('COMMIT');
      res.status(201).json({ success: true, message: 'Заказ-наряд склонирован', work_order: newWo.rows[0] });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error cloning work order:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ШАБЛОНЫ УСЛУГ ====================

// GET /api/crm/service-templates — Список шаблонов
router.get('/service-templates', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = `
      SELECT t.*, 
             json_agg(json_build_object(
               'service_id', s.id, 'service_name', s.name, 
               'labor_hours', s.labor_hours, 'base_price', s.base_price
             )) FILTER (WHERE s.id IS NOT NULL) as services
      FROM service_templates t
      LEFT JOIN service_template_items sti ON t.id = sti.template_id
      LEFT JOIN services s ON sti.service_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND t.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    if (search) {
      query += ` AND (t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` GROUP BY t.id ORDER BY t.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/service-templates — Создание шаблона
router.post('/service-templates', async (req, res) => {
  try {
    const { name, description, category, service_ids, default_labor_hours } = req.body;
    
    await pool.query('BEGIN');
    try {
      const template = await pool.query(`
        INSERT INTO service_templates (name, description, category, default_labor_hours)
        VALUES ($1, $2, $3, $4) RETURNING id
      `, [name, description, category, default_labor_hours]);
      
      if (Array.isArray(service_ids) && service_ids.length > 0) {
        const values = service_ids.map((sid, idx) => `($1, $${idx + 2})`).join(', ');
        await pool.query(`
          INSERT INTO service_template_items (template_id, service_id) VALUES ${values}
        `, [template.rows[0].id, ...service_ids]);
      }
      
      await pool.query('COMMIT');
      res.status(201).json({ success: true, message: 'Шаблон создан', template_id: template.rows[0].id });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating service template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/work-orders/from-template/:template_id — Создание заказ-наряда из шаблона
router.post('/work-orders/from-template/:template_id', async (req, res) => {
  try {
    const { template_id } = req.params;
    const { customer_id, vehicle_id, complaint, notes, promised_at } = req.body;
    
    // Получаем шаблон и его услуги
    const [template, items] = await Promise.all([
      pool.query(`SELECT * FROM service_templates WHERE id = $1`, [template_id]),
      pool.query(`
        SELECT s.id, s.name, s.labor_hours, s.base_price, sti.quantity_override
        FROM service_template_items sti
        JOIN services s ON sti.service_id = s.id
        WHERE sti.template_id = $1 AND s.is_active = TRUE
      `, [template_id])
    ]);
    
    if (template.rows.length === 0) return res.status(404).json({ error: 'Шаблон не найден' });
    
    const orderNumber = `WO-${Date.now().toString().slice(-6)}`;
    
    await pool.query('BEGIN');
    try {
      const wo = await pool.query(`
        INSERT INTO work_orders (order_number, customer_id, vehicle_id, complaint, notes,
                                 promised_at, status, vehicle_info)
        VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', $7)
        RETURNING id, order_number
      `, [orderNumber, customer_id, vehicle_id, complaint, notes, promised_at, {}]);
      
      for (const item of items.rows) {
        const totalPrice = (item.labor_hours * (item.quantity_override || 1)) * (item.base_price || 0);
        await pool.query(`
          INSERT INTO work_order_items (work_order_id, item_type, service_id, quantity, labor_hours, unit_price, total_price)
          VALUES ($1, 'labor', $2, $3, $4, $5, $6)
        `, [wo.rows[0].id, item.id, item.quantity_override || 1, item.labor_hours, item.base_price, totalPrice]);
      }
      
      await pool.query('COMMIT');
      res.status(201).json({ success: true, message: 'Заказ-наряд создан из шаблона', work_order: wo.rows[0] });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating work order from template:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ОТЧЁТЫ ====================

// GET /api/crm/reports/revenue — Отчёт по выручке
router.get('/reports/revenue', async (req, res) => {
  try {
    const { date_from, date_to, interval = 'day', group_by } = req.query;
    
    const groupField = group_by === 'category' ? 's.category' : 
                      group_by === 'master' ? 'u.username' : 
                      `DATE_TRUNC($1, COALESCE(wo.completed_at, wo.created_at))`;
    
    const selectFields = group_by === 'category' ? 's.category as period, s.category as label' :
                        group_by === 'master' ? 'u.username as period, u.username as label' :
                        `DATE_TRUNC($1, COALESCE(wo.completed_at, wo.created_at)) as period, 
                         TO_CHAR(DATE_TRUNC($1, COALESCE(wo.completed_at, wo.created_at)), 'DD.MM.YYYY') as label`;
    
    const result = await pool.query(`
      SELECT ${selectFields},
             COUNT(DISTINCT wo.id) as orders_count,
             SUM(wo.final_total) as total_revenue,
             AVG(wo.final_total) as avg_order_value,
             SUM(woi.labor_hours) as total_hours
      FROM work_orders wo
      LEFT JOIN work_order_items woi ON wo.id = woi.work_order_id AND woi.item_type = 'labor'
      LEFT JOIN services s ON woi.service_id = s.id
      LEFT JOIN users u ON wo.assigned_master::text = u.id::text
      WHERE wo.status = 'completed'
        AND ($2::date IS NULL OR COALESCE(wo.completed_at, wo.created_at) >= $2::date)
        AND ($3::date IS NULL OR COALESCE(wo.completed_at, wo.created_at) <= $3::date)
      GROUP BY ${groupField}
      ORDER BY period DESC
    `, [interval, date_from || null, date_to || null]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/reports/masters — Отчёт по мастерам
router.get('/reports/masters', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    const result = await pool.query(`
      SELECT u.id, u.username, u.role,
             COUNT(DISTINCT CASE WHEN wo.status = 'in_progress' THEN wo.id END) as active_orders,
             COUNT(DISTINCT CASE WHEN wo.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN wo.id END) as orders_week,
             COUNT(DISTINCT CASE WHEN wo.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN wo.id END) as orders_month,
             SUM(CASE WHEN wo.status = 'completed' THEN woi.labor_hours ELSE 0 END) as hours_month,
             SUM(CASE WHEN wo.status = 'completed' THEN woi.total_price ELSE 0 END) as revenue_month,
             AVG(CASE WHEN wo.status = 'completed' THEN wo.final_total END) as avg_order_value,
             ROUND(AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.started_at))/3600), 2) as avg_job_duration
      FROM users u
      LEFT JOIN work_orders wo ON u.id::text = wo.assigned_master::text 
        AND wo.status IN ('in_progress', 'completed')
        AND ($1::date IS NULL OR wo.created_at >= $1::date)
        AND ($2::date IS NULL OR wo.created_at <= $2::date)
      LEFT JOIN work_order_items woi ON wo.id = woi.work_order_id AND woi.item_type = 'labor'
      WHERE u.role IN ('master', 'technician')
      GROUP BY u.id, u.username, u.role
      ORDER BY revenue_month DESC NULLS LAST
    `, [date_from || null, date_to || null]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching masters report:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/reports/services-popularity — Популярные услуги
router.get('/reports/services-popularity', async (req, res) => {
  try {
    const { date_from, date_to, limit = 20 } = req.query;
    
    const result = await pool.query(`
      SELECT s.id, s.name, s.category, s.labor_hours, s.base_price,
             COUNT(DISTINCT woi.work_order_id) as orders_count,
             SUM(woi.quantity) as total_quantity,
             SUM(woi.total_price) as total_revenue
      FROM services s
      JOIN work_order_items woi ON s.id = woi.service_id AND woi.item_type = 'labor'
      JOIN work_orders wo ON woi.work_order_id = wo.id AND wo.status = 'completed'
      WHERE ($1::date IS NULL OR wo.completed_at >= $1::date)
        AND ($2::date IS NULL OR wo.completed_at <= $2::date)
      GROUP BY s.id, s.name, s.category, s.labor_hours, s.base_price
      ORDER BY orders_count DESC
      LIMIT $3
    `, [date_from || null, date_to || null, parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services popularity report:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/reports/customers-ltv — LTV клиентов
router.get('/reports/customers-ltv', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    const result = await pool.query(`
      SELECT c.id, c.name, c.phone_primary, c.loyalty_level,
             COUNT(DISTINCT wo.id) as total_orders,
             SUM(wo.final_total) as total_spent,
             AVG(wo.final_total) as avg_order_value,
             MIN(wo.created_at) as first_order,
             MAX(wo.created_at) as last_order,
             EXTRACT(DAY FROM (MAX(wo.created_at) - MIN(wo.created_at))) as customer_lifetime_days
      FROM crm_customers c
      JOIN work_orders wo ON c.id = wo.customer_id AND wo.status = 'completed'
      WHERE ($1::date IS NULL OR wo.created_at >= $1::date)
        AND ($2::date IS NULL OR wo.created_at <= $2::date)
      GROUP BY c.id, c.name, c.phone_primary, c.loyalty_level
      HAVING COUNT(DISTINCT wo.id) >= 2
      ORDER BY total_spent DESC
      LIMIT 50
    `, [date_from || null, date_to || null]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer LTV report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ДАШБОРД ====================

// GET /api/crm/dashboard — Сводка для дашборда
router.get('/dashboard', async (req, res) => {
  try {
    const [stats, pendingOrders, revenue, topServices] = await Promise.all([
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM work_orders WHERE status = 'in_progress') as active_orders,
          (SELECT COUNT(*) FROM work_orders WHERE status = 'waiting_parts') as waiting_parts,
          (SELECT COUNT(*) FROM work_orders WHERE status = 'ready') as ready_for_pickup,
          (SELECT COUNT(*) FROM crm_customers WHERE last_visit_date >= CURRENT_DATE - INTERVAL '30 days') as active_customers_30d,
          (SELECT SUM(final_total) FROM work_orders WHERE completed_at >= CURRENT_DATE) as today_revenue,
          (SELECT COUNT(*) FROM work_orders WHERE promised_at < NOW() AND status NOT IN ('completed','cancelled','archived')) as overdue_orders
      `),
        pool.query(`
        SELECT wo.id, wo.order_number, wo.promised_at, wo.status,
                c.phone_primary, c.loyalty_level,
                (wo.vehicle_info::jsonb)->>'brand' as brand,
                (wo.vehicle_info::jsonb)->>'model' as model,
                u.username as master_name,
                EXTRACT(EPOCH FROM (NOW() - wo.promised_at))/3600 as hours_overdue
        FROM work_orders wo
        JOIN crm_customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.assigned_master::text = u.id::text
        WHERE wo.promised_at < NOW() AND wo.status NOT IN ('completed', 'cancelled', 'archived')
        ORDER BY wo.promised_at ASC LIMIT 10
        `),
      pool.query(`
        SELECT DATE(wo.completed_at) as date, SUM(wo.final_total) as revenue
        FROM work_orders wo
        WHERE wo.status = 'completed' AND wo.completed_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(wo.completed_at) ORDER BY date
      `),
      pool.query(`
        SELECT s.name, s.category, COUNT(*) as usage_count, SUM(woi.total_price) as revenue
        FROM services s
        JOIN work_order_items woi ON s.id = woi.service_id
        JOIN work_orders wo ON woi.work_order_id = wo.id
        WHERE wo.status = 'completed' AND wo.completed_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY s.id, s.name, s.category
        ORDER BY usage_count DESC LIMIT 5
      `)
    ]);
    
    res.json({
      stats: stats.rows[0] || {},
      pending_orders: pendingOrders.rows,
      revenue_chart: revenue.rows,
      top_services: topServices.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/dashboard/quick-stats — Быстрые метрики для хедера
router.get('/dashboard/quick-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM work_orders WHERE status IN ('in_progress','waiting_parts')) as active_count,
        (SELECT COUNT(*) FROM work_orders WHERE promised_at < NOW() AND status = 'in_progress') as overdue_count,
        (SELECT SUM(final_total) FROM work_orders WHERE DATE(completed_at) = CURRENT_DATE) as today_revenue,
        (SELECT COUNT(*) FROM crm_customers WHERE DATE(created_at) = CURRENT_DATE) as new_customers_today
    `);
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;