import dotenv from 'dotenv';
import app from './app.js';  // <= Должно быть из app.js
import pool from './config/db.js'; // Подключаем pool напрямую


dotenv.config();

const PORT = process.env.PORT || 3000;

// Проверим подключение к БД
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }

  console.log('Database connected successfully');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});