// IMS/server/routes/logs.js
import express from 'express';
import pool from '../config/db.js';
import { logInfo } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Получить пользовательские логи (только админ)
router.get('/user-activity', async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action, date_from, date_to } = req.query;
    
    let query = `
      SELECT 
        l.id,
        l.user_id,
        l.username,
        l.action,
        l.entity_type,
        l.entity_id,
        l.old_value,
        l.new_value,
        l.ip_address,
        l.user_agent,
        l.created_at
      FROM user_activity_logs l
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND l.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (action) {
      query += ` AND l.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND l.created_at >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND l.created_at <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    
    // Получить общее количество записей
    const countQuery = `SELECT COUNT(*) FROM user_activity_logs WHERE 1=1`;
    const countResult = await pool.query(countQuery);

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
      },
    });

    logInfo('User activity logs viewed', { user: req.user?.username });
  } catch (error) {
    logError('Error fetching user activity logs', { error: error.message });
    res.status(500).json({ error: 'Ошибка при получении логов' });
  }
});

// Получить системные логи из файлов (только админ)
router.get('/system', async (req, res) => {
  try {
    const { type = 'error', lines = 100 } = req.query;
    const logFile = path.join(__dirname, `../logs/${type === 'error' ? 'error' : 'combined'}.log`);
    
    if (!fs.existsSync(logFile)) {
      return res.json({ logs: [], message: 'Log file not found' });
    }

    const fileContent = fs.readFileSync(logFile, 'utf-8');
    const allLines = fileContent.split('\n').filter(line => line.trim());
    const recentLines = allLines.slice(-lines);

    // Парсим JSON логи
    const parsedLogs = recentLines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });

    res.json({ logs: parsedLogs });
    logInfo('System logs viewed', { user: req.user?.username, type });
  } catch (error) {
    logError('Error fetching system logs', { error: error.message });
    res.status(500).json({ error: 'Ошибка при получении системных логов' });
  }
});

// Очистить старые логи (только админ)
router.delete('/user-activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    await pool.query(
      'DELETE FROM user_activity_logs WHERE created_at < NOW() - INTERVAL \'1 day\' * $1',
      [parseInt(days)]
    );

    logInfo('User activity logs cleaned', { user: req.user?.username, days });
    res.json({ success: true, message: `Удалены логи старше ${days} дней` });
  } catch (error) {
    logError('Error cleaning logs', { error: error.message });
    res.status(500).json({ error: 'Ошибка при очистке логов' });
  }
});

export default router;