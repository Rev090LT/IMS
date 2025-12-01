import pool from '../config/db.js';

export const Item = {
  getByQR: async (qr_code) => {
    const query = `
      SELECT 
        i.*,
        l.name AS location_name  -- <-- Подтягиваем имя локации
      FROM items i
      LEFT JOIN locations l ON i.location_id = l.id -- <-- JOIN по location_id
      WHERE i.qr_code = $1
    `;
    const result = await pool.query(query, [qr_code]);
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

  updateLocation: async (qr_code, new_location_id) => {
    const result = await pool.query(
      `UPDATE items SET location_id = $1, updated_at = NOW()
       WHERE qr_code = $2 RETURNING *`,
      [new_location_id, qr_code]
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

  create: async (data, username) => { // Добавим userId как параметр
    const { qr_code, name, description, quantity, location_id } = data;
    const result = await pool.query(
      `INSERT INTO items (qr_code, name, description, quantity, location_id, created_by_username)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [qr_code, name, description, quantity || 1, location_id, username] // Передаём userId
    );
    return result.rows[0];
  },
};