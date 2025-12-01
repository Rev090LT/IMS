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
        setSuccess('Item added successfully!');
        // Очищаем форму
        setQrCode('');
        setName('');
        setDescription('');
        setQuantity(1);
        setLocationId(''); // Очищаем выбор локации
      } else {
        setError(data.error || 'Failed to add item');
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
          <h3 className="modal-title">Add New Item</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label>QR Code:</label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label>Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                required
              />
            </div>

            <div>
              <label>Location:</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  style={{ flex: 1 }}
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddLocationClick}
                  className="add-location-btn" // Можно стилизовать отдельно
                >
                  +
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Cancel</button>
          <button type="button" onClick={handleSubmit}>Add Item</button>
        </div>
      </div>

      {/* Всплывающее модальное окно для добавления локации */}
      {showAddLocationModal && (
        <AddLocationModal
          onClose={() => setShowAddLocationModal(false)}
          token={token}
          onLocationAdded={handleLocationAdded} // Передаём функцию для обновления списка
        />
      )}
    </div>
  );
}

export default AddItemModal;