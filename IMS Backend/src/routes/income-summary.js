// routes/income-summary.js

import express from 'express';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// <<<--- Получить сводку по доходам с запчастей --->
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Общая выручка и количество продаж
    const summaryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(selling_price * quantity), 0) as total_income,
        COUNT(*) as total_sales
      FROM sold_parts
    `);

    // Выручка по дням
// В routes/income-summary.js

// routes/income-summary.js

    const dailyResult = await pool.query(`
    SELECT 
        sale_date,
        COUNT(*) as daily_sales,
        SUM(selling_price * quantity) as daily_income,
        COALESCE(json_agg(
        json_build_object(
            'item_id', item_id,
            'item_name', item_name,
            'quantity', quantity,
            'selling_price', selling_price,
            'counterparty_id', counterparty_id,
            'supplier_id', supplier_id,
            'counterparty_name', c.fio,
            'supplier_name', s.name
        )
        ) FILTER (WHERE item_id IS NOT NULL), '[]'::json) as details
    FROM sold_parts sp
    LEFT JOIN counterparties c ON sp.counterparty_id = c.id
    LEFT JOIN suppliers s ON sp.supplier_id = s.id
    WHERE sale_date IS NOT NULL
    GROUP BY sale_date
    ORDER BY sale_date DESC
    `);
    // <<<--- Добавим проверку, что details — массив --->
    const processedDaily = dailyResult.rows.map(row => ({
      ...row,
      details: Array.isArray(row.details) ? row.details : []
    }));

    res.json({
      total: parseFloat(summaryResult.rows[0].total_income),
      count: parseInt(summaryResult.rows[0].total_sales),
      daily: processedDaily
    });
  } catch (err) {
    console.error('Error fetching income summary:', err);
    res.status(500).json({ error: 'Failed to fetch income summary' });
  }
});

export default router;