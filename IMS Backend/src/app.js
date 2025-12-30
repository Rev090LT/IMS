import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './config/db.js'; // Добавим pool, т.к. он используется в /items/
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js'; // Убедитесь, что импортирован
import locationsRoutes from './routes/locations.js'; // Убедитесь, что импортирован
import movementsRoutes from './routes/movements.js';
import sqlRoutes from './routes/sql.js';
import adminRoutes from './routes/admin.js'; // <= Импортируем новый маршрут
import lookupRoutes from './routes/lookup.js';
const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes); // Убедитесь, что этот маршрут подключён
app.use('/api/locations', locationsRoutes); // И этот тоже
app.use('/api/sql', sqlRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lookup', lookupRoutes);
export default app;