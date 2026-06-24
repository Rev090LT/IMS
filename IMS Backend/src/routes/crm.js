// IMS/server/routes/crm.js
import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';
import { importServicesFromExcel, getServiceStats } from '../utils/service-importer.js';
import PDFDocument from 'pdfkit';
import path from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FONT_PATH = path.join(__dirname, '../fonts/DejaVuSans.ttf');
const FONT_BOLD_PATH = path.join(__dirname, '../fonts/DejaVuSans-Bold.ttf');
const LOGO_PATH = path.join(__dirname, '../images/logo.png'); // 🔥 Путь к логотипу


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

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

async function resolveServiceId(value) {
  // Пустое значение
  if (!value) return null;
  
  // Уже число
  if (typeof value === 'number') return value;
  
  // Строка, которая является числом
  if (!isNaN(parseInt(value))) return parseInt(value);
  
  // Строка-код или название услуги — ищем в БД
  try {
    const result = await pool.query(
      `SELECT id FROM services 
       WHERE service_code = $1 OR name = $1 OR full_name = $1 
       LIMIT 1`,
      [value]
    );
    return result.rows[0]?.id || null;
  } catch (e) {
    console.warn('⚠️ Could not resolve service_id:', value);
    return null;
  }
}
// ==================== УСЛУГИ ====================

router.post('/services/import', serviceUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
    
    const options = {
      dryRun: req.body.dryRun === 'true' || req.query.dryRun === 'true',
      importGroups: req.body.importGroups === 'true',
      updatePrices: req.body.updatePrices === 'true'
    };
    
    const result = await importServicesFromExcel(req.file.path, options);
    
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch {} }
    
    res.json({
      success: true,
      message: options.dryRun 
        ? `🔍 Предпросмотр: ${result.imported} будет добавлено, ${result.updated} обновлено`
        : `✅ Импортировано: ${result.imported}, обновлено: ${result.updated}, пропущено: ${result.skipped}`,
      stats: { ...result, errors: result.errors?.slice(0, 10) || [] }
    });
    
  } catch (error) {
    console.error('Error importing services:', error);
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch {} }
    res.status(500).json({ error: error.message });
  }
});

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

router.get('/services/tree', async (req, res) => {
  try {
    const { include_inactive } = req.query;
    const activeFilter = include_inactive === 'true' ? '' : 'AND is_active = TRUE';
    
    const categories = await pool.query(`
      SELECT DISTINCT category as name, category as id, NULL as parent_id, true as is_group,
             COUNT(*) FILTER (WHERE is_active = TRUE) as services_count
      FROM services 
      WHERE category IS NOT NULL ${activeFilter}
      GROUP BY category
      ORDER BY category
    `);
    
    const services = await pool.query(`
      SELECT id, service_code, name, full_name, category as parent_id,
             labor_hours, base_price, false as is_group, is_active
      FROM services 
      WHERE category IS NOT NULL ${activeFilter}
      ORDER BY category, name
    `);
    
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

router.get('/services/stats', async (req, res) => {
  try {
    const stats = await getServiceStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// ==================== КОНТРАГЕНТЫ ====================

router.get('/counterparties', async (req, res) => {
  try {
    const { search, type, limit = 200 } = req.query;
    
    let query = `
      SELECT id, company_name, fio, phone, email, inn, kpp, type, created_at
      FROM counterparties WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (company_name ILIKE $${paramIndex} OR fio ILIKE $${paramIndex} OR inn ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (type && type !== 'all') {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    query += ` ORDER BY company_name NULLS LAST, fio LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ counterparties: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error fetching counterparties:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ЗАКАЗ-НАРЯДЫ ====================

// 🔥 Главный фикс: чистый запрос БЕЗ комментариев внутри SELECT
router.get('/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workOrderId = parseInt(id, 10);

    if (isNaN(workOrderId)) {
      return res.status(400).json({ error: 'Неверный ID заказ-наряда' });
    }
    
    console.log('🔍 GET /work-orders/:id - fetching order:', workOrderId);

    const wo = await pool.query(`
      SELECT 
        wo.id,
        wo.order_number,
        wo.status,
        wo.complaint,
        wo.notes,
        wo.description,
        wo.vehicle_info,
        wo.final_total,
        wo.total_cost,
        wo.created_at,
        wo.updated_at,
        wo.started_at,
        wo.completed_at,
        wo.promised_at,
        wo.date_from,
        wo.date_to,
        wo.customer_id,
        wo.vehicle_id,
        wo.assigned_master,
        wo.assigned_bay,
        wo.master_id,
        COALESCE(cp.company_name, cp.fio) AS customer_name,
        cp.phone AS customer_phone,
        COALESCE(wo.vehicle_info->>'brand', v.brand) AS brand,
        COALESCE(wo.vehicle_info->>'model', v.model) AS model,
        COALESCE(wo.vehicle_info->>'vin', v.vin) AS vin,
        COALESCE(wo.vehicle_info->>'year', v.year::text) AS year,
        COALESCE(wo.vehicle_info->>'license_plate', v.license_plate) AS license_plate
      FROM work_orders wo
      LEFT JOIN counterparties cp ON wo.customer_id = cp.id
      LEFT JOIN cars v ON wo.vehicle_id = v.id
      WHERE wo.id = $1
    `, [workOrderId]);
    
    if (wo.rows.length === 0) {
      console.warn('⚠️ Work order not found:', workOrderId);
      return res.status(404).json({ error: 'Заказ-наряд не найден' });
    }
    
    console.log('🔧 Fetching work_order_items for order:', workOrderId);
    
    const items = await pool.query(`
      SELECT 
        woi.id,
        woi.work_order_id,
        woi.item_type,
        woi.service_id,
        woi.part_id,
        woi.name,
        woi.category,
        woi.quantity,
        woi.unit,
        woi.unit_price,
        woi.total_price,
        woi.labor_hours,
        woi.status,
        woi.notes,
        woi.part_number,
        woi.manufacturer,
        s.name AS service_name,
        s.labor_hours AS service_labor_hours,
        s.base_price AS service_base_price,
        s.category AS service_category
      FROM work_order_items woi
      LEFT JOIN services s ON woi.service_id = s.id
      WHERE woi.work_order_id = $1
      ORDER BY woi.id
    `, [workOrderId]);
    
    console.log('✅ Found items:', items.rows.length);
    console.log('📋 Raw items:', items.rows); // ← ДОБАВЬ ЭТО ДЛЯ ОТЛАДКИ
    
    // 🔥 РАЗДЕЛЕНИЕ ПО item_type
    const works = items.rows.filter(item => item.item_type === 'labor');
    const parts = items.rows.filter(item => item.item_type === 'part');
    
    console.log('📊 Separated:', { 
      works: works.length, 
      parts: parts.length 
    });
    let history = { rows: [] };
    try {
      history = await pool.query(`
        SELECT id, old_status, new_status, notes, changed_at
        FROM work_order_status_history
        WHERE work_order_id = $1
        ORDER BY changed_at DESC
      `, [workOrderId]);
    } catch (histErr) {
      console.warn('⚠️ work_order_status_history not available');
    }
    
    // 🔥 Возвращаем work_items и parts_items отдельно
    res.json({
      work_order: wo.rows[0],
      work_items: works,
      parts_items: parts,
      history: history.rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching work order:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/work-orders', async (req, res) => {
  try {
    const { search, status, customer_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT wo.id, wo.order_number, wo.status, wo.promised_at, wo.completed_at,
            wo.vehicle_info, wo.complaint, wo.notes, wo.final_total,
            cp.company_name, cp.fio, cp.phone,
            u.username as master_name,
            wo.created_at, wo.updated_at
      FROM work_orders wo
      LEFT JOIN counterparties cp ON wo.customer_id = cp.id
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

router.post('/work-orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      customer_id, vehicle_id, vehicle_info, complaint, notes, priority,
      assigned_master, assigned_bay, promised_at, status,
      discount_type, discount_value, discount_reason
    } = req.body;
    
    const workItems = Array.isArray(req.body.work_items) ? req.body.work_items : [];
    const partsItems = Array.isArray(req.body.parts_items) ? req.body.parts_items : [];
    const totals = req.body.totals || {};
    
    console.log('🔍 POST /work-orders payload:', {
      customer_id, vehicle_id,
      work_items_count: workItems.length,
      parts_items_count: partsItems.length
    });
    
    const orderNumber = `WO-${Date.now().toString().slice(-6)}`;
    
    const orderResult = await client.query(`
      INSERT INTO work_orders (
        order_number, customer_id, vehicle_id, vehicle_info, complaint, notes,
        priority, assigned_master, assigned_bay, promised_at, status,
        discount_type, discount_value, discount_reason,
        final_total, total_cost, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING id, order_number, created_at
    `, [
      orderNumber, customer_id || null, vehicle_id || null,
      vehicle_info && Object.keys(vehicle_info).length > 0 ? JSON.stringify(vehicle_info) : null,
      complaint || '', notes || '', priority || 'normal',
      assigned_master || null, assigned_bay || null, promised_at || null,
      status || 'draft', discount_type || 'none', discount_value || 0, discount_reason || '',
      totals.final_total || totals.total || 0, totals.total || 0
    ]);
    
    const workOrderId = orderResult.rows[0].id;
    console.log('✅ Created work_order:', workOrderId);

    if (workItems.length > 0) {
      console.log('🔧 Saving work_items:', workItems.length);
      
      for (const item of workItems) {
        let serviceId = null;
        
        if (item.service_id) {
          serviceId = await resolveServiceId(item.service_id);
          if (!serviceId) {
            console.warn(`⚠️ Service not found: ${item.service_id}, name: ${item.name}`);
          }
        }
        
        await client.query(`
          INSERT INTO work_order_items (
            work_order_id, item_type, service_id, name, category, quantity, unit,
            unit_price, labor_hours, status, notes
          ) VALUES ($1, 'labor', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          workOrderId, 
          serviceId,
          item.name || '', 
          item.category || '',
          parseFloat(item.quantity) || 1, 
          item.unit || 'усл',
          parseFloat(item.unit_price) || 0, 
          parseFloat(item.labor_hours) || 0,
          item.status || 'pending', 
          item.notes || ''
        ]);
      }
    }
    
    // 🔧 Сохранение запчастей
    if (partsItems.length > 0) {
      console.log('🔧 Saving parts_items:', partsItems.length);
      
      for (const item of partsItems) {
        const partId = item.part_id || item.item_id;
        
        // 🔥 Если есть part_id, уменьшаем количество на складе
        if (partId) {
          await client.query(`
            UPDATE items 
            SET quantity = quantity - $1 
            WHERE id = $2 AND quantity >= $1
          `, [parseInt(item.quantity) || 1, partId]);
          
          // 🔥 Создаём запись в sold_parts
          await client.query(`
            INSERT INTO sold_parts (
              item_id, item_name, part_number, quantity, 
              selling_price, sale_date, counterparty_id
            )
            SELECT 
              $1, $2, $3, $4, $5, CURRENT_DATE, $6
            WHERE EXISTS (
              SELECT 1 FROM items WHERE id = $1
            )
          `, [
            partId,
            item.name || '',
            item.part_number || item.article || '',
            parseInt(item.quantity) || 1,
            parseFloat(item.unit_price) || 0,
            null // counterparty_id можно взять из work_orders.customer_id
          ]);
        }
        
        await client.query(`
          INSERT INTO work_order_items (
            work_order_id, item_type, part_id, name, category, quantity, unit,
            unit_price, part_number, manufacturer, status
          ) VALUES ($1, 'part', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          workOrderId, 
          partId || null, 
          item.name || '', 
          item.category || '',
          parseInt(item.quantity) || 1, 
          item.unit || 'шт',
          parseFloat(item.unit_price) || 0,
          item.part_number || item.article || '', 
          item.manufacturer || '',
          item.status || 'pending'
        ]);
      }
      console.log('✅ Saved parts_items');
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Заказ-наряд успешно создан',
      work_order: orderResult.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating work order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

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

router.post('/work-orders/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_customer_id, new_vehicle_id, notes_prefix } = req.body;
    
    await pool.query('BEGIN');
    try {
      const original = await pool.query(`SELECT * FROM work_orders WHERE id = $1`, [id]);
      if (original.rows.length === 0) throw new Error('Заказ-наряд не найден');
      
      const orig = original.rows[0];
      const newOrderNumber = `WO-${Date.now().toString().slice(-6)}`;
      
      const newWo = await pool.query(`
        INSERT INTO work_orders (order_number, customer_id, vehicle_id, complaint, notes,
                                 promised_at, assigned_master, assigned_bay, status, vehicle_info)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
        RETURNING id, order_number
      `, [
        newOrderNumber, new_customer_id || orig.customer_id, new_vehicle_id || orig.vehicle_id,
        orig.complaint, notes_prefix ? `${notes_prefix}: ${orig.notes || ''}` : orig.notes,
        null, orig.assigned_master, orig.assigned_bay, orig.vehicle_info
      ]);
      
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

router.post('/work-orders/from-template/:template_id', async (req, res) => {
  try {
    const { template_id } = req.params;
    const { customer_id, vehicle_id, complaint, notes, promised_at } = req.body;
    
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

router.get('/reports/customers-ltv', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    const result = await pool.query(`
      SELECT cp.id, COALESCE(cp.company_name, cp.fio) as name, cp.phone,
             COUNT(DISTINCT wo.id) as total_orders,
             SUM(wo.final_total) as total_spent,
             AVG(wo.final_total) as avg_order_value,
             MIN(wo.created_at) as first_order,
             MAX(wo.created_at) as last_order,
             EXTRACT(DAY FROM (MAX(wo.created_at) - MIN(wo.created_at))) as customer_lifetime_days
      FROM counterparties cp
      JOIN work_orders wo ON cp.id = wo.customer_id AND wo.status = 'completed'
      WHERE ($1::date IS NULL OR wo.created_at >= $1::date)
        AND ($2::date IS NULL OR wo.created_at <= $2::date)
      GROUP BY cp.id, cp.company_name, cp.fio, cp.phone
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

// ============================================================================
// PUT /api/crm/work-orders/:id — Обновление заказ-наряда (ИСПРАВЛЕННЫЙ)
// ============================================================================
router.put('/work-orders/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { 
      customer_id, vehicle_id, vehicle_info, complaint, notes,
      assigned_master, assigned_bay, promised_at, status,
      discount_type, discount_value, discount_reason,
      work_items, parts_items, totals
    } = req.body;
    
    console.log('🔍 PUT /work-orders/:id payload:', { 
      id, 
      work_items_count: work_items?.length, 
      parts_items_count: parts_items?.length 
    });
    
    // 1. Проверка существования
    const check = await client.query('SELECT id, order_number FROM work_orders WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Заказ-наряд не найден' });
    }
    
    // 2. Обновление основного заказ-наряда
    await client.query(`
      UPDATE work_orders SET
        customer_id = $1, vehicle_id = $2, vehicle_info = $3, complaint = $4, notes = $5,
        assigned_master = $6, assigned_bay = $7, promised_at = $8, status = $9,
        discount_type = $10, discount_value = $11, discount_reason = $12,
        final_total = $13, total_cost = $14, updated_at = NOW()
      WHERE id = $15
    `, [
      customer_id || null, vehicle_id || null,
      vehicle_info && Object.keys(vehicle_info).length > 0 ? JSON.stringify(vehicle_info) : null,
      complaint || '', notes || '', assigned_master || null, assigned_bay || null,
      promised_at || null, status || 'draft', discount_type || 'none',
      discount_value || 0, discount_reason || '',
      totals?.final_total || totals?.total || 0, totals?.total || 0, id
    ]);
    
    console.log('✅ Updated work_order base data');
    
    // 3. 🔥 ПОЛНОЕ удаление старых элементов (работ + запчастей)
    await client.query('DELETE FROM work_order_items WHERE work_order_id = $1', [id]);
    console.log('️ Cleared old work_order_items');
    
    // 4. Вставка новых работ
if (Array.isArray(work_items)) {
      console.log('🔧 Updating work_items:', work_items.length);
      
      // Удаляем старые работы
      await client.query(
        `DELETE FROM work_order_items 
         WHERE work_order_id = $1 AND item_type = 'labor'`, 
        [id]
      );
      
      for (const item of work_items) {
        // 🔥 Ключевой момент: резолвим service_id
        let serviceId = null;
        
        if (item.service_id) {
          serviceId = await resolveServiceId(item.service_id);
          if (!serviceId) {
            console.warn(`⚠️ Service not found: ${item.service_id}, name: ${item.name}`);
          }
        }
        
        await client.query(`
          INSERT INTO work_order_items (
            work_order_id, item_type, service_id, name, category, quantity, unit,
            unit_price, labor_hours, status, notes
          ) VALUES ($1, 'labor', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          id, 
          serviceId,  // ← Здесь будет число или null
          item.name || '', 
          item.category || '',
          parseFloat(item.quantity) || 1, 
          item.unit || 'усл',
          parseFloat(item.unit_price) || 0, 
          parseFloat(item.labor_hours) || 0,
          item.status || 'pending', 
          item.notes || ''
        ]);
      }
      console.log('✅ Updated work_items');
    }
    
    // 5. Вставка новых запчастей
    if (Array.isArray(parts_items)) {
      console.log('🔧 Updating parts_items:', parts_items.length);
      
      // Сначала получаем старые запчасти для восстановления количества
      const oldParts = await client.query(`
        SELECT part_id, quantity FROM work_order_items 
        WHERE work_order_id = $1 AND item_type = 'part'
      `, [id]);
      
      // Восстанавливаем старое количество на складе
      for (const oldPart of oldParts.rows) {
        if (oldPart.part_id) {
          await client.query(`
            UPDATE items 
            SET quantity = quantity + $1 
            WHERE id = $2
          `, [parseInt(oldPart.quantity) || 1, oldPart.part_id]);
        }
      }
      
      // Удаляем старые записи о продаже
      await client.query(`
        DELETE FROM sold_parts 
        WHERE item_id IN (
          SELECT part_id FROM work_order_items 
          WHERE work_order_id = $1 AND item_type = 'part'
        )
      `, [id]);
      
      // Удаляем старые запчасти из заказ-наряда
      await client.query(
        `DELETE FROM work_order_items 
         WHERE work_order_id = $1 AND item_type = 'part'`, 
        [id]
      );
      
      // Вставляем новые запчасти
      for (const item of parts_items) {
        const partId = item.part_id || item.item_id;
        
        if (partId) {
          // Уменьшаем количество на складе
          await client.query(`
            UPDATE items 
            SET quantity = quantity - $1 
            WHERE id = $2 AND quantity >= $1
          `, [parseInt(item.quantity) || 1, partId]);
          
          // Создаём запись о продаже
          await client.query(`
            INSERT INTO sold_parts (
              item_id, item_name, part_number, quantity, 
              selling_price, sale_date
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
          `, [
            partId,
            item.name || '',
            item.part_number || item.article || '',
            parseInt(item.quantity) || 1,
            parseFloat(item.unit_price) || 0
          ]);
        }
        
        await client.query(`
          INSERT INTO work_order_items (
            work_order_id, item_type, part_id, name, category, quantity, unit,
            unit_price, part_number, manufacturer, status
          ) VALUES ($1, 'part', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          id, 
          partId || null, 
          item.name || '', 
          item.category || '',
          parseInt(item.quantity) || 1, 
          item.unit || 'шт',
          parseFloat(item.unit_price) || 0,
          item.part_number || item.article || '', 
          item.manufacturer || '',
          item.status || 'pending'
        ]);
      }
      console.log('✅ Updated parts_items');
    }
    
    await client.query('COMMIT');
    console.log('✅ Work order updated successfully');
    res.json({ success: true, message: 'Заказ-наряд обновлён', work_order: { id } });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating work order:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

router.delete('/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const check = await pool.query('SELECT id, order_number FROM work_orders WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ-наряд не найден' });
    }
    
    await pool.query('DELETE FROM work_order_items WHERE work_order_id = $1', [id]);
    await pool.query('DELETE FROM work_order_status_history WHERE work_order_id = $1', [id]);
    await pool.query('DELETE FROM work_orders WHERE id = $1', [id]);
    
    console.log(`🗑️ Deleted work order #${id} (${check.rows[0].order_number})`);
    res.json({ success: true, message: 'Заказ-наряд удалён', deleted_id: parseInt(id) });
    
  } catch (error) {
    console.error('Error deleting work order:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ДАШБОРД ====================

router.get('/dashboard', async (req, res) => {
  try {
    const [stats, pendingOrders, revenue, topServices] = await Promise.all([
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM work_orders WHERE status = 'in_progress') as active_orders,
          (SELECT COUNT(*) FROM work_orders WHERE status = 'waiting_parts') as waiting_parts,
          (SELECT COUNT(*) FROM work_orders WHERE status = 'ready') as ready_for_pickup,
          (SELECT COUNT(*) FROM counterparties WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as active_customers_30d,
          (SELECT SUM(final_total) FROM work_orders WHERE completed_at >= CURRENT_DATE) as today_revenue,
          (SELECT COUNT(*) FROM work_orders WHERE promised_at < NOW() AND status NOT IN ('completed','cancelled','archived')) as overdue_orders
      `),
      pool.query(`
        SELECT wo.id, wo.order_number, wo.promised_at, wo.status,
               cp.phone,
               (wo.vehicle_info::jsonb)->>'brand' as brand,
               (wo.vehicle_info::jsonb)->>'model' as model,
               u.username as master_name,
               EXTRACT(EPOCH FROM (NOW() - wo.promised_at))/3600 as hours_overdue
        FROM work_orders wo
        JOIN counterparties cp ON wo.customer_id = cp.id
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

router.get('/dashboard/quick-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM work_orders WHERE status IN ('in_progress','waiting_parts')) as active_count,
        (SELECT COUNT(*) FROM work_orders WHERE promised_at < NOW() AND status = 'in_progress') as overdue_count,
        (SELECT SUM(final_total) FROM work_orders WHERE DATE(completed_at) = CURRENT_DATE) as today_revenue,
        (SELECT COUNT(*) FROM counterparties WHERE DATE(created_at) = CURRENT_DATE) as new_customers_today
    `);
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    res.status(500).json({ error: error.message });
  }
});
function drawTable(doc, columns, rows, startY) {
  const pageWidth = 595; // A4
  const margin = 40;
  const tableWidth = pageWidth - 2 * margin;
  const rowHeight = 22;
  const headerHeight = 25;
  
  // Рассчитываем ширину колонок
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scale = tableWidth / totalWidth;
  
  let x = margin;
  let y = startY;
  
  // 🔹 Рисуем заголовок
  doc.rect(margin, y, tableWidth, headerHeight).fill('#2c3e50');
  doc.fillColor('white').fontSize(10).font(path.join(__dirname, '../fonts/DejaVuSans-Bold.ttf'));
  
  let colX = margin;
  columns.forEach(col => {
    const colWidth = col.width * scale;
    if (col.align === 'right') {
      doc.text(col.title, colX + 5, y + 6, { 
        width: colWidth - 10, 
        align: 'right' 
      });
    } else {
      doc.text(col.title, colX + 5, y + 6, { 
        width: colWidth - 10 
      });
    }
    colX += colWidth;
  });
  
  y += headerHeight;
  
  // 🔹 Рисуем строки
  doc.font(path.join(__dirname, '../fonts/DejaVuSans.ttf')).fontSize(10);
  
  rows.forEach((row, index) => {
    // Чередование цветов
    if (index % 2 === 0) {
      doc.rect(margin, y, tableWidth, rowHeight).fill('#f8f9fa');
    } else {
      doc.rect(margin, y, tableWidth, rowHeight).fill('white');
    }
    
    doc.fillColor('black');
    colX = margin;
    
    columns.forEach((col, colIndex) => {
      const colWidth = col.width * scale;
      const cellValue = row[colIndex] !== undefined ? row[colIndex] : '';
      
      if (col.align === 'right') {
        doc.text(String(cellValue), colX + 5, y + 5, { 
          width: colWidth - 10, 
          align: 'right' 
        });
      } else {
        doc.text(String(cellValue), colX + 5, y + 5, { 
          width: colWidth - 10 
        });
      }
      colX += colWidth;
    });
    
    y += rowHeight;
    
    // Новая страница если нужно
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  });
  
  // 🔹 Рамка таблицы
  doc.rect(margin, startY, tableWidth, y - startY).stroke();
  
  return y;
}
// ============================================================================
// GET /api/crm/work-orders/:id/pdf — Генерация PDF (ФИНАЛЬНАЯ ВЕРСИЯ)
// ============================================================================
router.get('/work-orders/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    const wo = await pool.query(`
      SELECT 
        wo.id, wo.order_number, wo.complaint, wo.notes,
        wo.vehicle_info, wo.final_total, wo.total_cost,
        wo.created_at,
        COALESCE(cp.company_name, cp.fio) AS customer_name,
        cp.phone AS customer_phone,
        COALESCE(wo.vehicle_info->>'brand', v.brand) AS brand,
        COALESCE(wo.vehicle_info->>'model', v.model) AS model,
        COALESCE(wo.vehicle_info->>'vin', v.vin) AS vin,
        COALESCE(wo.vehicle_info->>'year', v.year::text) AS year
      FROM work_orders wo
      LEFT JOIN counterparties cp ON wo.customer_id = cp.id
      LEFT JOIN cars v ON wo.vehicle_id = v.id
      WHERE wo.id = $1
    `, [id]);
    
    if (wo.rows.length === 0) return res.status(404).json({ error: 'Заказ-наряд не найден' });
    
    const order = wo.rows[0];
    
    const items = await pool.query(`
      SELECT 
        woi.item_type, woi.service_id, woi.part_id,
        woi.name, woi.category, woi.quantity, woi.unit, woi.unit_price,
        woi.total_price, woi.labor_hours, woi.part_number, woi.manufacturer
      FROM work_order_items woi
      WHERE woi.work_order_id = $1
      ORDER BY woi.id
    `, [id]);
    
    // 🔥 Правильный фильтр
    const works = items.rows.filter(item => 
      item.item_type === 'labor' || 
      (item.part_id === null && !item.part_number && item.labor_hours !== null)
    );
    
    const parts = items.rows.filter(item => 
      item.item_type === 'part' || 
      item.part_id !== null || 
      item.part_number !== null
    );
    
    console.log('🔧 Works:', works.length);
    console.log('🔩 Parts:', parts.length);

    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 40, right: 40 } });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=work-order-${order.order_number}.pdf`);
    
    doc.pipe(res);
    doc.registerFont('Normal', FONT_PATH);
    doc.registerFont('Bold', FONT_BOLD_PATH);
    
    // ==================== ШАПКА С ЛОГОТИПОМ ====================
    try {
      doc.image(LOGO_PATH, 40, 50, { width: 150 });
    } catch (logoErr) {
      console.warn('⚠️ Logo not found, skipping');
    }
    
    doc.font('Bold').fontSize(22).text('ЗАКАЗ-НАРЯД', 200, 60);
    doc.font('Normal').fontSize(14).text(`№ ${order.order_number}`, 200, 90);
    doc.fontSize(11).text(`от ${new Date(order.created_at).toLocaleDateString('ru-RU')}`, 200, 110);
    
    doc.y = 150;
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    
    // ==================== КЛИЕНТ ====================
    doc.font('Bold').fontSize(12).text('ИНФОРМАЦИЯ О КЛИЕНТЕ', 40, doc.y);
    doc.moveDown(0.2);
    doc.font('Normal').fontSize(10);
    doc.text(`Клиент: ${order.customer_name || '—'}`, 40, doc.y);
    doc.text(`Телефон: ${order.customer_phone || '—'}`, 40, doc.y + 15);
    doc.moveDown(1);
    
    // ==================== АВТОМОБИЛЬ ====================
    doc.font('Bold').fontSize(12).text('АВТОМОБИЛЬ', 40, doc.y);
    doc.moveDown(0.2);
    doc.font('Normal').fontSize(10);
    doc.text(`Марка: ${order.brand || '—'}`, 40, doc.y);
    doc.text(`Модель: ${order.model || '—'}`, 40, doc.y + 15);
    doc.text(`VIN: ${order.vin || '—'}`, 40, doc.y + 30);
    doc.text(`Год: ${order.year || '—'}`, 40, doc.y + 45);
    doc.moveDown(1.5);
    
    // ==================== ЖАЛОБА ====================
    doc.font('Bold').fontSize(12).text('ЖАЛОБА КЛИЕНТА', 40, doc.y);
    doc.moveDown(0.2);
    doc.font('Normal').fontSize(10);
    doc.text(order.complaint || '—', 40, doc.y, { width: 515 });
    doc.moveDown(0.8);
    
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);
    
        // ==================== РАБОТЫ ====================
    // ==================== РАБОТЫ ====================
    doc.font('Bold').fontSize(12).text('ВЫПОЛНЕННЫЕ РАБОТЫ', 40, doc.y);
    doc.moveDown(0.3);
    
    if (works.length > 0) {
      const tableX = 40;
      const colWidths = [200, 100, 60, 75, 80]; // 🔥 Увеличил первую колонку
      const rowHeight = 18;
      const headerHeight = 20;
      const tableTop = doc.y;
      
      // Заголовок
      doc.rect(tableX, doc.y, 515, headerHeight).fill('#2c3e50');
      doc.fillColor('white').font('Bold').fontSize(9);
      
      const headerY = doc.y + 5;
      doc.text('Наименование', tableX + 5, headerY, { width: colWidths[0] - 10, lineBreak: false, ellipsis: true });
      doc.text('Категория', tableX + colWidths[0] + 5, headerY, { width: colWidths[1] - 10, lineBreak: false, ellipsis: true });
      doc.text('Часы', tableX + colWidths[0] + colWidths[1] + 5, headerY, { width: colWidths[2] - 10, align: 'center', lineBreak: false });
      doc.text('Цена', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 5, headerY, { width: colWidths[3] - 10, align: 'right', lineBreak: false });
      doc.text('Сумма', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, headerY, { width: colWidths[4] - 10, align: 'right', lineBreak: false });
      
      doc.y += headerHeight;
      doc.fillColor('black').font('Normal').fontSize(8.5); // 🔥 Уменьшил шрифт для плотности
      
      // Строки
      works.forEach((work, index) => {
        const total = (work.quantity || 1) * (work.unit_price || 0);
        const rowY = doc.y;
        
        // Фон
        if (index % 2 === 0) {
          doc.rect(tableX, rowY, 515, rowHeight).fill('#f8f9fa');
        }
        
        doc.fillColor('black');
        
        // 🔥 Все ячейки на одном Y + lineBreak: false + ellipsis
        doc.text(work.name || '—', tableX + 5, rowY + 4, { 
          width: colWidths[0] - 10, 
          lineBreak: false,
          ellipsis: true 
        });
        
        doc.text(work.category || '—', tableX + colWidths[0] + 5, rowY + 4, { 
          width: colWidths[1] - 10,
          lineBreak: false,
          ellipsis: true
        });
        
        doc.text(String(work.labor_hours || '—'), tableX + colWidths[0] + colWidths[1] + 5, rowY + 4, { 
          width: colWidths[2] - 10, 
          align: 'center',
          lineBreak: false
        });
        
        doc.text(`${(work.unit_price || 0).toLocaleString('ru-RU')} ₽`, tableX + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY + 4, { 
          width: colWidths[3] - 10, 
          align: 'right',
          lineBreak: false
        });
        
        doc.text(`${total.toLocaleString('ru-RU')} ₽`, tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, rowY + 4, { 
          width: colWidths[4] - 10, 
          align: 'right',
          lineBreak: false
        });
        
        // 🔥 Фиксированный переход к следующей строке
        doc.y = rowY + rowHeight;
      });
      
      // Рамка
      doc.rect(tableX, tableTop, 515, doc.y - tableTop).stroke();
      
      doc.moveDown(0.3);
      const worksTotal = works.reduce((sum, w) => sum + ((w.quantity || 1) * (w.unit_price || 0)), 0);
      doc.font('Bold').fontSize(11).text(`Итого по работам: ${worksTotal.toLocaleString('ru-RU')} ₽`, 40, doc.y, { align: 'right' });
      doc.moveDown(0.8);
    } else {
      doc.font('Normal').fontSize(10).text('Работы не выполнялись', 40, doc.y, { italics: true });
      doc.moveDown(0.8);
    }

    // ==================== ЗАПЧАСТИ ====================
    doc.font('Bold').fontSize(12).text('ЗАПЧАСТИ', 40, doc.y);
    doc.moveDown(0.3);
    
    if (parts.length > 0) {
      const tableX = 40;
      const colWidths = [150, 80, 80, 55, 75, 75]; // 🔥 Сбалансировал ширину
      const rowHeight = 18;
      const headerHeight = 20;
      const tableTop = doc.y;
      
      // Заголовок
      doc.rect(tableX, doc.y, 515, headerHeight).fill('#2c3e50');
      doc.fillColor('white').font('Bold').fontSize(9);
      
      const headerY = doc.y + 5;
      doc.text('Наименование', tableX + 5, headerY, { width: colWidths[0] - 10, lineBreak: false, ellipsis: true });
      doc.text('Артикул', tableX + colWidths[0] + 5, headerY, { width: colWidths[1] - 10, lineBreak: false, ellipsis: true });
      doc.text('Произв.', tableX + colWidths[0] + colWidths[1] + 5, headerY, { width: colWidths[2] - 10, lineBreak: false, ellipsis: true });
      doc.text('Кол-во', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 5, headerY, { width: colWidths[3] - 10, align: 'right', lineBreak: false });
      doc.text('Цена', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, headerY, { width: colWidths[4] - 10, align: 'right', lineBreak: false });
      doc.text('Сумма', tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, headerY, { width: colWidths[5] - 10, align: 'right', lineBreak: false });
      
      doc.y += headerHeight;
      doc.fillColor('black').font('Normal').fontSize(8.5);
      
      // Строки
      parts.forEach((part, index) => {
        const total = (part.quantity || 1) * (part.unit_price || 0);
        const rowY = doc.y;
        
        if (index % 2 === 0) {
          doc.rect(tableX, rowY, 515, rowHeight).fill('#f8f9fa');
        }
        
        doc.fillColor('black');
        
        doc.text(part.name || '—', tableX + 5, rowY + 4, { 
          width: colWidths[0] - 10,
          lineBreak: false,
          ellipsis: true
        });
        
        doc.text(part.part_number || '—', tableX + colWidths[0] + 5, rowY + 4, { 
          width: colWidths[1] - 10,
          lineBreak: false,
          ellipsis: true
        });
        
        doc.text(part.manufacturer || '—', tableX + colWidths[0] + colWidths[1] + 5, rowY + 4, { 
          width: colWidths[2] - 10,
          lineBreak: false,
          ellipsis: true
        });
        
        doc.text(`${part.quantity || 1} ${part.unit || 'шт'}`, tableX + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY + 4, { 
          width: colWidths[3] - 10,
          align: 'right',
          lineBreak: false
        });
        
        doc.text(`${(part.unit_price || 0).toLocaleString('ru-RU')} ₽`, tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, rowY + 4, { 
          width: colWidths[4] - 10,
          align: 'right',
          lineBreak: false
        });
        
        doc.text(`${total.toLocaleString('ru-RU')} ₽`, tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 5, rowY + 4, { 
          width: colWidths[5] - 10,
          align: 'right',
          lineBreak: false
        });
        
        doc.y = rowY + rowHeight;
      });
      
      // Рамка
      doc.rect(tableX, tableTop, 515, doc.y - tableTop).stroke();
      
      doc.moveDown(0.3);
      const partsTotal = parts.reduce((sum, p) => sum + ((p.quantity || 1) * (p.unit_price || 0)), 0);
      doc.font('Bold').fontSize(11).text(`Итого по запчастям: ${partsTotal.toLocaleString('ru-RU')} ₽`, 40, doc.y, { align: 'right' });
      doc.moveDown(0.5);
    } else {
      doc.font('Normal').fontSize(10).text('Запчасти не устанавливались', 40, doc.y, { italics: true });
      doc.moveDown(0.8);
    }
    // ==================== ИТОГО ====================
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    
    const finalTotal = order.final_total || order.total_cost || 0;
    doc.font('Bold').fontSize(14).text(`ВСЕГО К ОПЛАТЕ: ${finalTotal.toLocaleString('ru-RU')} ₽`, 40, doc.y, { align: 'right' });

    // ==================== ГАРАНТИЯ ====================
    doc.moveDown(0.8);
    doc.font('Bold').fontSize(10).text('ГАРАНТИЙНЫЕ УСЛОВИЯ', 40, doc.y);
    doc.moveDown(0.3);
    doc.font('Normal').fontSize(8);
    
    const warrantyLines = [
      '1. Гарантия на выполненные работы — 30 календарных дней с момента завершения.',
      '2. Гарантия на установленные запчасти — 90 календарных дней.',
      '3. Гарантия не распространяется на случаи неправильной эксплуатации.',
      '4. При обнаружении неисправности обращайтесь: +7 (999) 123-45-67',
      '5. Для обращения по гарантии предъявите данный заказ-наряд.'
    ];
    
    warrantyLines.forEach(line => {
      doc.text(line, 40, doc.y, { width: 515 });
      doc.moveDown(0.15);
    });
    
    doc.moveDown(1.5);
    doc.font('Normal').fontSize(10);
    const signY = doc.y;
    doc.text('_________________________', 40, signY, { width: 200 });
    doc.text('Подпись клиента', 40, signY + 15, { width: 200 });
    
    doc.text('_________________________', 350, signY, { width: 200 });
    doc.text('Подпись мастера', 350, signY + 15, { width: 200 });
    
    doc.end();
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({ error: error.message });
  }
});
export default router;