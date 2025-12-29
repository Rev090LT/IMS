import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import pool from '../config/db.js';
import { sendSms } from '../utils/sms.js';
import { sendConfirmationCode } from '../utils/mail.js'; // <= Импортируем функцию

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // <<<--- Вот тут генерируется токен --->>>
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, // <= Вот тут
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});
/*
// Регистрация (шаг 1: запрос регистрации)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Username must be at least 3 chars and password at least 6 chars' });
  }

  try {
    // ... (проверки)

    // Генерируем 6-значный код
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Устанавливаем время истечения (1 час)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    // Сохраняем запрос в pending_registrations
    await pool.query(
      'INSERT INTO pending_registrations (username, password_hash, confirmation_code, expires_at) VALUES ($1, $2, $3, $4)',
      [username, hashedPassword, confirmationCode, expiresAt]
    );

    // <<<--- УДАЛИТЬ или ЗАКОММЕНТИРОВАТЬ --->>>
    await sendConfirmationCode(process.env.ADMIN_EMAIL, confirmationCode);

    // Вместо отправки письма — логируем код в консоль
    console.log('Confirmation code:', confirmationCode);

    res.status(200).json({ message: 'Registration request received. Code logged to console.' });
  } catch (err) {
    console.error('Error during registration request:', err);
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
*/
export default router;