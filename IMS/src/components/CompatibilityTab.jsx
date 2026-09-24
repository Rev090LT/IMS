// IMS/src/components/CompatibilityTab.jsx
import React, { useState, useEffect } from 'react';

function CompatibilityTab({ carId, token, sourceCar, onAddCompatibility }) {
  const [compatibleModels, setCompatibleModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [compatibleParts, setCompatibleParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchVin, setSearchVin] = useState('');
  const [vinResult, setVinResult] = useState(null);

  // Загрузка совместимых моделей
  useEffect(() => {
    fetchCompatibleModels();
  }, [carId, token]);

  const fetchCompatibleModels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cars/${carId}/compatible`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCompatibleModels(data.compatible_models || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка запчастей для выбранной модели
  const fetchCompatibleParts = async (brand, model, generation) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (generation) params.append('generation', generation);
      
      const response = await fetch(
        `/api/cars/${carId}/compatible/${encodeURIComponent(brand)}/${encodeURIComponent(model)}/parts?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (!response.ok) throw new Error('Failed to fetch parts');
      const data = await response.json();
      setCompatibleParts(data.parts || []);
      setSelectedModel({ brand, model, generation });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Поиск по VIN
  const handleVinSearch = async () => {
    if (!searchVin.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/cars/vin/decode/${searchVin.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVinResult(data);
      
      // Если нашли — автоматически подгрузить совместимость
      if (data.found && data.source === 'local') {
        // Можно автоматически добавить в совместимые
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Стили
  const containerStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
  const searchBoxStyle = { display: 'flex', gap: '10px', marginBottom: '20px' };
  const inputStyle = { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' };
  const buttonStyle = { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
  const modelCardStyle = { cursor: 'pointer', transition: 'all 0.2s' };
  const badgeStyle = (type) => ({
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: type === 'bidirectional' ? '#27ae60' : type === 'to' ? '#3498db' : '#95a5a6',
    color: 'white'
  });

  return (
    <div style={containerStyle}>
      {/* Поиск по VIN */}
      <div style={cardStyle}>
        <h4 style={{ margin: '0 0 15px' }}>🔍 Поиск совместимого авто по VIN</h4>
        <div style={searchBoxStyle}>
          <input
            type="text"
            placeholder="Введите VIN номер..."
            value={searchVin}
            onChange={(e) => setSearchVin(e.target.value.toUpperCase())}
            style={inputStyle}
            maxLength={17}
          />
          <button onClick={handleVinSearch} style={buttonStyle} disabled={loading}>
            {loading ? '⏳' : '🔍 Найти'}
          </button>
        </div>
        
        {vinResult && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: vinResult.found ? '#d5f5e3' : '#fadbd8', borderRadius: '6px' }}>
            {vinResult.found ? (
              <>
                <strong>✅ Найдено:</strong> {vinResult.brand} {vinResult.model} {vinResult.year}
                {vinResult.source === 'local' && (
                  <button 
                    onClick={() => {/* Добавить в совместимые */}}
                    style={{ ...buttonStyle, marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    ➕ Добавить совместимость
                  </button>
                )}
              </>
            ) : (
              <strong>❌ Не найдено:</strong> {vinResult.message}
            )}
          </div>
        )}
      </div>

      {/* Список совместимых моделей */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0 }}>🔗 Совместимые автомобили ({compatibleModels.length})</h4>
          <button onClick={onAddCompatibility} style={{ ...buttonStyle, padding: '8px 16px', fontSize: '13px' }}>
            ➕ Добавить
          </button>
        </div>

        {loading && !selectedModel ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Загрузка...</div>
        ) : error ? (
          <div style={{ color: '#e74c3c' }}>❌ {error}</div>
        ) : compatibleModels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔗</div>
            <p>Совместимые автомобили не добавлены</p>
            <p style={{ fontSize: '13px' }}>
              Например: для <strong>{sourceCar?.brand} {sourceCar?.model}</strong> подходят запчасти от 
              <strong> Nissan Maxima A32</strong> (1999-2003)
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {compatibleModels.map((model, idx) => (
              <div
                key={idx}
                style={{ ...cardStyle, ...modelCardStyle }}
                onClick={() => fetchCompatibleParts(model.compatible_brand, model.compatible_model, model.compatible_generation)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>
                      {model.compatible_brand} {model.compatible_model}
                    </strong>
                    {model.compatible_generation && (
                      <span style={{ color: '#666', marginLeft: '5px' }}>
                        ({model.compatible_generation})
                      </span>
                    )}
                  </div>
                  <span style={badgeStyle(model.compatibility_type)}>
                    {model.compatibility_type === 'bidirectional' ? '↔' : model.compatibility_type === 'to' ? '→' : '←'}
                  </span>
                </div>
                
                {model.compatible_years && (
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    📅 {Array.isArray(model.compatible_years) ? model.compatible_years.join(', ') : model.compatible_years}
                  </div>
                )}
                
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#27ae60' }}>
                    📦 {model.parts_count} запчастей
                  </span>
                  {model.categories && model.categories.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#999' }}>
                      {model.categories.slice(0, 2).join(', ')}
                      {model.categories.length > 2 && '...'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Детали запчастей для выбранной модели */}
      {selectedModel && compatibleParts.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0 }}>
              📦 Запчасти для {selectedModel.brand} {selectedModel.model}
              {selectedModel.generation && ` (${selectedModel.generation})`}
            </h4>
            <button 
              onClick={() => { setSelectedModel(null); setCompatibleParts([]); }}
              style={{ ...buttonStyle, backgroundColor: '#95a5a6', padding: '6px 12px', fontSize: '12px' }}
            >
              ✕ Скрыть
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0' }}>Запчасть</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0' }}>Категория</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0' }}>Совместимость</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0' }}>Состояние</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0' }}>Цена</th>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0' }}>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {compatibleParts.map((part, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{part.source_part_name}</td>
                    <td style={{ padding: '12px' }}>{part.source_part_category || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={badgeStyle(part.compatibility_type)}>
                        {part.compatibility_type === 'bidirectional' ? '↔ Взаимозаменяема' : 
                         part.compatibility_type === 'to' ? '→ Подходит на целевое' : '← Подходит на текущее'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{part.condition || '—'}</td>
                    <td style={{ padding: '12px' }}>{part.price ? `${part.price.toLocaleString('ru-RU')} ₽` : '—'}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{part.compatibility_notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompatibilityTab;