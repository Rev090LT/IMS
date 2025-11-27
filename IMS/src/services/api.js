const API_BASE = 'http://localhost:3000/api';

export const login = (data) => {
  return fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

// Примеры новых функций
export const scanItem = (qrCode, token) => {
  return fetch(`${API_BASE}/items/${qrCode}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const moveItem = (data, token) => {
  return fetch(`${API_BASE}/items/move`, { // Предполагаем, что маршрут будет таким
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};

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

export const getAllItems = (token) => {
  return fetch(`${API_BASE}/items`, { // Предполагаем, что маршрут будет таким
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};