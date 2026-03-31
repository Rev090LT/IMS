// db.js
import pg from 'pg';
import dotenv from 'dotenv';

// Загружаем .env (если ещё не загружен)
dotenv.config();

const { Pool } = pg;

// Определяем режим работы: 'local' или 'docker'
// Можно задать явно: APP_MODE=local или APP_MODE=docker
const APP_MODE = process.env.APP_MODE || 
  (process.env.DB_HOST === 'localhost' ? 'local' : 'docker');

console.log(`🔧 Database mode: ${APP_MODE}`);

let poolConfig;

if (APP_MODE === 'local') {
  // === ЛОКАЛЬНЫЙ РЕЖИМ (отладка на локальном PostgreSQL) ===
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'inventory_db',
    user: process.env.DB_USER || 'inventory_user',
    password: process.env.DB_PASSWORD || 'Knightrider2005',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // чуть больше для локального подключения
    ssl: false, // отключаем SSL для локальной БД
  };
  
  console.log('📍 Connecting to LOCAL PostgreSQL:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
  });
  
} else {
  // === DOCKER РЕЖИМ (продакшн / контейнеры) ===
  // Используем DATABASE_URL из .env или собираем из отдельных переменных
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'inventory_user'}:${
      process.env.DB_PASSWORD || 'Knightrider2005'
    }@${process.env.DB_HOST || 'db'}:${process.env.DB_PORT || 5432}/${
      process.env.DB_NAME || 'inventory_db'
    }`;
  
  console.log('🐳 Connecting to DOCKER PostgreSQL:', connectionString.replace(/:[^@]+@/, ':***@')); // скрываем пароль в логе
  
  poolConfig = {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: false, // для внутренней Docker-сети SSL обычно не нужен
  };
}

// Создаём пул подключений
const pool = new Pool(poolConfig);

// Обработчики событий
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  // Не завершаем процесс, но логируем ошибку
});

// Проверка подключения при старте (опционально)
pool.connect()
  .then(client => {
    console.log('🎯 Database connection test: SUCCESS');
    client.release();
  })
  .catch(err => {
    console.error('🚨 Database connection test: FAILED', err.message);
    console.log('💡 Проверь: запущен ли PostgreSQL, правильные ли учетные данные в .env');
  });

export default pool;