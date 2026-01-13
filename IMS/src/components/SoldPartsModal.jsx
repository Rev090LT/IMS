import { useState, useEffect } from 'react';

function SoldPartsModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        // <<<--- Фильтруем только проданные запчасти --->
        const soldItems = data.filter(item => item.status === 'sold');
        setItems(soldItems);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [token]);

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
            <h3>Проданные запчасти</h3>
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
          <h3>Проданные запчасти</h3>
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
          {items.length === 0 ? (
            <p>Нет проданных запчастей.</p>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>QR-код</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Наименование</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Part Number</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Модель машины</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>VIN номер</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Цена</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Дата продажи</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.qr_code}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.part_number || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.car_model || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.vin_number || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.selling_price || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.sale_date || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SoldPartsModal;