import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'inventory_user',
  password: process.env.DB_PASSWORD || 'CharlySays',
  database: process.env.DB_NAME || 'inventory_db',
  port: 5432,
});

export default pool;