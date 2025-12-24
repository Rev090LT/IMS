import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findByUsername(username);

  if (user && await bcrypt.compare(password, user.password_hash)) {
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }
});

export default router;