// IMS/src/components/CarDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function CarDetailPage({ token }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [car, setCar] = useState(null);
  const [legalInfo, setLegalInfo] = useState(null);
  const [compatibility, setCompatibility] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState(null); // 'tech', 'legal', 'photos'
  
  // Состояния для редактирования
  const [techForm, setTechForm] = useState({});
  const [legalForm, setLegalForm] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCarDetails();
  }, [id, token]);

  // Заполняем формы при входе в режим редактирования
  useEffect(() => {
    if (car) setTechForm({ ...car });
    if (legalInfo) setLegalForm({ ...legalInfo });
  }, [isEditing, car, legalInfo]);

  const fetchCarDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/cars/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch car details');
      const data = await response.json();
      setCar(data.car);
      setLegalInfo(data.legal_info);
      setCompatibility(data.compatibility);
      setParts(data.parts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === ОБНОВЛЕНИЕ ТЕХНИЧЕСКОЙ ИНФОРМАЦИИ ===
  const handleTechChange = (e) => {
    const { name, value } = e.target;
    setTechForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTech = async () => {
    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...techForm,
          year: techForm.year ? parseInt(techForm.year) : null,
          engine_volume: techForm.engine_volume ? parseFloat(techForm.engine_volume) : null,
          mileage: techForm.mileage ? parseInt(techForm.mileage) : null,
          purchase_price: techForm.purchase_price ? parseFloat(techForm.purchase_price) : null,
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при сохранении');
      }
      
      const data = await response.json();
      setCar(data.car);
      setSuccess('✅ Технические данные обновлены');
      setIsEditing(false);
      setEditMode(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // === ОБНОВЛЕНИЕ ЮРИДИЧЕСКОЙ ИНФОРМАЦИИ ===
  const handleLegalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLegalForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveLegal = async () => {
    try {
      const response = await fetch(`/api/cars/${id}/legal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(legalForm)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при сохранении');
      }
      
      const data = await response.json();
      setLegalInfo(data.legal_info);
      setSuccess('✅ Юридическая информация обновлена');
      setIsEditing(false);
      setEditMode(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // === ЗАГРУЗКА ФОТО ===
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('photos', file));
      
      const response = await fetch(`/api/cars/${id}/photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при загрузке фото');
      }
      
      const data = await response.json();
      // Обновляем фото в каре
      setCar(prev => ({ ...prev, photos: data.photos }));
      setSelectedFiles([]);
      setSuccess('✅ Фото загружены');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    if (!window.confirm('Удалить это фото?')) return;
    
    try {
      const response = await fetch(`/api/cars/${id}/photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ photo_url: photoUrl })
      });
      
      if (!response.ok) throw new Error('Ошибка при удалении');
      
      const data = await response.json();
      setCar(prev => ({ ...prev, photos: data.photos }));
      setSuccess('✅ Фото удалено');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCar = async () => {
    if (!window.confirm('Удалить этот автомобиль из системы?')) return;
    
    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        navigate('/dashboard'); // ← Возврат на дашборд
      } else {
        throw new Error('Ошибка при удалении');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#27ae60',
      'dismantling': '#f39c12',
      'completed': '#e74c3c',
      'sold': '#95a5a6',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': '🟢 В разборе',
      'dismantling': '🟡 Разбирается',
      'completed': '🔴 Разобран',
      'sold': '⚫ Продан',
    };
    return labels[status] || status;
  };

  // Стили
  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    backgroundColor: 'white',
    padding: '15px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const titleStyle = {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c3e50',
  };

  const headerButtonStyle = {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  };

  const mainContentStyle = {
    flex: 1,
    display: 'flex',
    gap: '20px',
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  };

  const leftPanelStyle = { flex: 1, minWidth: 0 };
  const rightPanelStyle = { width: '350px', flexShrink: 0 };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  };

  const tabsStyle = {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px',
    flexWrap: 'wrap',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#3498db' : '#f5f5f5',
    color: isActive ? 'white' : '#666',
    border: 'none',
    borderRadius: '6px 6px 0 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '400',
  });

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  };

  const infoFieldStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
  const infoLabelStyle = { fontSize: '11px', color: '#999', fontWeight: '500', textTransform: 'uppercase' };
  const infoValueStyle = { fontSize: '14px', color: '#2c3e50', fontWeight: '500' };

  const inputStyle = {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
  };

  const badgeStyle = (color) => ({
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: color,
    color: 'white',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
  });

  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
  const thStyle = { textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0', fontWeight: '600', color: '#666' };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #f0f0f0' };
  const emptyStateStyle = { textAlign: 'center', padding: '40px 20px', color: '#999' };

  const photoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '10px',
  };

  const photoItemStyle = {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  };

  const deletePhotoBtnStyle = {
    position: 'absolute',
    top: '5px',
    right: '5px',
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const responsiveStyles = `
    @media (max-width: 1024px) {
      .main-content { flex-direction: column !important; }
      .right-panel { width: 100% !important; }
    }
    @media (max-width: 768px) {
      .tabs { flex-wrap: wrap !important; }
      .tab-button { flex: 1 !important; text-align: center !important; }
    }
  `;

  if (loading) {
    return (
      <div style={pageStyle}>
        <style>{responsiveStyles}</style>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h2>Загрузка...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <style>{responsiveStyles}</style>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px', color: '#e74c3c' }}>❌</div>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} style={headerButtonStyle}>
            ← На дашборд
          </button>
        </div>
      </div>
    );
  }

  if (!car) return null;

  return (
    <div style={pageStyle}>
      <style>{responsiveStyles}</style>
      
      {/* Шапка */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          🚗 {car.brand} {car.model} {car.generation ? `(${car.generation})` : ''}
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setEditMode(null); }} style={{ ...headerButtonStyle, backgroundColor: '#95a5a6' }}>
                ✕ Отмена
              </button>
              <button 
                onClick={editMode === 'tech' ? handleSaveTech : handleSaveLegal} 
                style={{ ...headerButtonStyle, backgroundColor: '#27ae60' }}
              >
                💾 Сохранить
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setIsEditing(true); setEditMode(activeTab === 'legal' ? 'legal' : 'tech'); }} style={{ ...headerButtonStyle, backgroundColor: '#3498db' }}>
                ✏️ Редактировать
              </button>
              <button onClick={handleDeleteCar} style={{ ...headerButtonStyle, backgroundColor: '#e74c3c' }}>
                🗑️ Удалить
              </button>
            </>
          )}
          <button onClick={() => navigate('/dashboard')} style={{ ...headerButtonStyle, backgroundColor: '#95a5a6' }}>
            ← На дашборд
          </button>
        </div>
      </header>

      {/* Сообщения */}
      {success && (
        <div style={{ padding: '10px 20px', backgroundColor: '#d5f5e3', color: '#27ae60', textAlign: 'center', borderBottom: '1px solid #27ae60' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 20px', backgroundColor: '#fadbd8', color: '#e74c3c', textAlign: 'center', borderBottom: '1px solid #e74c3c' }}>
          {error}
        </div>
      )}

      {/* Основное содержимое */}
      <div className="main-content" style={mainContentStyle}>
        
        {/* Левая панель - вкладки */}
        <div className="left-panel" style={leftPanelStyle}>
          
          {/* Вкладки */}
          <div className="tabs" style={tabsStyle}>
            <button onClick={() => { setActiveTab('info'); setEditMode('tech'); }} style={tabButtonStyle(activeTab === 'info')} className="tab-button">📋 Тех. информация</button>
            <button onClick={() => { setActiveTab('legal'); setEditMode('legal'); }} style={tabButtonStyle(activeTab === 'legal')} className="tab-button">📄 Юридическая</button>
            <button onClick={() => setActiveTab('compatibility')} style={tabButtonStyle(activeTab === 'compatibility')} className="tab-button">🔗 Совместимость</button>
            <button onClick={() => setActiveTab('parts')} style={tabButtonStyle(activeTab === 'parts')} className="tab-button">📦 Запчасти ({parts.length})</button>
            <button onClick={() => setActiveTab('photos')} style={tabButtonStyle(activeTab === 'photos')} className="tab-button">📸 Фото ({car.photos?.length || 0})</button>
          </div>

          <div style={cardStyle}>
            
            {/* === Вкладка: Техническая информация === */}
            {activeTab === 'info' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Технические характеристики</h3>
                  <span style={badgeStyle(getStatusColor(car.status))}>{getStatusLabel(car.status)}</span>
                </div>
                
                {isEditing && editMode === 'tech' ? (
                  <div style={infoGridStyle}>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>VIN *</span>
                      <input name="vin" value={techForm.vin || ''} onChange={handleTechChange} style={inputStyle} readOnly />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Марка *</span>
                      <input name="brand" value={techForm.brand || ''} onChange={handleTechChange} style={inputStyle} />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Модель *</span>
                      <input name="model" value={techForm.model || ''} onChange={handleTechChange} style={inputStyle} />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Поколение</span>
                      <input name="generation" value={techForm.generation || ''} onChange={handleTechChange} style={inputStyle} placeholder="A32, E39..." />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Год выпуска</span>
                      <input type="number" name="year" value={techForm.year || ''} onChange={handleTechChange} style={inputStyle} placeholder="2005" />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Цвет</span>
                      <input name="color" value={techForm.color || ''} onChange={handleTechChange} style={inputStyle} />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Двигатель</span>
                      <input name="engine_type" value={techForm.engine_type || ''} onChange={handleTechChange} style={inputStyle} placeholder="VQ20DD" />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Объём (л)</span>
                      <input type="number" step="0.1" name="engine_volume" value={techForm.engine_volume || ''} onChange={handleTechChange} style={{ ...inputStyle, width: '100px' }} />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Коробка</span>
                      <select name="transmission" value={techForm.transmission || ''} onChange={handleTechChange} style={inputStyle}>
                        <option value="">Не указано</option>
                        <option value="AT">Автомат (AT)</option>
                        <option value="MT">Механика (MT)</option>
                        <option value="CVT">Вариатор (CVT)</option>
                        <option value="AMT">Робот (AMT)</option>
                      </select>
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Привод</span>
                      <select name="drive_type" value={techForm.drive_type || ''} onChange={handleTechChange} style={inputStyle}>
                        <option value="">Не указано</option>
                        <option value="FWD">Передний (FWD)</option>
                        <option value="RWD">Задний (RWD)</option>
                        <option value="AWD">Полный (AWD)</option>
                      </select>
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Кузов</span>
                      <input name="body_type" value={techForm.body_type || ''} onChange={handleTechChange} style={inputStyle} placeholder="Седан" />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Пробег (км)</span>
                      <input type="number" name="mileage" value={techForm.mileage || ''} onChange={handleTechChange} style={inputStyle} />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Дата поступления *</span>
                      <input type="date" name="arrival_date" value={techForm.arrival_date?.split('T')[0] || ''} onChange={handleTechChange} style={inputStyle} required />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Цена покупки (₽)</span>
                      <input type="number" name="purchase_price" value={techForm.purchase_price || ''} onChange={handleTechChange} style={inputStyle} />
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Статус</span>
                      <select name="status" value={techForm.status || 'active'} onChange={handleTechChange} style={inputStyle}>
                        <option value="active">🟢 В разборе</option>
                        <option value="dismantling">🟡 Разбирается</option>
                        <option value="completed">🔴 Разобран</option>
                        <option value="sold">⚫ Продан</option>
                      </select>
                    </div>
                    <div style={{ ...infoFieldStyle, gridColumn: '1 / -1' }}>
                      <span style={infoLabelStyle}>Заметки</span>
                      <textarea name="notes" value={techForm.notes || ''} onChange={handleTechChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                    </div>
                  </div>
                ) : (
                  <div style={infoGridStyle}>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>VIN</span><span style={{ ...infoValueStyle, fontFamily: 'monospace' }}>{car.vin}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Марка</span><span style={infoValueStyle}>{car.brand}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Модель</span><span style={infoValueStyle}>{car.model}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Поколение</span><span style={infoValueStyle}>{car.generation || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Год</span><span style={infoValueStyle}>{car.year || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Цвет</span><span style={infoValueStyle}>{car.color || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Двигатель</span><span style={infoValueStyle}>{car.engine_type || '—'} {car.engine_volume ? `${car.engine_volume}L` : ''}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Коробка</span><span style={infoValueStyle}>{car.transmission || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Привод</span><span style={infoValueStyle}>{car.drive_type || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Кузов</span><span style={infoValueStyle}>{car.body_type || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Пробег</span><span style={infoValueStyle}>{car.mileage ? `${car.mileage.toLocaleString()} км` : '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Поступил</span><span style={infoValueStyle}>{car.arrival_date ? new Date(car.arrival_date).toLocaleDateString('ru-RU') : '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Цена покупки</span><span style={infoValueStyle}>{car.purchase_price ? `${car.purchase_price.toLocaleString('ru-RU')} ₽` : '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Статус</span><span style={infoValueStyle}>{getStatusLabel(car.status)}</span></div>
                  </div>
                )}
                {car.notes && !isEditing && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                    <span style={infoLabelStyle}>Заметки</span>
                    <p style={{ margin: '10px 0 0', color: '#666', whiteSpace: 'pre-wrap' }}>{car.notes}</p>
                  </div>
                )}
              </>
            )}

            {/* === Вкладка: Юридическая информация === */}
            {activeTab === 'legal' && (
              <>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>📄 Юридическая информация</h3>
                {isEditing && editMode === 'legal' ? (
                  <div style={infoGridStyle}>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Номер ПТС</span><input name="pts_number" value={legalForm.pts_number || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Номер СТС</span><input name="sts_number" value={legalForm.sts_number || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Госномер</span><input name="registration_number" value={legalForm.registration_number || ''} onChange={handleLegalChange} style={inputStyle} placeholder="А000АА 777" /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Собственник</span><input name="owner_name" value={legalForm.owner_name || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>ИНН собственника</span><input name="owner_inn" value={legalForm.owner_inn || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Договор №</span><input name="purchase_contract_number" value={legalForm.purchase_contract_number || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Дата договора</span><input type="date" name="purchase_contract_date" value={legalForm.purchase_contract_date?.split('T')[0] || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Ссылка на договор</span><input name="purchase_contract_url" value={legalForm.purchase_contract_url || ''} onChange={handleLegalChange} style={inputStyle} placeholder="https://..." /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>ГТД (таможня)</span><input name="customs_declaration" value={legalForm.customs_declaration || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Причина списания</span><input name="write_off_reason" value={legalForm.write_off_reason || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Дата списания</span><input type="date" name="write_off_date" value={legalForm.write_off_date?.split('T')[0] || ''} onChange={handleLegalChange} style={inputStyle} /></div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Ограничения (арест)</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" name="is_arrested" checked={legalForm.is_arrested || false} onChange={handleLegalChange} />
                        <span>⚠️ Есть ограничения</span>
                      </label>
                    </div>
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>В залоге</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" name="is_залоговый" checked={legalForm.is_залоговый || false} onChange={handleLegalChange} />
                        <span>🔒 В залоге</span>
                      </label>
                    </div>
                    <div style={{ ...infoFieldStyle, gridColumn: '1 / -1' }}>
                      <span style={infoLabelStyle}>Доп. заметки</span>
                      <textarea name="notes" value={legalForm.notes || ''} onChange={handleLegalChange} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
                    </div>
                  </div>
                ) : legalInfo ? (
                  <div style={infoGridStyle}>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>ПТС</span><span style={infoValueStyle}>{legalInfo.pts_number || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>СТС</span><span style={infoValueStyle}>{legalInfo.sts_number || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Госномер</span><span style={infoValueStyle}>{legalInfo.registration_number || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Собственник</span><span style={infoValueStyle}>{legalInfo.owner_name || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>ИНН</span><span style={infoValueStyle}>{legalInfo.owner_inn || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Договор</span><span style={infoValueStyle}>{legalInfo.purchase_contract_number || '—'} {legalInfo.purchase_contract_date ? `от ${new Date(legalInfo.purchase_contract_date).toLocaleDateString('ru-RU')}` : ''}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>ГТД</span><span style={infoValueStyle}>{legalInfo.customs_declaration || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Причина списания</span><span style={infoValueStyle}>{legalInfo.write_off_reason || '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Дата списания</span><span style={infoValueStyle}>{legalInfo.write_off_date ? new Date(legalInfo.write_off_date).toLocaleDateString('ru-RU') : '—'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Ограничения</span><span style={{ ...infoValueStyle, color: legalInfo.is_arrested ? '#e74c3c' : '#27ae60', fontWeight: '600' }}>{legalInfo.is_arrested ? '⚠️ Есть' : '✅ Чистый'}</span></div>
                    <div style={infoFieldStyle}><span style={infoLabelStyle}>Залог</span><span style={{ ...infoValueStyle, color: legalInfo.is_залоговый ? '#e74c3c' : '#27ae60', fontWeight: '600' }}>{legalInfo.is_залоговый ? '🔒 В залоге' : '✅ Свободен'}</span></div>
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    <p>Юридическая информация не заполнена</p>
                    <button onClick={() => { setIsEditing(true); setEditMode('legal'); }} style={{ ...headerButtonStyle, marginTop: '10px' }}>✏️ Добавить</button>
                  </div>
                )}
              </>
            )}

            {/* === Вкладка: Совместимость === */}
            {activeTab === 'compatibility' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>🔗 Совместимые автомобили</h3>
                  <button style={{ ...headerButtonStyle, padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Функция в разработке')}>➕ Добавить</button>
                </div>
                {compatibility.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead><tr><th style={thStyle}>Марка</th><th style={thStyle}>Модель</th><th style={thStyle}>Поколение</th><th style={thStyle}>Год</th><th style={thStyle}>Примечание</th></tr></thead>
                      <tbody>
                        {compatibility.map(item => (
                          <tr key={item.id}>
                            <td style={tdStyle}>{item.compatible_brand}</td>
                            <td style={tdStyle}>{item.compatible_model}</td>
                            <td style={tdStyle}>{item.compatible_generation || '—'}</td>
                            <td style={tdStyle}>{item.compatible_year || '—'}</td>
                            <td style={tdStyle}>{item.compatibility_note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    <p>Совместимые автомобили не добавлены</p>
                    <p style={{ fontSize: '13px', color: '#999' }}>Например: для Nissan Cefiro A32 подходят запчасти от Nissan Maxima A32</p>
                  </div>
                )}
              </>
            )}

            {/* === Вкладка: Запчасти === */}
            {activeTab === 'parts' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>📦 Запчасти на этом авто</h3>
                  <button style={{ ...headerButtonStyle, padding: '8px 16px', fontSize: '13px' }} onClick={() => alert('Функция в разработке')}>➕ Добавить запчасть</button>
                </div>
                {parts.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead><tr><th style={thStyle}>Название</th><th style={thStyle}>Категория</th><th style={thStyle}>Артикул</th><th style={thStyle}>Состояние</th><th style={thStyle}>Цена</th><th style={thStyle}>Статус</th></tr></thead>
                      <tbody>
                        {parts.map(part => (
                          <tr key={part.id}>
                            <td style={{ ...tdStyle, fontWeight: '500' }}>{part.part_name}</td>
                            <td style={tdStyle}>{part.part_category || '—'}</td>
                            <td style={tdStyle}>{part.part_number || '—'}</td>
                            <td style={tdStyle}>{part.condition || '—'}</td>
                            <td style={tdStyle}>{part.price ? `${part.price.toLocaleString('ru-RU')} ₽` : '—'}</td>
                            <td style={tdStyle}><span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', backgroundColor: part.status === 'available' ? '#27ae60' : '#95a5a6', color: 'white' }}>{part.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    <p>Запчасти не добавлены</p>
                    <button style={{ ...headerButtonStyle, marginTop: '10px' }} onClick={() => alert('Функция в разработке')}>➕ Добавить первую запчасть</button>
                  </div>
                )}
              </>
            )}

            {/* === Вкладка: Фотографии === */}
            {activeTab === 'photos' && (
              <>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>📸 Фотографии автомобиля</h3>
                
                {/* Загрузка новых фото */}
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>📤 Добавить фото:</label>
                  <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ marginBottom: '10px' }} />
                  {selectedFiles.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#666' }}>Выбрано файлов: {selectedFiles.length}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                        {selectedFiles.map((file, idx) => (
                          <span key={idx} style={{ fontSize: '12px', backgroundColor: '#e0e0e0', padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {file.name.slice(0, 20)}...
                            <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '16px', lineHeight: 1 }}>✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={handleUploadPhotos} disabled={selectedFiles.length === 0 || uploading} style={{ ...headerButtonStyle, backgroundColor: selectedFiles.length > 0 && !uploading ? '#27ae60' : '#95a5a6' }}>
                    {uploading ? '⏳ Загрузка...' : '📤 Загрузить фото'}
                  </button>
                </div>

                {/* Галерея */}
                {car.photos?.length > 0 ? (
                  <div style={photoGridStyle}>
                    {car.photos.map((photo, index) => (
                      <div key={index} style={photoItemStyle}>
                        <img src={photo} alt={`Фото ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(photo, '_blank')} />
                        <button onClick={() => handleDeletePhoto(photo)} style={deletePhotoBtnStyle} title="Удалить фото">✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...emptyStateStyle, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                    <p>Фотографии не добавлены</p>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Правая панель - сводная информация */}
        <div className="right-panel" style={rightPanelStyle}>
          
          {/* Фото превью */}
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 15px', fontSize: '16px' }}>📸 Фото</h4>
            {car.photos?.[0] ? (
              <img src={car.photos[0]} alt="Главное фото" style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(car.photos[0], '_blank')} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '48px' }}>🚗</div>
            )}
          </div>

          {/* Статистика */}
          <div style={cardStyle}>
            <h4 style={{ margin: '0 0 15px', fontSize: '16px' }}>📊 Статистика</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>Всего запчастей:</span><span style={{ fontWeight: '600' }}>{parts.length}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>Доступно:</span><span style={{ fontWeight: '600', color: '#27ae60' }}>{parts.filter(p => p.status === 'available').length}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>Продано:</span><span style={{ fontWeight: '600', color: '#95a5a6' }}>{parts.filter(p => p.status === 'sold').length}</span></div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Общая стоимость:</span>
                <span style={{ fontWeight: '600', color: '#3498db' }}>{parts.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CarDetailPage;