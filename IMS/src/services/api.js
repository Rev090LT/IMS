const API_BASE = 'http://localhost:3000/api';

// === Аутентификация ===
export const login = (data) => {
  return fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

// === Получить информацию о товаре по QR-коду ===
export const getItemByQR = (qrCode, token) => {
  return fetch(`${API_BASE}/items/${qrCode}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

// === Сканирование (получить товар) ===
// В реальности это тот же запрос, что и getItemByQR
export const scanItem = getItemByQR;

// === Перемещение товара ===
export const moveItem = (data, token) => {
  return fetch(`${API_BASE}/items/move`, { // Убедитесь, что маршрут существует на бэкенде
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};

// === Списание товара ===
export const disposeItem = (data, token) => {
  return fetch(`${API_BASE}/items/dispose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};

// === Получить все товары (инвентарь) ===
export const getAllItems = (token) => {
  return fetch(`${API_BASE}/items`, { // Убедитесь, что маршрут существует на бэкенде
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

// === Добавить товар (опционально) ===
export const createItem = (data, token) => {
  console.log('Sending token:', token); // <= Добавьте это для отладки
  return fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }); 
};

