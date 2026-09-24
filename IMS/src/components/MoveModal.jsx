import { useState, useEffect } from 'react';
import { getAllLocations, getItemByName } from '../services/api';

// Убедись, что moveItem отправляет именно такой объект, как в handleSubmit ниже
const moveItem = async (data, token) => {
  return fetch('/api/movements', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
};

function MoveModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getAllLocations(token);
        const data = await response.json();
        if (response.ok) {
          setLocations(data);
        } else {
          setError(data.error || 'Ошибка загрузки складов');
        }
      } catch (err) {
        setError('Ошибка сети при загрузке складов');
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, [token]);

  // Получение количества товара на конкретной локации
  const fetchAvailableQuantity = async (qr, locationId) => {
    if (!qr || !locationId) {
      setAvailableQuantity(0);
      return;
    }

    try {
      // Предполагаем, что этот эндпоинт возвращает данные товара, включая quantity и location_id
      const response = await fetch(`/api/items/${qr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const item = await response.json();
        if (item.location_id == locationId) {
          setAvailableQuantity(item.quantity || 0);
        } else {
          setAvailableQuantity(0);
        }
      } else {
        setAvailableQuantity(0);
      }
    } catch (err) {
      console.error('Error fetching available quantity:', err);
      setAvailableQuantity(0);
    }
  };

  useEffect(() => {
    fetchAvailableQuantity(qrCode, fromLocationId);
  }, [qrCode, fromLocationId, token]);

  useEffect(() => {
    setQuantity(prev => {
      const newVal = Math.max(1, Math.min(prev, availableQuantity));
      return availableQuantity > 0 ? newVal : 1;
    });
  }, [availableQuantity]);

  const handleItemNameChange = async (e) => {
    const name = e.target.value;
    setItemName(name);

    if (name.trim() !== '') {
      try {
        const response = await getItemByName(name, token);
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          const itemsWithLocation = await Promise.all(data.map(async (item) => {
            try {
              const detailsResponse = await fetch(`/api/items/${item.qr_code}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (detailsResponse.ok) {
                const details = await detailsResponse.json();
                const location = locations.find(loc => loc.id === details.location_id);
                return { ...item, current_location_id: details.location_id, current_location_name: location?.name };
              }
            } catch (err) {
              console.warn(`Не удалось получить детали для ${item.qr_code}`);
            }
            return { ...item, current_location_id: null, current_location_name: 'Неизвестно' };
          }));

          setSearchResults(itemsWithLocation);
          setShowDropdown(true);
          setError('');
        } else {
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (err) {
        console.error('Error fetching item by name:', err);
        setSearchResults([]);
        setShowDropdown(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectItem = (item) => {
    setQrCode(item.qr_code);
    setItemName(item.name);
    setFromLocationId(item.current_location_id || '');
    setSearchResults([]);
    setShowDropdown(false);
    setAvailableQuantity(0); // Сбросим, чтобы useEffect пересчитал заново
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const parsedFromId = parseInt(fromLocationId);
    const parsedToId = parseInt(toLocationId);
    const parsedQuantity = parseInt(quantity);

    if (!qrCode || qrCode.trim() === '') {
      setError('❌ QR-код не указан');
      return;
    }
    if (isNaN(parsedFromId) || parsedFromId <= 0) {
      setError('❌ Выберите склад отправления');
      return;
    }
    if (isNaN(parsedToId) || parsedToId <= 0) {
      setError('❌ Выберите склад назначения');
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('❌ Укажите корректное количество');
      return;
    }
    if (parsedQuantity > availableQuantity) {
      setError(`⚠️ Количество (${parsedQuantity}) превышает доступное (${availableQuantity})`);
      return;
    }
    if (parsedFromId === parsedToId) {
      setError('❌ Склад отправления и назначения не могут совпадать');
      return;
    }

    try {
      const response = await moveItem({
        qr_code: qrCode,
        from_location_id: parsedFromId,
        to_location_id: parsedToId,
        quantity: parsedQuantity,
        notes: `Перемещение из ${fromLocationId} в ${toLocationId}`
      }, token);

      const data = await response.json();

      if (response.ok) {
        setSuccess('✅ Товар успешно перемещён!');
        setTimeout(() => {
          onClose(); // Закрываем модалку через 1.5 секунды после успеха
        }, 1500);
      } else {
        setError(`❌ Ошибка: ${data.error || 'Неизвестная ошибка сервера'}`);
      }
    } catch (err) {
      console.error('💥 Ошибка сети:', err);
      setError(`Ошибка сети: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Переместить позицию</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          {loading ? (
            <p>Загрузка складов...</p>
          ) : (
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div style={{ position: 'relative' }}>
                <label>Наименование:</label>
                <input
                  type="text"
                  value={itemName || ''}
                  onChange={handleItemNameChange}
                  placeholder="Введите наименование для поиска"
                  autoComplete="off"
                />
                
                {showDropdown && searchResults.length > 0 && (
                  <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    margin: '5px 0 0 0',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}>
                    {searchResults.map((item, index) => (
                      <li
                        key={item.id || index}
                        onClick={() => handleSelectItem(item)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          QR: {item.qr_code} • Склад: {item.current_location_name || 'Неизвестно'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label>QR код:</label>
                <input
                  type="text"
                  value={qrCode || ''}
                  onChange={(e) => setQrCode(e.target.value)}
                  readOnly // Делаем read-only, так как он подставляется из поиска, но можно убрать, если нужен ручной ввод
                  style={{ backgroundColor: '#f9f9f9' }}
                />
              </div>

              <div>
                <label>Переместить из:</label>
                <select
                  value={fromLocationId || ''}
                  onChange={(e) => setFromLocationId(e.target.value)}
                  required
                >
                  <option value="">Выберите склад</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Переместить в:</label>
                <select
                  value={toLocationId || ''}
                  onChange={(e) => setToLocationId(e.target.value)}
                  required
                >
                  <option value="">Выберите склад</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Количество (доступно: {availableQuantity}):</label>
                <input
                  type="number"
                  value={quantity || 1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      setQuantity(Math.min(val, availableQuantity));
                    }
                  }}
                  min="1"
                  max={availableQuantity}
                  required
                />
              </div>
            </form>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Отмена</button>
          <button type="button" onClick={handleSubmit} style={{ backgroundColor: '#27ae60', color: 'white' }}>Переместить</button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;