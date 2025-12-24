import { useState, useEffect } from 'react';
import { getAllItems } from '../services/api';

function InventoryModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('Fetching items...');
        const response = await getAllItems(token);

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response ', data);

        if (response.ok) {
          setItems(data);
        } else {
          setError(data.error || 'Failed to fetch items');
        }
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Network error or server is unreachable');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'warehouse':
        return { backgroundColor: '#d5f5e3', color: '#27ae60' };
      case 'production':
        return { backgroundColor: '#fdeaa7', color: '#f39c12' };
      case 'disposed':
        return { backgroundColor: '#fadbd8', color: '#c0392b' };
      default:
        return { backgroundColor: '#ecf0f1', color: '#7f8c8d' };
    }
  };

return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Журнал склада</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}

          {loading ? (
            <p>Загрузка журнала...</p>
          ) : (
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>QR код</th>
                    <th>Имя</th>
                    <th>Описание</th>
                    <th>Количество</th>
                    <th>Статус</th>
                    <th>Местоположение</th> 
                    <th>Создано</th>
                    <th>Дата создания</th>
                    <th>Дата обновления</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.qr_code}</td>
                        <td>{item.name}</td>
                        <td>{item.description || 'N/A'}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <span className="status-badge" style={getStatusStyle(item.status)}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.location_name || 'N/A'}</td>
                        {/* Отображаем имя создателя */}
                        <td>{item.created_by_username || 'N/A'}</td>
                        <td>{formatDate(item.created_at)}</td>
                        <td>{formatDate(item.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center' }}>Нет позиций</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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