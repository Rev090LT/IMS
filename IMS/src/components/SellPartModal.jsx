import { useState, useEffect } from 'react';
import PrintReceiptModal from './PrintReceiptModal';

function SellPartModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [price, setPrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerInfo, setBuyerInfo] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

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
        const availableItems = data.filter(item => item.status === 'available' || item.status === 'warehouse');
        setItems(availableItems);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [token]);

  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    if (itemId) {
      const item = items.find(i => i.id === parseInt(itemId));
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

    try {
      const response = await fetch('/api/items/sell-part', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          selling_price: parseFloat(price),
          buyer_name: buyerName,
          buyer_info: buyerInfo,
          buyer_phone: buyerPhone
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sell item');
      }

      setSuccess('Запчасть успешно продана!');

      // <<<--- Подготовим данные для чека --->
      const receipt = {
        item: selectedItem,
        selling_price: parseFloat(price),
        sale_date: saleDate,
        buyer_name: buyerName,
        buyer_info: buyerInfo,
        buyer_phone: buyerPhone
      };

      setReceiptData(receipt);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrintReceipt = () => {
    if (receiptData) {
      setShowReceiptModal(true);
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
        width: '800px',
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

        {success && (
          <div style={{
            color: 'green',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#e6ffe6',
            border: '1px solid green',
            borderRadius: '4px',
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
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

            <div style={{ marginBottom: '15px' }}>
              <label>Дата продажи:</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '15px' }}>
              <label>ФИО контрагента:</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Введите ФИО контрагента"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Телефон контрагента:</label>
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="Введите телефон контрагента"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Информация о контрагенте:</label>
              <textarea
                value={buyerInfo}
                onChange={(e) => setBuyerInfo(e.target.value)}
                placeholder="Введите информацию о контрагенте"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
          {receiptData && (
            <button
              onClick={handlePrintReceipt}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Печать чека
            </button>
          )}
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