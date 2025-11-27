import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);

export default app;