import dotenv from 'dotenv';
import 'dotenv/config';
import app from './app.js';
import pool from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const PORT = process.env.PORT || 3000;

// <<<--- Правильное определение __dirname для ES-модулей --->
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// <<<--- Создадим папку logs, если её нет --->
const logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Created logs directory');
}

// <<<--- Создадим файл app.log, если его нет --->
const logFilePath = path.join(logsDir, 'app.log');
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '', { flag: 'w' });
  console.log('Created app.log file');
}

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