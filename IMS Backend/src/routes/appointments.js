// IMS/server/routes/appointments.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Получить все записи (с фильтрацией)
router.get('/', async (req, res) => {
  try {
    const { date_from, date_to, status } = req.query;
    
    let query = `
      SELECT 
        a.*,
        u.username as created_by_username
      FROM garage_appointments a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (date_from) {
      query += ` AND a.appointment_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND a.appointment_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
});

// Получить записи по конкретному дню
router.get('/by-date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM garage_appointments 
       WHERE appointment_date = $1 
       ORDER BY appointment_time ASC`,
      [date]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
});

// Создать запись
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_email,
      car_model,
      car_vin,
      car_license_plate,
      appointment_date,
      appointment_time,
      reason,
      notes
    } = req.body;

    if (!customer_name || !appointment_date) {
      return res.status(400).json({ error: 'Имя клиента и дата обязательны' });
    }

    const result = await pool.query(
      `INSERT INTO garage_appointments 
       (customer_name, customer_phone, customer_email, car_model, car_vin, 
        car_license_plate, appointment_date, appointment_time, reason, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        customer_name,
        customer_phone || null,
        customer_email || null,
        car_model || null,
        car_vin || null,
        car_license_plate || null,
        appointment_date,
        appointment_time || null,
        reason || null,
        notes || null,
        req.user?.id || null
      ]
    );

    res.json({ success: true, appointment: result.rows[0] });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Ошибка при создании записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      customer_phone,
      customer_email,
      car_model,
      car_vin,
      car_license_plate,
      appointment_date,
      appointment_time,
      reason,
      status,
      notes
    } = req.body;

    const result = await pool.query(
      `UPDATE garage_appointments 
       SET customer_name = COALESCE($1, customer_name),
           customer_phone = COALESCE($2, customer_phone),
           customer_email = COALESCE($3, customer_email),
           car_model = COALESCE($4, car_model),
           car_vin = COALESCE($5, car_vin),
           car_license_plate = COALESCE($6, car_license_plate),
           appointment_date = COALESCE($7, appointment_date),
           appointment_time = COALESCE($8, appointment_time),
           reason = COALESCE($9, reason),
           status = COALESCE($10, status),
           notes = COALESCE($11, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        customer_name,
        customer_phone,
        customer_email,
        car_model,
        car_vin,
        car_license_plate,
        appointment_date,
        appointment_time,
        reason,
        status,
        notes,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.json({ success: true, appointment: result.rows[0] });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Ошибка при обновлении записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM garage_appointments WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Ошибка при удалении записи' });
  }
});

export default router;