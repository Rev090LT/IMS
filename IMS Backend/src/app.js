import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/db.js';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import locationsRoutes from './routes/locations.js';
import movementsRoutes from './routes/movements.js';
import sqlRoutes from './routes/sql.js';
import adminRoutes from './routes/admin.js';
import lookupRoutes from './routes/lookup.js';
import counterpartiesRouter from './routes/counterparties.js';
import suppliersRouter from './routes/suppliers.js';
import soldPartsRouter from './routes/sold-parts.js';
import incomeSummaryRouter from './routes/income-summary.js';
import addUserRouter from './routes/add-user.js';
import photosRoutes from './routes/photos.js';
import logsRoutes from './routes/logs.js';
import { httpLogger } from './utils/logger.js';
import appointmentsRoutes from './routes/appointments.js';
import carsRoutes from './routes/cars.js';  // ← Должно быть
import { upload } from './middleware/upload.js';

const app = express();

// <<<--- Создадим папку logs, если её нет --->
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Добавляем CORS заголовки для изображений
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/sql', sqlRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cars', carsRoutes);  
app.use('/api/lookup', lookupRoutes);
app.use('/api/counterparties', counterpartiesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/sold-parts', soldPartsRouter);
app.use('/api/income-summary', incomeSummaryRouter);
app.use('/api/add-user', addUserRouter);
app.use('/api/photos', photosRoutes);
app.use('/uploads', express.static('uploads'));
app.use(httpLogger); // Логирование всех HTTP запросов
app.use('/api/logs', logsRoutes);
app.use('/api/appointments', appointmentsRoutes);
// <<<--- Маршрут для получения логов --->
app.get('/api/node-logs', (req, res) => {
  try {
    // <<<--- Проверим, существует ли файл --->
    if (!fs.existsSync(logFilePath)) {
      // <<<--- Если нет, создадим его --->
      fs.writeFileSync(logFilePath, '', { flag: 'w' });
    }

    const data = fs.readFileSync(logFilePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '').slice(-100); // последние 100 строк

    res.json({ logs: lines });
  } catch (err) {
    console.error('Error reading log file:', err);
    res.status(500).json({ error: 'Failed to read log file' });
  }
});

export default app;