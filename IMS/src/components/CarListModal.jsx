import { useState, useEffect } from 'react';
import EditCarModal from './EditCarModal'; // <<<--- Импортируем модуль

function CarListModal({ onClose, token }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCar, setEditingCar] = useState(null); // <<<--- Состояние для редактирования

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch('/api/items/cars', { // <<<--- Путь к машинам
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cars');
        }

        const data = await response.json();
        setCars(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [token]);

  // <<<--- Обновим список после редактирования --->
  const handleCarUpdated = (updatedCar) => {
    setCars(prev => prev.map(car => car.id === updatedCar.id ? updatedCar : car));
  };

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
      }}>
        <div className="modal-content" style={{
          width: '600px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <div className="modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h3>Автомобили в разборе</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5em',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>
          <div style={{ color: 'red' }}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div className="modal-content" style={{
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>Автомобили в разборе</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {cars.length === 0 ? (
            <p>Нет автомобилей в разборе.</p>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Марка</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Модель</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Год</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>VIN</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Дата прибытия</th> {/* <<<--- Добавили столбец --- */}
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Действия</th> {/* <<<--- Новый столбец --- */}
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{car.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{car.brand}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{car.model}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{car.year || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{car.vin}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{car.arrival_date}</td> {/* <<<--- Добавили дату --- */}
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <button
                        onClick={() => setEditingCar(car)} // <<<--- Открываем модальное окно
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {editingCar && (
        <EditCarModal
          car={editingCar}
          onClose={() => setEditingCar(null)}
          token={token}
          onCarUpdated={handleCarUpdated}
        />
      )}
    </div>
  );
}

export default CarListModal;