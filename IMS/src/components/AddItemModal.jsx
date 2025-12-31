import React, { useState, useEffect } from 'react';

function AddItemModal({ onClose, token, onItemAdded }) {
  const [qrCode, setQrCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('active');
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [newManufacturerName, setNewManufacturerName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, mansRes, locsRes] = await Promise.all([
          fetch('/api/lookup/categories', {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }),
          fetch('/api/lookup/manufacturers', {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }),
          fetch('/api/locations', {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }),
        ]);

        const [catsData, mansData, locsData] = await Promise.all([
          catsRes.json(),
          mansRes.json(),
          locsRes.json(),
        ]);

        if (!catsRes.ok || !mansRes.ok || !locsRes.ok) {
          throw new Error('Failed to load data');
        }

        setCategories(catsData);
        setManufacturers(mansData);
        setLocations(locsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const generateQRCode = () => {
    const randomFiveDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const newQRCode = `2000000${randomFiveDigits}`;
    setQrCode(newQRCode);
  };

  const handleAddManufacturer = async () => {
    if (!newManufacturerName.trim()) {
      setError('Введите название производителя');
      return;
    }

    try {
      const response = await fetch('/api/lookup/manufacturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newManufacturerName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error adding manufacturer');
      }

      setManufacturers(prev => [...prev, data]);
      setManufacturerId(data.id);
      setNewManufacturerName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Введите название класса');
      return;
    }

    try {
      const response = await fetch('/api/lookup/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error adding category');
      }

      setCategories(prev => [...prev, data]);
      setCategoryId(data.id);
      setNewCategoryName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    // e.preventDefault(); // Убрано, так как форма убрана
    setError('');
    setSuccess('');

    if (!qrCode.trim() || !name.trim() || !locationId) {
      setError('QR Code, Name and Location are required');
      return;
    }

    const quantityNum = parseInt(quantity);
    const locationIdNum = parseInt(locationId);
    const categoryIdNum = categoryId ? parseInt(categoryId) : null;
    const manufacturerIdNum = manufacturerId ? parseInt(manufacturerId) : null;

    if (isNaN(quantityNum) || isNaN(locationIdNum) || (categoryId && isNaN(categoryIdNum)) || (manufacturerId && isNaN(manufacturerIdNum))) {
      setError('Invalid data');
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          qr_code: qrCode.trim(),
          name: name.trim(),
          description: description.trim(),
          quantity: quantityNum,
          status,
          location_id: locationIdNum,
          category_id: categoryIdNum,
          manufacturer_id: manufacturerIdNum,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error adding item');
      }

      setSuccess('Item added successfully');
      if (onItemAdded) onItemAdded(data);

      setQrCode('');
      setName('');
      setDescription('');
      setQuantity(1);
      setLocationId('');
      setCategoryId('');
      setManufacturerId('');
      setNewManufacturerName('');
      setNewCategoryName('');
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
          <h3>Добавить позицию</h3>
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

        <div> {/* <<<--- Вот тут убрана обёртка form */}
          <div style={{ marginBottom: '15px' }}>
            <label>QR-код:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                required
                placeholder="Введите или сгенерируйте QR-код"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <button
                type="button"
                onClick={generateQRCode}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Сгенерировать
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Название:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Описание:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Количество:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>


          <div style={{ marginBottom: '15px' }}>
            <label>Локация:</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <option value="">Выберите локацию</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Категория запчасти:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">Выберите класс</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCategory}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                + Добавить
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Производитель:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={manufacturerId}
                onChange={(e) => setManufacturerId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">Выберите производителя</option>
                {manufacturers.map(man => (
                  <option key={man.id} value={man.id}>{man.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddManufacturer}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                + Добавить
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Новый производитель:</label>
            <input
              type="text"
              value={newManufacturerName}
              onChange={(e) => setNewManufacturerName(e.target.value)}
              placeholder="Введите название нового производителя"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Новая категория запчасти:</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Введите название нового класса"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
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
              type="button" // <<<--- Вот тут
              onClick={handleSubmit} // <<<--- Вот тут
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddItemModal;