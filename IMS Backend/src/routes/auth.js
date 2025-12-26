import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import pool from '../config/db.js';
import { sendSms } from '../utils/sms.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findByUsername(username);

  if (user && await bcrypt.compare(password, user.password_hash)) {
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }
});

// Регистрация (шаг 1: запрос регистрации)
router.post('/register', async (req, res) => {
  const { username, password, phone } = req.body;

  if (!username || !password || !phone || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Username, password, and phone are required' });
  }

  try {
    // ... (проверки)

    // Генерируем 6-значный код
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем запрос в pending_users с кодом
    await pool.query(
      'INSERT INTO pending_users (username, password_hash, phone, confirmation_code) VALUES ($1, $2, $3, $4)',
      [username, hashedPassword, phone, confirmationCode]
    );

    // <<<--- Вот тут должна быть строка: --->>>
    console.log('Sending SMS to:', phone, 'with code:', confirmationCode); // <= Временный лог
    await sendSms(phone, `Your confirmation code: ${confirmationCode}`); // <= Вот тут

    res.status(200).json({ message: 'Registration request received. Please check your SMS for confirmation code.' });
  } catch (err) {
    console.error('Error during registration request:', err); // <= Вот тут будет ошибка, если sendSms упадёт
    res.status(500).json({ error: err.message });
  }
});

// Завершение регистрации (шаг 2: ввод кода)
router.post('/confirm-registration', async (req, res) => {
  const { username, confirmation_code } = req.body;

  if (!username || !confirmation_code) {
    return res.status(400).json({ error: 'Username and confirmation code are required' });
  }

  try {
    // Находим запрос регистрации
    const pending = await pool.query(
      'SELECT * FROM pending_users WHERE username = $1 AND confirmation_code = $2 AND approved = FALSE',
      [username, confirmation_code]
    );

    if (pending.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }

    const user = pending.rows[0];

    // Создаём пользователя в основной таблице
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [user.username, user.password_hash, 'user']
    );

    // Удаляем из pending_users
    await pool.query('DELETE FROM pending_users WHERE id = $1', [user.id]);

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error confirming registration:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;