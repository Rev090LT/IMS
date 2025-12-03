import { useState, useEffect } from 'react';
import { moveItem, getAllLocations } from '../services/api'; // Импортируем функцию получения локаций

function MoveModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true); // Для загрузки локаций

  // Загружаем локации при монтировании
  useEffect(() => {
    const fetchLocations = async () => {
      try {
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
    setError('');
    setSuccess('');

    if (!qrCode || !fromLocationId || !toLocationId || quantity <= 0) {
      setError('QR Code, From Location, To Location, and Quantity are required');
      return;
    }

    if (fromLocationId === toLocationId) {
      setError('From and To locations cannot be the same');
      return;
    }

    try {
      const response = await moveItem({
        qr_code: qrCode,
        from_location_id: parseInt(fromLocationId),
        to_location_id: parseInt(toLocationId),
        quantity
      }, token);

      const data = await response.json();

      if (response.ok) {
        setSuccess('Item moved successfully!');
        // Очищаем форму
        setQrCode('');
        setFromLocationId('');
        setToLocationId('');
        setQuantity(1);
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
          <h3 className="modal-title">Move Item</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          {loading ? (
            <p>Loading locations...</p>
          ) : (
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
                <label>From Location:</label>
                <select
                  value={fromLocationId}
                  onChange={(e) => setFromLocationId(e.target.value)}
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>To Location:</label>
                <select
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
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
            </form>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Cancel</button>
          <button type="button" onClick={handleSubmit}>Move item</button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;