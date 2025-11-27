import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

export const User = {
  create: async (data) => {
    const { username, password, role } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3) RETURNING id, username, role`,
      [username, hashedPassword, role || 'user']
    );
    return result.rows[0];
  },

  findByUsername: async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  },
};