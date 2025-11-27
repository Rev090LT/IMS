import pool from '../src/config/db.js';

export const Movement = {
  create: async (data) => {
    const { item_id, from_location, to_location, employee_id, action_type, quantity, comment } = data;
    const result = await pool.query(
      `INSERT INTO movements (item_id, from_location, to_location, employee_id, action_type, quantity, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [item_id, from_location, to_location, employee_id, action_type, quantity, comment]
    );
    return result.rows[0];
  },
};