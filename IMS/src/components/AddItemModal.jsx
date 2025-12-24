import { useState, useEffect } from 'react';
import { createItem, getAllLocations } from '../services/api';
import AddLocationModal from './AddLocationModal'; // Импортируем, если будем вставлять внутрь

function AddItemModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [locationId, setLocationId] = useState(''); // Теперь ID локации
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false); // Для обновления списка
  const [showAddLocationModal, setShowAddLocationModal] = useState(false); // Для открытия всплывающего окна


  const generateRandomQRCode = () => {
    // Генерируем 5 случайных цифр
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += Math.floor(Math.random() * 10); // 0-9
    }
    const newQRCode = `200000${randomPart}`;
    setQrCode(newQRCode);
  };

  // Загружаем локации при монтировании
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await getAllLocations(token);
        const data = await response.json();
        if (response.ok) {
          setLocations(data);
        } else {
          setError(data.error || 'Failed to fetch locations');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('FormData:', { qrCode, name, description, quantity, locationId }); // <= Добавьте этот лог
    console.log('locationId type:', typeof locationId, 'value:', locationId); // <= И этот
    setError('');
    setSuccess('');

    if (!qrCode || !name || !quantity || quantity <= 0 || !locationId) {
      setError('QR Code, Name, Quantity, and Location are required');
      return;
    }

    try {
      const response = await createItem({
        qr_code: qrCode,
        name,
        description,
        quantity: parseInt(quantity),
        location_id: parseInt(locationId) // Отправляем ID локации
      }, token);

      const data = await response.json();

      if (response.ok) {
        setSuccess('Позиция добавлена');
        // Очищаем форму
        setQrCode('');
        setName('');
        setDescription('');
        setQuantity(1);
        setLocationId(''); // Очищаем выбор локации
      } else {
        setError(data.error || 'Ошибка добавления позиции');
      }
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error('Error during add item:', err);
    }
  };

  // Функция для обновления списка локаций (вызывается из AddLocationModal)
  const handleLocationAdded = (newLocation) => {
    setLocations(prev => [...prev, newLocation]); // Добавляем новую локацию в список
    setLocationId(newLocation.id.toString()); // Автоматически выбираем новую локацию
    setShowAddLocationModal(false); // Закрываем модальное окно добавления локации
  };

  // Функция для открытия модального окна добавления локации
  const handleAddLocationClick = () => {
    setShowAddLocationModal(true);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Добавить позицию</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label>QR Код:</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  required
                  placeholder="Введите или сгенерируйте QR код"
                  style={{ flex: 1 }}
                />
                <button
                  type="button" // ВАЖНО: type="button", а не type="submit"
                  onClick={generateRandomQRCode}
                  className="generate-qr-btn" // Можно добавить стиль
                >
                  Сгенерировать QR
                </button>
              </div>
            </div>

            <div>
              <label>Наименование:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Описание:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label>Количество:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                required
              />
            </div>

            <div>
              <label>Местоположение позиции:</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
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
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Закрыть</button>
          <button type="button" onClick={handleSubmit}>
            {loading ? 'Adding...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddItemModal;