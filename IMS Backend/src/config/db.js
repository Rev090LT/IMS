import pg from 'pg';

const { Pool } = pg;

// Используйте DATABASE_URL если доступен, иначе используйте отдельные параметры
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'inventory_user'}:${
    process.env.DB_PASSWORD || 'Knightrider2005'
  }@${process.env.DB_HOST || 'db'}:${process.env.DB_PORT || 5432}/${
    process.env.DB_NAME || 'inventory_db'
  }`;

console.log('Connecting to database:', connectionString);

const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Отключаем SSL для локального использования в Docker
  ssl: false
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;