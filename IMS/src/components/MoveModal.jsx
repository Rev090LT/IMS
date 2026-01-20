import { useState, useEffect } from 'react';
import { moveItem, getAllLocations, getItemByName } from '../services/api';

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
        setError('Network error or server is reachable');
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [token]);

  // <<<--- Функция для получения количества товара на локации --->
  const fetchAvailableQuantity = async (qrCode, locationId) => {
    if (!qrCode || !locationId) {
      setAvailableQuantity(0);
      return;
    }

    try {
      const response = await fetch(`/api/items/${qrCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('Error fetching item details:', response.statusText);
        setAvailableQuantity(0);
        return;
      }

      const item = await response.json();
      
      // <<<--- Найдем количество товара на конкретной локации --->
      if (item.location_id == locationId) {
        setAvailableQuantity(item.quantity);
      } else {
        setAvailableQuantity(0);
      }
    } catch (err) {
      console.error('Error fetching available quantity:', err);
      setAvailableQuantity(0);
    }
  };

  // <<<--- Обновим количество при изменении qrCode или fromLocationId --->
  useEffect(() => {
    fetchAvailableQuantity(qrCode, fromLocationId);
  }, [qrCode, fromLocationId, token]);

  // <<<--- Обновим quantity при изменении availableQuantity --->
  useEffect(() => {
    setQuantity(prev => Math.min(prev, availableQuantity)); // <<<--- Вот тут ограничим quantity
  }, [availableQuantity]);

  // <<<--- Функция для поиска по имени --->
  const handleItemNameChange = async (e) => {
    const name = e.target.value;
    setItemName(name);

    if (name.trim() !== '') {
      try {
        const response = await getItemByName(name, token);
        const data = await response.json();

        if (response.ok) {
          // <<<--- Добавим информацию о локации в результаты поиска --->
          const itemsWithLocation = await Promise.all(data.map(async (item) => {
            const detailsResponse = await fetch(`/api/items/${item.qr_code}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              const location = locations.find(loc => loc.id === details.location_id);
              return { ...item, current_location_id: details.location_id, current_location_name: location?.name };
            }
            return { ...item, current_location_id: null, current_location_name: null };
          }));

          setSearchResults(itemsWithLocation);
          setShowDropdown(true);
          setError('');
        } else {
          setError(data.error || 'Не удалось получить товар');
          setSearchResults([]);
          setShowDropdown(false);
        }
      } catch (err) {
        setError('Network error or server is unreachable');
        setSearchResults([]);
        setShowDropdown(false);
        console.error('Error fetching item by name:', err);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // <<<--- Функция для выбора товара из списка --->
  const handleSelectItem = (item) => {
    setQrCode(item.qr_code); // <<<--- Подставляем QR-код
    setItemName(item.name); // <<<--- Подставляем имя
    setFromLocationId(item.current_location_id || ''); // <<<--- Подставляем локацию
    setSearchResults([]); // <<<--- Очищаем результаты
    setShowDropdown(false); // <<<--- Скрываем список
    setAvailableQuantity(0); // <<<--- Сбросим доступное количество
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const parsedFromId = parseInt(fromLocationId);
    const parsedToId = parseInt(toLocationId);
    const parsedQuantity = parseInt(quantity);

    // <<<--- Проверим, что parsedQuantity > 0 и не больше доступного количества --->
    if (!qrCode || isNaN(parsedFromId) || isNaN(parsedToId) || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('QR Code, From Location, To Location, and Quantity are required');
      return;
    }

    if (parsedQuantity > availableQuantity) {
      setError(`Количество превышает доступное. Доступно: ${availableQuantity}`);
      return;
    }

    if (parsedFromId === parsedToId) {
      setError('From and To locations cannot be the same');
      return;
    }

    try {
      const response = await moveItem({
        qr_code: qrCode,
        from_location_id: parsedFromId,
        to_location_id: parsedToId,
        quantity: parsedQuantity
      }, token);

      const data = await response.json();

      if (response.ok) {
        setSuccess('Товар перемещен успешно');
        // Очищаем форму
        setQrCode('');
        setItemName('');
        setFromLocationId('');
        setToLocationId('');
        setQuantity(1);
        setAvailableQuantity(0);
        setSearchResults([]);
        setShowDropdown(false);
      } else {
        setError(data.error || 'Failed to move item');
      }
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error('Error during move item:', err);
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
            <form className="modal-form">
              <div style={{ position: 'relative' }}>
                <label>Наименование:</label>
                <input
                  type="text"
                  value={itemName || ''}
                  onChange={handleItemNameChange}
                  placeholder="Введите наименование для подстановки QR-кода"
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}>
                    {searchResults.map((item, index) => (
                      <li
                        key={item.id || index}
                        onClick={() => handleSelectItem(item)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          QR: {item.qr_code}, Склад: {item.current_location_name || 'Неизвестно'}
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
                  required
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
                  <option value="">Выбрать склад</option>
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
                  onChange={(e) => setQuantity(Math.min(Number(e.target.value), availableQuantity))}
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
          <button type="button" onClick={handleSubmit}>Переместить</button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;