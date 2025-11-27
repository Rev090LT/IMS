import { useState, useEffect } from 'react';
// import { getAllItems } from '../../services/api'; // Заглушка

function InventoryModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // const response = await getAllItems(token);
        // const data = await response.json();
        // if (response.ok) {
        //   setItems(data);
        // } else {
        //   setError(data.error || 'Failed to fetch items');
        // }

        // Временная заглушка
        setItems([
          { id: 1, qr_code: 'ABC123', name: 'Laptop', quantity: 5, status: 'warehouse', location: 'A1-05' },
          { id: 2, qr_code: 'DEF456', name: 'Mouse', quantity: 10, status: 'production', location: 'B2-03' },
        ]);
      } catch (err) {
        setError('Network error or server is unreachable');
        console.error(err);
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