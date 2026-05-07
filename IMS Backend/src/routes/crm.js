// IMS/server/routes/crm.js
import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import { fileURLToPath } from 'url';
import { importServicesFromExcel, getServiceStats } from '../utils/service-importer.js';
const router = express.Router();


const serviceUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', 'services');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `services-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /xlsx|xls/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ext);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/services/import', serviceUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    const result = await importServicesFromExcel(req.file.path);
    
    // Удаляем временный файл
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Импортировано ${result.imported} услуг (обновлено: ${result.updated}, пропущено: ${result.skipped})`,
      stats: result
    });
    
  } catch (error) {
    console.error('Error importing services:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services — Поиск услуг с фильтрацией
router.get('/services', async (req, res) => {
  try {
    const { search, category, min_hours, max_hours, is_group, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        id, service_code, name, full_name, category,
        labor_hours, base_price, comment, additional,
        is_active, created_at
      FROM services
      WHERE is_active = TRUE
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Поиск по названию
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR service_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }
    
    // Фильтр по категории
    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    // Фильтр по нормо-часам
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
    
    // Получаем общее количество
    const countQuery = `
      SELECT COUNT(*) FROM services
      WHERE is_active = TRUE
      ${search ? 'AND (name ILIKE $1 OR full_name ILIKE $1)' : ''}
    `;
    const count = await pool.query(countQuery, search ? [`%${search}%`] : []);
    
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

// GET /api/crm/services/categories — Список категорий
router.get('/services/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as services_count,
        AVG(labor_hours) as avg_hours,
        ROUND(AVG(base_price)) as avg_price
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
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/services/:id — Детали услуги
router.get('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// КЛИЕНТЫ
// ============================================================================

// GET /api/crm/customers — список клиентов с фильтрацией
router.get('/customers', async (req, res) => {
  try {
    const { search, loyalty, phone, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        cc.*,
        cp.name as counterparty_name,
        (SELECT COUNT(*) FROM work_orders wo WHERE wo.customer_id = cc.id) as orders_count,
        (SELECT SUM(final_total) FROM work_orders wo WHERE wo.customer_id = cc.id AND wo.status = 'completed') as total_spent
      FROM crm_customers cc
      LEFT JOIN counterparties cp ON cc.counterparty_id = cp.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (cc.phone_primary ILIKE $${paramIndex} OR cp.name ILIKE $${paramIndex} OR cc.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (loyalty) {
      query += ` AND cc.loyalty_level = $${paramIndex}`;
      params.push(loyalty);
      paramIndex++;
    }
    if (phone) {
      query += ` AND cc.phone_primary = $${paramIndex}`;
      params.push(phone);
      paramIndex++;
    }
    
    query += ` ORDER BY cc.last_visit_date DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/customers — создать клиента
router.post('/customers', async (req, res) => {
  try {
    const { 
      counterparty_id, phone_primary, phone_secondary, email, 
      telegram, address_actual, preferred_contact_method, 
      source, promo_code, notes 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO crm_customers 
       (counterparty_id, phone_primary, phone_secondary, email, telegram, 
        address_actual, preferred_contact_method, source, promo_code, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [counterparty_id || null, phone_primary, phone_secondary || null, email || null, 
       telegram || null, address_actual || null, preferred_contact_method || 'phone',
       source || null, promo_code || null, notes || null]
    );
    
    res.json({ success: true, customer: result.rows[0] });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/customers/:id — карточка клиента
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [customer, orders, notifications] = await Promise.all([
      pool.query('SELECT * FROM crm_customers WHERE id = $1', [id]),
      pool.query(`
        SELECT wo.*, 
               (SELECT ARRAY_AGG(json_build_object(
                 'id', woi.id, 'name', woi.name, 'total_price', woi.total_price, 'status', woi.status
               )) FROM work_order_items woi WHERE woi.work_order_id = wo.id) as items
        FROM work_orders wo 
        WHERE wo.customer_id = $1 
        ORDER BY wo.created_at DESC 
        LIMIT 20
      `, [id]),
      pool.query('SELECT * FROM customer_notifications WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10', [id])
    ]);
    
    if (customer.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }
    
    res.json({
      customer: customer.rows[0],
      recent_orders: orders.rows,
      recent_notifications: notifications.rows
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ЗАКАЗ-НАРЯДЫ
// ============================================================================

// POST /api/crm/work-orders — создать заказ-наряд
router.post('/work-orders', async (req, res) => {
  try {
    const {
      customer_id, vehicle_id, vehicle_vin, vehicle_info,
      complaint, priority = 'normal', assigned_master, assigned_bay,
      promised_at, notes
    } = req.body;
    
    // Генерируем номер заказа: WO-YYYY-NNNNN
    const year = new Date().getFullYear();
    const lastOrder = await pool.query(
      "SELECT order_number FROM work_orders WHERE order_number LIKE $1 ORDER BY order_number DESC LIMIT 1",
      [`WO-${year}-%`]
    );
    
    let nextNum = 1;
    if (lastOrder.rows.length > 0) {
      const lastNum = parseInt(lastOrder.rows[0].order_number.split('-')[2]);
      nextNum = lastNum + 1;
    }
    const orderNumber = `WO-${year}-${String(nextNum).padStart(5, '0')}`;
    
    const result = await pool.query(
      `INSERT INTO work_orders 
       (order_number, customer_id, vehicle_id, vehicle_vin, vehicle_info,
        complaint, priority, assigned_master, assigned_bay, promised_at, notes,
        created_by, accepted_by, accepted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       RETURNING *`,
      [orderNumber, customer_id, vehicle_id || null, vehicle_vin || null, vehicle_info || null,
       complaint, priority, assigned_master || null, assigned_bay || null, promised_at || null, notes || null,
       req.user?.id, req.user?.id]
    );
    
    // Обновляем статистику клиента
    await pool.query(
      `UPDATE crm_customers 
       SET total_visits = total_visits + 1, last_visit_date = CURRENT_DATE
       WHERE id = $1`,
      [customer_id]
    );
    
    res.json({ success: true, work_order: result.rows[0] });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/work-orders — список с фильтрами
router.get('/work-orders', async (req, res) => {
  try {
    const { status, master, customer, date_from, date_to, search, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        wo.*,
        c.phone_primary as customer_phone,
        c.loyalty_level,
        u.username as master_name,
        l.name as bay_name
      FROM work_orders wo
      JOIN crm_customers c ON wo.customer_id = c.id
      LEFT JOIN users u ON wo.assigned_master = u.id
      LEFT JOIN locations l ON wo.assigned_bay = l.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND wo.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (master) {
      query += ` AND wo.assigned_master = $${paramIndex}`;
      params.push(master);
      paramIndex++;
    }
    if (customer) {
      query += ` AND wo.customer_id = $${paramIndex}`;
      params.push(customer);
      paramIndex++;
    }
    if (date_from) {
      query += ` AND wo.created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }
    if (date_to) {
      query += ` AND wo.created_at <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }
    if (search) {
      query += ` AND (wo.order_number ILIKE $${paramIndex} OR wo.complaint ILIKE $${paramIndex} OR c.phone_primary ILIKE $${paramIndex})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }
    
    query += ` ORDER BY wo.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/work-orders/:id — детали заказ-наряда
router.get('/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [order, items, history, attachments, payments] = await Promise.all([
      pool.query(`
        SELECT wo.*, 
               c.*, 
               v.brand as vehicle_brand, v.model as vehicle_model,
               u.username as master_name,
               l.name as bay_name
        FROM work_orders wo
        JOIN crm_customers c ON wo.customer_id = c.id
        LEFT JOIN cars v ON wo.vehicle_id = v.id
        LEFT JOIN users u ON wo.assigned_master = u.id
        LEFT JOIN locations l ON wo.assigned_bay = l.id
        WHERE wo.id = $1
      `, [id]),
      pool.query(`
        SELECT woi.*, 
               s.name as service_name, 
               i.name as part_name,
               cp.part_name as car_part_name
        FROM work_order_items woi
        LEFT JOIN services s ON woi.service_id = s.id
        LEFT JOIN items i ON woi.part_id = i.id
        LEFT JOIN car_parts cp ON woi.car_part_id = cp.id
        WHERE woi.work_order_id = $1
        ORDER BY woi.created_at
      `, [id]),
      pool.query('SELECT * FROM work_order_history WHERE work_order_id = $1 ORDER BY changed_at DESC', [id]),
      pool.query('SELECT * FROM work_order_attachments WHERE work_order_id = $1', [id]),
      pool.query('SELECT * FROM payments WHERE work_order_id = $1 ORDER BY payment_date DESC', [id])
    ]);
    
    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ-наряд не найден' });
    }
    
    res.json({
      order: order.rows[0],
      items: items.rows,
      history: history.rows,
      attachments: attachments.rows,
      payments: payments.rows
    });
  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/crm/work-orders/:id/status — обновить статус
router.put('/work-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    const validStatuses = ['draft', 'accepted', 'in_progress', 'waiting_parts', 'ready', 'completed', 'cancelled', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }
    
    // Обновляем статус
    const updateFields = {
      'accepted': { accepted_at: new Date() },
      'in_progress': { started_at: new Date() },
      'ready': { actual_ready_at: new Date() },
      'completed': { completed_at: new Date() }
    };
    
    const setClause = Object.entries(updateFields[status] || {})
      .map((field, idx) => `${field[0]} = $${idx + 2}`)
      .join(', ');
    
    const values = [status, ...Object.values(updateFields[status] || {}), id];
    
    await pool.query(
      `UPDATE work_orders SET status = $1${setClause ? ', ' + setClause : ''}, updated_at = NOW() WHERE id = $${values.length}`,
      values
    );
    
    // Логируем изменение
    await pool.query(
      `INSERT INTO work_order_history (work_order_id, field_name, old_value, new_value, changed_by, comment)
       VALUES ($1, 'status', 
               (SELECT status FROM work_orders WHERE id = $1), 
               $2, $3, $4)`,
      [id, status, req.user?.id, comment || null]
    );
    
    // Если статус "ready" — отправляем уведомление клиенту
    if (status === 'ready') {
      await pool.query(
        `INSERT INTO customer_notifications 
         (customer_id, work_order_id, notification_type, channel, recipient, message_body, scheduled_for)
         SELECT 
           wo.customer_id, wo.id, 'order_ready', cc.preferred_contact_method, 
           CASE cc.preferred_contact_method 
             WHEN 'sms' THEN cc.phone_primary 
             WHEN 'telegram' THEN cc.telegram 
             WHEN 'email' THEN cc.email 
           END,
           'Ваш автомобиль готов! Заказ-наряд: ' || wo.order_number,
           NOW()
         FROM work_orders wo
         JOIN crm_customers cc ON wo.customer_id = cc.id
         WHERE wo.id = $1`,
        [id]
      );
    }
    
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating work order status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crm/work-orders/:id/items — добавить позицию
router.post('/work-orders/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_type, service_id, part_id, car_part_id,
      name, description, category,
      quantity, unit, unit_price, discount_percent,
      labor_hours, hourly_rate, performed_by,
      part_source, supplier_id, purchase_price,
      notes
    } = req.body;
    
    const total_price = quantity * unit_price * (1 - (discount_percent || 0) / 100);
    
    const result = await pool.query(
      `INSERT INTO work_order_items 
       (work_order_id, item_type, service_id, part_id, car_part_id,
        name, description, category,
        quantity, unit, unit_price, discount_percent, total_price,
        labor_hours, hourly_rate, performed_by,
        part_source, supplier_id, purchase_price,
        notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [id, item_type, service_id || null, part_id || null, car_part_id || null,
       name, description || null, category || null,
       quantity || 1, unit || 'шт', unit_price, discount_percent || 0, total_price,
       labor_hours || null, hourly_rate || null, performed_by || null,
       part_source || null, supplier_id || null, purchase_price || null,
       notes || null]
    );
    
    // Пересчитываем итоги заказ-наряда
    await recalculateWorkOrderTotals(id);
    
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('Error adding work order item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Вспомогательная функция пересчёта итогов
async function recalculateWorkOrderTotals(workOrderId) {
  await pool.query(`
    UPDATE work_orders wo
    SET 
      labor_hours_total = COALESCE((
        SELECT SUM(labor_hours) FROM work_order_items 
        WHERE work_order_id = wo.id AND item_type = 'labor'
      ), 0),
      parts_cost_total = COALESCE((
        SELECT SUM(total_price) FROM work_order_items 
        WHERE work_order_id = wo.id AND item_type = 'part'
      ), 0),
      final_total = COALESCE((
        SELECT SUM(total_price) FROM work_order_items WHERE work_order_id = wo.id
      ), 0),
      updated_at = NOW()
    WHERE wo.id = $1
  `, [workOrderId]);
}

// ============================================================================
// ОТЧЁТЫ И АНАЛИТИКА
// ============================================================================

// GET /api/crm/reports/revenue — финансовый отчёт
router.get('/reports/revenue', async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = req.query;
    
    const interval = group_by === 'week' ? 'week' : group_by === 'month' ? 'month' : 'day';
    
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC($1, COALESCE(wo.completed_at, wo.created_at)) as period,
        COUNT(DISTINCT wo.id) as orders_count,
        COUNT(DISTINCT wo.customer_id) as unique_customers,
        SUM(wo.final_total) as total_revenue,
        SUM(wo.paid_amount) as collected_amount,
        SUM(CASE WHEN wo.payment_status = 'paid' THEN wo.final_total ELSE 0 END) as paid_revenue,
        AVG(wo.final_total) as avg_check,
        SUM(CASE WHEN woi.item_type = 'labor' THEN woi.total_price ELSE 0 END) as labor_revenue,
        SUM(CASE WHEN woi.item_type = 'part' THEN woi.total_price ELSE 0 END) as parts_revenue
      FROM work_orders wo
      LEFT JOIN work_order_items woi ON wo.id = woi.work_order_id
      WHERE wo.status IN ('completed', 'archived')
        AND ($2::date IS NULL OR COALESCE(wo.completed_at, wo.created_at) >= $2::date)
        AND ($3::date IS NULL OR COALESCE(wo.completed_at, wo.created_at) <= $3::date)
      GROUP BY DATE_TRUNC($1, COALESCE(wo.completed_at, wo.created_at))
      ORDER BY period DESC
    `, [interval, date_from || null, date_to || null]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crm/reports/masters — отчёт по мастерам
router.get('/reports/masters', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    const result = await pool.query(`
      SELECT 
        u.id, u.username, u.role,
        COUNT(DISTINCT CASE WHEN wo.status = 'in_progress' THEN wo.id END) as active_orders,
        COUNT(DISTINCT CASE WHEN wo.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN wo.id END) as orders_week,
        COUNT(DISTINCT CASE WHEN wo.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN wo.id END) as orders_month,
        SUM(CASE WHEN wo.status = 'completed' THEN woi.labor_hours ELSE 0 END) as hours_month,
        SUM(CASE WHEN wo.status = 'completed' THEN woi.total_price ELSE 0 END) as revenue_month,
        AVG(CASE WHEN wo.status = 'completed' THEN wo.final_total END) as avg_order_value,
        AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.started_at))/3600) as avg_job_duration
      FROM users u
      LEFT JOIN work_orders wo ON u.id = wo.assigned_master 
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

// GET /api/crm/dashboard — сводка для дашборда
router.get('/dashboard', async (req, res) => {
  try {
    const [stats, todayOrders, pendingOrders, revenue] = await Promise.all([
      // Общая статистика
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM work_orders WHERE status = 'in_progress') as active_orders,
          (SELECT COUNT(*) FROM work_orders WHERE status = 'waiting_parts') as waiting_parts,
          (SELECT COUNT(*) FROM work_orders WHERE status = 'ready') as ready_for_pickup,
          (SELECT COUNT(*) FROM crm_customers WHERE last_visit_date >= CURRENT_DATE - INTERVAL '30 days') as active_customers_30d,
          (SELECT SUM(final_total) FROM work_orders WHERE completed_at >= CURRENT_DATE) as today_revenue
      `),
      
      // Заказы на сегодня
      pool.query(`
        SELECT wo.id, wo.order_number, wo.status, wo.priority,
               c.phone_primary, c.loyalty_level,
               wo.vehicle_info->>'brand' as brand, wo.vehicle_info->>'model' as model,
               wo.promised_at, u.username as master_name
        FROM work_orders wo
        JOIN crm_customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.assigned_master = u.id
        WHERE DATE(wo.promised_at) = CURRENT_DATE OR DATE(wo.created_at) = CURRENT_DATE
        ORDER BY 
          CASE wo.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
          wo.promised_at ASC NULLS LAST
        LIMIT 10
      `),
      
      // Просроченные заказы
      pool.query(`
        SELECT wo.id, wo.order_number, wo.promised_at, wo.status,
               c.phone_primary, c.loyalty_level,
               wo.vehicle_info->>'brand' as brand, wo.vehicle_info->>'model' as model,
               u.username as master_name,
               EXTRACT(EPOCH FROM (NOW() - wo.promised_at))/3600 as hours_overdue
        FROM work_orders wo
        JOIN crm_customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.assigned_master = u.id
        WHERE wo.promised_at < NOW() AND wo.status NOT IN ('completed', 'cancelled', 'archived')
        ORDER BY wo.promised_at ASC
        LIMIT 10
      `),
      
      // Выручка за последние 7 дней
      pool.query(`
        SELECT 
          DATE(wo.completed_at) as date,
          SUM(wo.final_total) as revenue
        FROM work_orders wo
        WHERE wo.status = 'completed' 
          AND wo.completed_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(wo.completed_at)
        ORDER BY date
      `)
    ]);
    
    res.json({
      stats: stats.rows[0] || {},
      today_orders: todayOrders.rows,
      pending_orders: pendingOrders.rows,
      revenue_chart: revenue.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;