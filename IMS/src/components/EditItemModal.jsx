import { useState, useEffect } from 'react';

function EditItemModal({ item, onClose, token, onItemUpdated }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [quantity, setQuantity] = useState(item.quantity);
  const [status, setStatus] = useState(item.status);
  const [locationId, setLocationId] = useState(item.location_id);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [manufacturerId, setManufacturerId] = useState(item.manufacturer_id);
  const [partNumber, setPartNumber] = useState(item.part_number);
  const [carModel, setCarModel] = useState(item.car_model);
  const [vinNumber, setVinNumber] = useState(item.vin_number);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [cars, setCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, mansRes, locsRes, carsRes] = await Promise.all([
          fetch('/api/lookup/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/lookup/manufacturers', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/locations', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/items/cars', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [catsData, mansData, locsData, carsData] = await Promise.all([
          catsRes.json(),
          mansRes.json(),
          locsRes.json(),
          carsRes.json()
        ]);

        if (!catsRes.ok || !mansRes.ok || !locsRes.ok || !carsRes.ok) {
          throw new Error('Failed to load data');
        }

        setCategories(catsData);
        setManufacturers(mansData);
        setLocations(locsData);
        setCars(carsData);

        // <<<--- Найдём автомобиль по vin_number --->
        const matchedCar = carsData.find(car => car.vin === item.vin_number);
        if (matchedCar) {
          setSelectedCarId(matchedCar.id);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [token, item.vin_number]);

  // <<<--- Функция выбора автомобиля --->
  const handleCarSelect = (e) => {
    const carId = e.target.value;
    setSelectedCarId(carId);

    if (carId) {
      const car = cars.find(c => c.id === parseInt(carId));
      if (car) {
        setCarModel(car.model);
        setVinNumber(car.vin);
      }
    } else {
      setCarModel('');
      setVinNumber('');
    }
  };

  const handleAddManufacturer = async () => {
    const newManName = prompt('Введите название производителя:');
    if (!newManName) return;

    try {
      const response = await fetch('/api/lookup/manufacturers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newManName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error adding manufacturer');
      }

      setManufacturers(prev => [...prev, data]);
      setManufacturerId(data.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCategory = async () => {
    const newCatName = prompt('Введите название категории:');
    if (!newCatName) return;

    try {
      const response = await fetch('/api/lookup/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCatName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error adding category');
      }

      setCategories(prev => [...prev, data]);
      setCategoryId(data.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          quantity: parseInt(quantity),
          status,
          location_id: parseInt(locationId),
          category_id: categoryId ? parseInt(categoryId) : null,
          manufacturer_id: manufacturerId ? parseInt(manufacturerId) : null,
          part_number: partNumber,
          car_model: carModel,
          vin_number: vinNumber
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update item');
      }

      alert('Позиция успешно обновлена!');
      onItemUpdated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
        setLoading(false);
      }
  };

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
          <h3>Редактировать позицию</h3>
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label>QR-код:</label>
            <input
              type="text"
              value={item.qr_code}
              readOnly
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
              }}
            />
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
            <label>Статус:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <option value="available">Доступно</option>
              <option value="reserved">Зарезервировано</option>
              <option value="sold">Продано</option>
              <option value="disposed">Утилизировано</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Автомобиль:</label>
            <select
              value={selectedCarId}
              onChange={handleCarSelect}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <option value="">Выберите автомобиль</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>
                  {car.brand} {car.model} (VIN: {car.vin})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Part Number:</label>
            <input
              type="text"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Введите Part Number запчасти"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Модель машины:</label>
            <input
              type="text"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              placeholder="Модель машины (подставляется из списка)"
              readOnly
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>VIN номер:</label>
            <input
              type="text"
              value={vinNumber}
              onChange={(e) => setVinNumber(e.target.value)}
              placeholder="VIN номер (подставляется из списка)"
              readOnly
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
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
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditItemModal;