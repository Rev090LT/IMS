// IMS/src/components/AddItemPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from './PhotoUpload';

function AddItemPage({ token }) {
  const navigate = useNavigate();
  
  // Загружаем значения из localStorage
  const [qrCode, setQrCode] = useState(() => localStorage.getItem('addItem_qrCode') || '');
  const [name, setName] = useState(() => localStorage.getItem('addItem_name') || '');
  const [description, setDescription] = useState(() => localStorage.getItem('addItem_description') || '');
  const [quantity, setQuantity] = useState(() => localStorage.getItem('addItem_quantity') || '1');
  const [status, setStatus] = useState(() => localStorage.getItem('addItem_status') || 'active');
  const [locationId, setLocationId] = useState(() => localStorage.getItem('addItem_locationId') || '');
  const [categoryId, setCategoryId] = useState(() => localStorage.getItem('addItem_categoryId') || '');
  const [manufacturerId, setManufacturerId] = useState(() => localStorage.getItem('addItem_manufacturerId') || '');
  const [newManufacturerName, setNewManufacturerName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [partNumber, setPartNumber] = useState(() => localStorage.getItem('addItem_partNumber') || '');
  const [carModel, setCarModel] = useState(() => localStorage.getItem('addItem_carModel') || '');
  const [vinNumber, setVinNumber] = useState(() => localStorage.getItem('addItem_vinNumber') || '');
  const [selectedCarId, setSelectedCarId] = useState(() => localStorage.getItem('addItem_selectedCarId') || '');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Для фото
  const [newItemId, setNewItemId] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  // Сохраняем значения в localStorage
  useEffect(() => {
    localStorage.setItem('addItem_qrCode', qrCode);
    localStorage.setItem('addItem_name', name);
    localStorage.setItem('addItem_description', description);
    localStorage.setItem('addItem_quantity', quantity);
    localStorage.setItem('addItem_status', status);
    localStorage.setItem('addItem_locationId', locationId);
    localStorage.setItem('addItem_categoryId', categoryId);
    localStorage.setItem('addItem_manufacturerId', manufacturerId);
    localStorage.setItem('addItem_partNumber', partNumber);
    localStorage.setItem('addItem_carModel', carModel);
    localStorage.setItem('addItem_vinNumber', vinNumber);
    localStorage.setItem('addItem_selectedCarId', selectedCarId);
  }, [qrCode, name, description, quantity, status, locationId, categoryId, manufacturerId, partNumber, carModel, vinNumber, selectedCarId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, mansRes, locsRes, carsRes] = await Promise.all([
          fetch('/api/lookup/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/lookup/manufacturers', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/locations', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/items/cars', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const [catsData, mansData, locsData, carsData] = await Promise.all([
          catsRes.json(), mansRes.json(), locsRes.json(), carsRes.json()
        ]);

        if (!catsRes.ok || !mansRes.ok || !locsRes.ok || !carsRes.ok) {
          throw new Error('Failed to load data');
        }

        setCategories(catsData);
        setManufacturers(mansData);
        setLocations(locsData);
        setCars(carsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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

  const generateQRCode = () => {
    const randomFiveDigits = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    setQrCode(`2000000${randomFiveDigits}`);
  };

  const handleAddManufacturer = async () => {
    if (!newManufacturerName.trim()) { setError('Введите название производителя'); return; }
    try {
      const response = await fetch('/api/lookup/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newManufacturerName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error adding manufacturer');
      setManufacturers(prev => [...prev, data]);
      setManufacturerId(data.id);
      setNewManufacturerName('');
      setError('');
    } catch (err) { setError(err.message); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) { setError('Введите название класса'); return; }
    try {
      const response = await fetch('/api/lookup/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error adding category');
      setCategories(prev => [...prev, data]);
      setCategoryId(data.id);
      setNewCategoryName('');
      setError('');
    } catch (err) { setError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          qr_code: qrCode.trim(),
          name: name.trim(),
          description: description.trim(),
          quantity: quantityNum,
          status,
          location_id: locationIdNum,
          category_id: categoryIdNum,
          manufacturer_id: manufacturerIdNum,
          part_number: partNumber.trim(),
          car_model: carModel.trim(),
          vin_number: vinNumber.trim()
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error adding item');

      setSuccess('✅ Позиция успешно добавлена!');
      setNewItemId(data.id); // Сохраняем ID для загрузки фото

      // Очищаем localStorage
      ['addItem_qrCode','addItem_name','addItem_description','addItem_quantity','addItem_status','addItem_locationId','addItem_categoryId','addItem_manufacturerId','addItem_partNumber','addItem_carModel','addItem_vinNumber','addItem_selectedCarId'].forEach(key => localStorage.removeItem(key));
      
      // Сбрасываем форму (кроме локации - часто добавляют на тот же склад)
      setQrCode(''); setName(''); setDescription(''); setQuantity('1'); setStatus('active');
      setCategoryId(''); setManufacturerId(''); setPartNumber(''); setCarModel(''); setVinNumber(''); setSelectedCarId('');
      setNewManufacturerName(''); setNewCategoryName('');
      
    } catch (err) { setError(err.message); }
  };

  const handlePhotoUploaded = () => {
    setPhotoUploaded(true);
  };

  // Стили
  const pageStyle = { minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' };
  const headerStyle = { backgroundColor: 'white', padding: '12px 15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, position: 'sticky', top: 0 };
  const titleStyle = { margin: 0, fontSize: '18px', color: '#2c3e50', fontWeight: '600' };
  const headerButtonStyle = { padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease' };
  const mainContentStyle = { flex: 1, display: 'flex', overflow: 'hidden', gap: '20px', padding: '20px' };
  const panelStyle = { flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '15px', marginBottom: '15px' };
  const cardTitleStyle = { fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #3498db' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' };
  const selectStyle = { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', width: '100%', boxSizing: 'border-box', marginBottom: '8px' };
  const buttonStyle = { padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease' };
  const errorBoxStyle = { color: '#e74c3c', backgroundColor: '#fadbd8', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #e74c3c' };
  const successBoxStyle = { color: '#27ae60', backgroundColor: '#d5f5e3', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #27ae60' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#2c3e50', fontSize: '14px' };
  const rowStyle = { display: 'flex', gap: '10px', marginBottom: '15px' };

  const responsiveStyles = `
    @media (max-width: 1024px) {
      .main-content { flex-direction: column !important; }
      .panel { max-width: 100% !important; }
    }
  `;

  if (loading) {
    return (
      <div style={pageStyle} className="page-transition">
        <style>{responsiveStyles}</style>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="pulse" style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h2 className="fade-in" style={{ color: '#2c3e50' }}>Загрузка...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle} className="page-transition">
      <style>{responsiveStyles}</style>
      
      {/* Шапка */}
      <header style={headerStyle} className="slide-in-down">
        <h1 style={titleStyle}>➕ Добавить позицию</h1>
        <button onClick={() => navigate(-1)} style={headerButtonStyle} className="glow-hover">← Назад</button>
      </header>

      {/* Основное содержимое */}
      <div className="main-content" style={mainContentStyle}>
        
        {/* Левая панель - Основная форма */}
        <div className="panel" style={panelStyle}>
          <form onSubmit={handleSubmit}>
            
            {/* QR-код */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>🔲 QR-код</h3>
              <div style={rowStyle}>
                <input type="text" value={qrCode} onChange={(e) => setQrCode(e.target.value)} required placeholder="Введите или сгенерируйте QR-код" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                <button type="button" onClick={generateQRCode} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', padding: '10px 16px' }}>🎲 Сгенерировать</button>
              </div>
            </div>

            {/* Основная информация */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>📦 Основная информация</h3>
              
              <label style={labelStyle}>Название *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} placeholder="Например: Тормозной диск передний" />
              
              <label style={labelStyle}>Описание</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Дополнительная информация..." />
              
              <label style={labelStyle}>Количество *</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" required style={inputStyle} />
              
              <label style={labelStyle}>Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
                <option value="active">✅ Активен</option>
                <option value="warehouse">📍 На складе</option>
                <option value="reserved">🔒 Зарезервирован</option>
                <option value="sold">💰 Продан</option>
                <option value="disposed">🗑️ Списан</option>
              </select>
            </div>

            {/* Автомобиль */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>🚗 Автомобиль</h3>
              
              <label style={labelStyle}>Выберите из списка</label>
              <select value={selectedCarId} onChange={handleCarSelect} style={selectStyle}>
                <option value="">— Не выбран —</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>{car.brand} {car.model} {car.year ? `(${car.year})` : ''} (VIN: {car.vin})</option>
                ))}
              </select>
              
              <label style={labelStyle}>Part Number</label>
              <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} style={inputStyle} placeholder="Артикул запчасти" />
              
              <label style={labelStyle}>Модель машины</label>
              <input type="text" value={carModel} onChange={(e) => setCarModel(e.target.value)} readOnly style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} placeholder="Подставляется автоматически" />
              
              <label style={labelStyle}>VIN номер</label>
              <input type="text" value={vinNumber} onChange={(e) => setVinNumber(e.target.value)} readOnly style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} placeholder="Подставляется автоматически" />
            </div>

            {/* Локация и классификация */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>📍 Локация и классификация</h3>
              
              <label style={labelStyle}>Склад *</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required style={selectStyle}>
                <option value="">— Выберите склад —</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
              
              <label style={labelStyle}>Категория</label>
              <div style={rowStyle}>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...selectStyle, flex: 1, marginBottom: 0 }}>
                  <option value="">— Не выбрана —</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button type="button" onClick={handleAddCategory} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', padding: '10px 12px' }}>+</button>
              </div>
              {newCategoryName && (
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Название новой категории" style={{ ...inputStyle, marginTop: '8px' }} />
              )}
              
              <label style={labelStyle}>Производитель</label>
              <div style={rowStyle}>
                <select value={manufacturerId} onChange={(e) => setManufacturerId(e.target.value)} style={{ ...selectStyle, flex: 1, marginBottom: 0 }}>
                  <option value="">— Не выбран —</option>
                  {manufacturers.map(man => <option key={man.id} value={man.id}>{man.name}</option>)}
                </select>
                <button type="button" onClick={handleAddManufacturer} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', padding: '10px 12px' }}>+</button>
              </div>
              {newManufacturerName && (
                <input type="text" value={newManufacturerName} onChange={(e) => setNewManufacturerName(e.target.value)} placeholder="Название нового производителя" style={{ ...inputStyle, marginTop: '8px' }} />
              )}
            </div>

            {/* Кнопки */}
            <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '2px solid #3498db' }}>
              {error && <div style={errorBoxStyle}>{error}</div>}
              {success && <div style={successBoxStyle}>{success}</div>}
              
              <button type="submit" style={{ ...buttonStyle, backgroundColor: '#27ae60', color: 'white', width: '100%', padding: '12px' }} className="glow-hover">
                ✅ Создать позицию
              </button>
            </div>
          </form>
        </div>

        {/* Правая панель - Фотографии */}
        <div className="panel" style={{ ...panelStyle, maxWidth: '400px' }}>
          <h2 style={cardTitleStyle}>📷 Фотографии</h2>
          
          {newItemId ? (
            <>
              <div style={{ ...successBoxStyle, textAlign: 'center' }}>
                ✅ Позиция создана!<br/>
                <small>ID: #{newItemId}</small>
              </div>
              
              <PhotoUpload
                itemId={newItemId}
                token={token}
                onPhotoUploaded={handlePhotoUploaded}
              />
              
              {photoUploaded && (
                <div style={{ ...successBoxStyle, textAlign: 'center', marginTop: '10px' }}>
                  🎉 Фото успешно загружено!
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
              <p>Сначала создайте позицию</p>
              <p style={{ fontSize: '12px' }}>Фото можно добавить после сохранения</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddItemPage;