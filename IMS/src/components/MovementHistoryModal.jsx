import { useState, useEffect } from 'react';
import { getMovementHistory } from '../services/api'; // Импортируем новую функцию

function MovementHistoryModal({ onClose, token }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getMovementHistory(token);
        const data = await response.json();

        if (response.ok) {
          setMovements(data);
        } else {
          setError(data.error || 'Failed to fetch movement history');
        }
      } catch (err) {
        setError('Network error or server is unreachable');
        console.error('Error fetching movement history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Журнал перемещений</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}

          {loading ? (
            <p>Загрузка журнала перемещения...</p>
          ) : (
            <div className="inventory-table-container"> {/* Используем существующий стиль */}
              <table className="inventory-table"> {/* Используем существующий стиль */}
                <thead>
                  <tr>
                    <th>QR позиции</th>
                    <th>Имя позиции</th>
                    <th>Перемещено откуда</th>
                    <th>Перемещено куда</th>
                    <th>Количество</th>
                    <th>Тип перемещения</th>
                    <th>Кем перемещено</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length > 0 ? (
                    movements.map(movement => (
                      <tr key={movement.id}>
                        <td>{movement.item_qr_code}</td>
                        <td>{movement.item_name}</td>
                        <td>{movement.from_location_name || 'N/A'}</td>
                        <td>{movement.to_location_name || 'N/A'}</td>
                        <td>{movement.quantity}</td>
                        <td>{movement.action_type}</td>
                        <td>{movement.employee_username || 'N/A'}</td>
                        <td>{formatDate(movement.date)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center' }}>Не найдено записей перемещения</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

export default MovementHistoryModal;