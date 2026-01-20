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
// services/api.js

export const moveItem = async ({ qr_code, from_location_id, to_location_id, quantity }, token) => {
  try {
    const response = await fetch('/api/items/move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        qr_code,
        from_location_id,
        to_location_id,
        quantity,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error moving item:', error);
    throw error;
  }
};
export const getItemByName = async (name, token) => {
  try {
    const response = await fetch(`${API_BASE}/items/name?name=${encodeURIComponent(name)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error fetching item by name:', error);
    throw error;
  }
};
// === Списание товара ===
export const disposeItem = (data, token) => {
  return fetch(`${API_BASE}/items/dispose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data), // data = { qr_code: "...", quantity: 1 }
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
  console.log('Sending create item request with ', data, 'and token:', token); // Добавьте логconsole.log('Sending create item request with ', data, 'and token:', token); // Добавьте лог
  return fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }); 
};

// === Получить все локации ===
export const getAllLocations = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/locations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

export const createLocation = (data, token) => {
  console.log('Sending create location request with ', data, 'and token:', token);
  return fetch(`${API_BASE}/locations`, { // Убедитесь, что маршрут совпадает с бэкендом
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
};

export const getMovementHistory = (token) => {
  return fetch(`${API_BASE}/movements`, { // Убедитесь, что маршрут существует на бэкенде
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};