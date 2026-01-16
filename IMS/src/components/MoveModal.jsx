import { useState, useEffect } from 'react';
import { moveItem, getAllLocations, getItemByName } from '../services/api';

function MoveModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
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
        setError('Network error or server is unreachable');
        console.error('Error fetching locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [token]);

  // <<<--- Функция для поиска по имени --->
  const handleItemNameChange = async (e) => {
    const name = e.target.value;
    setItemName(name);

    if (name.trim() !== '') {
      try {
        const response = await getItemByName(name, token); // <<<--- Вот тут передаём token
        const data = await response.json();

        if (response.ok) {
          setSearchResults(data); // <<<--- Сохраняем результаты
          setShowDropdown(true); // <<<--- Показываем выпадающий список
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
    setSearchResults([]); // <<<--- Очищаем результаты
    setShowDropdown(false); // <<<--- Скрываем список
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedFromId = parseInt(fromLocationId);
    const parsedToId = parseInt(toLocationId);
    const parsedQuantity = parseInt(quantity);

    if (!qrCode || isNaN(parsedFromId) || isNaN(parsedToId) || parsedQuantity <= 0) {
      setError('QR Code, From Location, To Location, and Quantity are required');
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
            <form onSubmit={handleSubmit} className="modal-form">
              <div style={{ position: 'relative' }}>
                <label>Наименование:</label>
                <input
                  type="text"
                  value={itemName || ''} // <<<--- Вот тут исправили
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
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label>QR код:</label>
                <input
                  type="text"
                  value={qrCode || ''} // <<<--- Вот тут исправили
                  onChange={(e) => setQrCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Переместить из:</label>
                <select
                  value={fromLocationId || ''} // <<<--- Вот тут исправили
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
                  value={toLocationId || ''} // <<<--- Вот тут исправили
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
                <label>Количество:</label>
                <input
                  type="number"
                  value={quantity || 1} // <<<--- Вот тут исправили
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  required
                />
              </div>
            </form>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Отмена</button>
          <button type="button" onClick={handleSubmit}>Переместить</button>        </div>
      </div>
    </div>
  );
}

export default MoveModal;