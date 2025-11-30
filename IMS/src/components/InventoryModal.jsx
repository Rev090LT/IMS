import { useState, useEffect } from 'react';
import { getAllItems } from '../services/api'; // Заглушка

function InventoryModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
const fetchItems = async () => {
      try {
        console.log('Fetching items...'); // Лог для отладки
        const response = await getAllItems(token);

        console.log('Response status:', response.status); // Лог статуса
        const data = await response.json();
        console.log('Response data:', data); // Лог данных

        if (response.ok) {
          setItems(data);
        } else {
          setError(data.error || 'Failed to fetch items');
        }
      } catch (err) {
        console.error('Error fetching items:', err); // Лог ошибки
        setError('Network error or server is unreachable');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [token]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Inventory List</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>QR Code</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.qr_code}</td>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.status}</td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel">Close</button>
        </div>
      </div>
    </div>
  );
}

export default InventoryModal;