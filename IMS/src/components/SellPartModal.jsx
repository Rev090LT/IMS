import { useState, useEffect } from 'react';
import PrintReceiptModal from './PrintReceiptModal';

function SellPartModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('Fetching items with token:', token);
        const response = await fetch('/api/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        console.log('Fetched items:', data);
        console.log('All statuses:', data.map(item => item.status));
        // <<<--- Фильтруем только доступные запчасти (не проданные) --->
        const availableItems = data.filter(item => item.status !== 'sold');
        console.log('Available items:', availableItems);
        setItems(availableItems);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [token]);

  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    console.log('Selected item ID:', itemId);
    if (itemId) {
      const item = items.find(i => i.id === parseInt(itemId));
      console.log('Found item:', item);
      setSelectedItem(item);
    } else {
      setSelectedItem(null);
    }
  };

const handleSell = async () => {
  if (!selectedItem) {
    setError('Выберите запчасть');
    return;
  }

  if (!price || parseFloat(price) <= 0) {
    setError('Введите корректную цену');
    return;
  }

  // <<<--- Проверим, есть ли location_id --->
  if (!selectedItem.location_id) {
    setError('У запчасти нет location_id');
    return;
  }

  console.log('Sending to PUT /api/items/:id:', {
    name: selectedItem.name,
    description: selectedItem.description,
    quantity: selectedItem.quantity - 1,
    status: 'sold',
    location_id: selectedItem.location_id,
    category_id: selectedItem.category_id,
    manufacturer_id: selectedItem.manufacturer_id,
    part_number: selectedItem.part_number,
    car_model: selectedItem.car_model,
    vin_number: selectedItem.vin_number
  });

  try {
    // <<<--- Обновим статус запчасти на "sold" --->
    const updateResponse = await fetch(`/api/items/${selectedItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: selectedItem.name,
        description: selectedItem.description,
        quantity: selectedItem.quantity - 1,
        status: 'sold',
        location_id: selectedItem.location_id,
        category_id: selectedItem.category_id,
        manufacturer_id: selectedItem.manufacturer_id,
        part_number: selectedItem.part_number,
        car_model: selectedItem.car_model,
        vin_number: selectedItem.vin_number
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error || 'Failed to update item');
    }

    // ...
  } catch (err) {
    setError(err.message);
  }
};
  if (loading) return <div>Loading...</div>;

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
          <h3>Продажа запчасти</h3>
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

        {error && (
          <div style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            border: '1px solid red',
            borderRadius: '4px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label>Выберите запчасть:</label>
          <select
            value={selectedItem ? selectedItem.id : ''}
            onChange={handleItemSelect}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="">Выберите запчасть</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} (Кол-во: {item.quantity}, VIN: {item.vin_number})
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h4>Информация о запчасти:</h4>
            <p><strong>QR-код:</strong> {selectedItem.qr_code}</p>
            <p><strong>Наименование:</strong> {selectedItem.name}</p>
            <p><strong>Описание:</strong> {selectedItem.description}</p>
            <p><strong>Part Number:</strong> {selectedItem.part_number}</p>
            <p><strong>Модель машины:</strong> {selectedItem.car_model}</p>
            <p><strong>VIN:</strong> {selectedItem.vin_number}</p>
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label>Цена (руб):</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            placeholder="Введите цену"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSell}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Продать
          </button>
        </div>
      </div>

      {showReceiptModal && receiptData && (
        <PrintReceiptModal
          receipt={receiptData}
          onClose={() => setShowReceiptModal(false)}
          token={token}
        />
      )}
    </div>
  );
}

export default SellPartModal;