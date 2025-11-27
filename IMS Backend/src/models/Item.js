import pool from '../config/db.js';

export const Item = {
  getByQR: async (qr_code) => {
    const result = await pool.query('SELECT * FROM items WHERE qr_code = $1', [qr_code]);
    return result.rows[0];
  },

  create: async (data) => {
    const { qr_code, name, description, quantity, location } = data;
    const result = await pool.query(
      `INSERT INTO items (qr_code, name, description, quantity, location)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [qr_code, name, description, quantity || 1, location]
    );
    return result.rows[0];
  },

  updateQuantity: async (qr_code, delta) => {
    const result = await pool.query(
      `UPDATE items SET quantity = quantity + $1, updated_at = NOW()
       WHERE qr_code = $2 RETURNING *`,
      [delta, qr_code]
    );
    return result.rows[0];
  },

  dispose: async (qr_code, quantity) => {
    const item = await Item.getByQR(qr_code);

    if (!item) throw new Error('Item not found');
    if (item.quantity - quantity < 0) throw new Error('Not enough quantity to dispose');

    const result = await pool.query(
      `UPDATE items SET quantity = quantity - $1, status = 'disposed', updated_at = NOW()
       WHERE qr_code = $2 RETURNING *`,
      [quantity, qr_code]
    );

    return result.rows[0];
  },

  create: async (data) => {
    const { qr_code, name, description, quantity, location } = data;
    const result = await pool.query(
      `INSERT INTO items (qr_code, name, description, quantity, location)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [qr_code, name, description, quantity || 1, location] // Убедимся, что quantity не null
    );
    return result.rows[0];
  },
  
};