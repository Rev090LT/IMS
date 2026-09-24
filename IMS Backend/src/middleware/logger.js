// IMS/server/middleware/logger.js
import pool from '../db.js';

// Middleware для логирования действий пользователей
export const logUserAction = async (req, res, next) => {
  // Сохраняем оригинальный res.json
  const originalJson = res.json;
  
  // Перехватываем ответ
  res.json = function(data) {
    // Логирование после успешного ответа
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logAction(req, data);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

// Функция записи лога
const logAction = async (req, responseData) => {
  try {
    // Пропускаем логирование для некоторых эндпоинтов
    const skipPaths = ['/api/auth/login', '/api/auth/refresh', '/api/lookup/'];
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return;
    }

    const user = req.user; // Из JWT middleware
    const action = mapActionToRoute(req.method, req.path);
    
    if (!action) return; // Не логируем неважные запросы

    const query = `
      INSERT INTO user_activity_logs 
      (user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await pool.query(query, [
      user?.id || null,
      user?.username || 'anonymous',
      action,
      extractEntityType(req.path),
      extractEntityId(req.path, responseData),
      req.body ? JSON.stringify(req.body) : null,
      responseData ? JSON.stringify(responseData) : null,
      req.ip,
      req.get('user-agent'),
    ]);
  } catch (error) {
    console.error('Error logging user action:', error);
    // Не прерываем запрос из-за ошибки логирования
  }
};

// Маппинг методов и путей к действиям
const mapActionToRoute = (method, path) => {
  const actions = {
    'POST /api/items': 'CREATE_ITEM',
    'PUT /api/items/:id': 'UPDATE_ITEM',
    'DELETE /api/items/:id': 'DELETE_ITEM',
    'POST /api/sales': 'CREATE_SALE',
    'POST /api/movements': 'CREATE_MOVEMENT',
    'POST /api/auth/login': 'USER_LOGIN',
    'POST /api/auth/logout': 'USER_LOGOUT',
    'POST /api/users': 'CREATE_USER',
    'PUT /api/users/:id': 'UPDATE_USER',
    'DELETE /api/users/:id': 'DELETE_USER',
  };

  // Упрощённая логика
  if (path.includes('/items') && method === 'POST') return 'CREATE_ITEM';
  if (path.includes('/items') && method === 'PUT') return 'UPDATE_ITEM';
  if (path.includes('/items') && method === 'DELETE') return 'DELETE_ITEM';
  if (path.includes('/sales') && method === 'POST') return 'CREATE_SALE';
  if (path.includes('/movements') && method === 'POST') return 'CREATE_MOVEMENT';
  if (path.includes('/auth/login') && method === 'POST') return 'USER_LOGIN';
  if (path.includes('/users') && method === 'POST') return 'CREATE_USER';
  
  return null;
};

const extractEntityType = (path) => {
  if (path.includes('/items')) return 'item';
  if (path.includes('/sales')) return 'sale';
  if (path.includes('/users')) return 'user';
  if (path.includes('/movements')) return 'movement';
  return null;
};

const extractEntityId = (path, responseData) => {
  const match = path.match(/\/(\d+)$/);
  if (match) return match[1];
  if (responseData?.id) return responseData.id;
  return null;
};

export default logUserAction;