// IMS Backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // 1. Если заголовка нет вообще
  if (!authHeader) {
    return res.status(401).json({ error: 'Доступ запрещен: токен не предоставлен' });
  }

  // 2. Разбиваем заголовок. Должно быть ровно 2 части: ["Bearer", "сам_токен"]
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.warn('⚠️ Неверный формат заголовка Authorization:', authHeader);
    return res.status(401).json({ error: 'Неверный формат токена' });
  }

  const token = parts[1];

  // 3. Проверяем, что токен не пустой, не "undefined" и не "null"
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    console.warn('⚠️ Пустой или недействительный токен при запросе');
    return res.status(401).json({ error: 'Доступ запрещен: токен пуст или недействителен' });
  }

  // 4. Пытаемся проверить токен
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysupersecrehjsdjhktkeyforjsonwebtoken12345!@#');
    req.user = decoded;
    next();
  } catch (error) {
    // Тихо обрабатываем ошибки, чтобы не спамить консоль "jwt malformed" при сбросе
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Срок действия токена истек' });
    }
    
    console.warn('⚠️ Отклонен недействительный токен:', error.message);
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

export default authenticateToken;