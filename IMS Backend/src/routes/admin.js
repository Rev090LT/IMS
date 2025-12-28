import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const router = express.Router();

// <<<--- НОВЫЙ МЕТОД ДЛЯ ДОБАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ --->>>
router.post('/add-user', async (req, res) => {
  const { username, password, role = 'user' } = req.body;

  if (!username || !password || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Username must be at least 3 chars and password at least 6 chars' });
  }

  try {
    // Проверим, не существует ли уже пользователь
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Добавляем пользователя
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;