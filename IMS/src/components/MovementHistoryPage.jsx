// IMS/src/components/MovementHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MovementHistoryPage({ token }) {
  const navigate = useNavigate();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchMovements();
  }, [token]);

  const fetchMovements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/movements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch movements');
      const data = await response.json();
      setMovements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.qr_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || movement.movement_type === selectedType;
    const matchesDateFrom = !dateFrom || new Date(movement.created_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(movement.created_at) <= new Date(dateTo);
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const getMovementTypeColor = (type) => {
    const colors = {
      'in': '#27ae60',
      'out': '#e74c3c',
      'transfer': '#3498db',
      'adjustment': '#f39c12',
    };
    return colors[type] || '#666';
  };

  const getMovementTypeLabel = (type) => {
    const labels = {
      'in': '📥 Приход',
      'out': '📤 Расход',
      'transfer': '🔄 Перемещение',
      'adjustment': '⚙️ Корректировка',
    };
    return labels[type] || type;
  };

  // Стили
  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    backgroundColor: 'white',
    padding: '12px 15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    position: 'sticky',
    top: 0,
  };

  const titleStyle = {
    margin: 0,
    fontSize: '18px',
    color: '#2c3e50',
    fontWeight: '600',
  };

  const headerButtonStyle = {
    padding: '8px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  };

  const mainContentStyle = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  };

  const leftPanelStyle = {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const filtersStyle = {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '8px',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const selectStyle = {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const itemListStyle = {
    flex: 1,
    overflowY: 'auto',
  };

  const itemRowStyle = (isSelected, index) => ({
    padding: '12px 15px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#e3f2fd' : 'white',
    transition: 'all 0.2s',
    animation: `tableRowFadeIn 0.3s ease forwards`,
    animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
    opacity: 0,
  });

  const statsStyle = {
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e0e0e0',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
  };

  const rightPanelStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#fafafa',
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '15px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #3498db',
  };

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  };

  const infoFieldStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const infoLabelStyle = {
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const infoValueStyle = {
    fontSize: '14px',
    color: '#2c3e50',
    fontWeight: '400',
    padding: '8px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
  };

  const badgeStyle = (color) => ({
    padding: '6px 12px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: color,
    display: 'inline-block',
  });

  // CSS для адаптивности + анимации
  const responsiveStyles = `
    @keyframes tableRowFadeIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @media (max-width: 768px) {
      .left-panel {
        max-width: 100% !important;
        border-right: none !important;
      }
      .right-panel {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 200;
        padding: 60px 15px 15px 15px !important;
        overflow-y: auto;
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      .mobile-back-button {
        display: block !important;
        margin-bottom: 15px;
        animation: slideInDown 0.3s ease forwards;
      }
    }
    
    @media (min-width: 769px) {
      .mobile-back-button { display: none !important; }
      .right-panel {
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
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
        <h1 style={titleStyle}>📖 Журнал перемещений</h1>
        <button 
          onClick={() => navigate(-1)} 
          style={headerButtonStyle}
          className="glow-hover"
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          ← Назад
        </button>
      </header>

      {/* Основное содержимое */}
      <div style={mainContentStyle}>
        {/* Левая панель - список */}
        <div className="left-panel" style={leftPanelStyle}>
          {/* Фильтры */}
          <div style={filtersStyle} className="slide-in-left">
            <input
              type="text"
              placeholder="🔍 Поиск по наименованию или QR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={inputStyle}
              className="fade-in"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={selectStyle}
              className="fade-in delay-1"
            >
              <option value="">Все типы</option>
              <option value="in">📥 Приход</option>
              <option value="out">📤 Расход</option>
              <option value="transfer">🔄 Перемещение</option>
              <option value="adjustment">⚙️ Корректировка</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                className="fade-in delay-2"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                className="fade-in delay-3"
              />
            </div>
          </div>

          {/* Список перемещений */}
          <div style={itemListStyle}>
            {filteredMovements.length === 0 ? (
              <div style={emptyStateStyle} className="fade-in">
                <div className="bounce" style={{ fontSize: '48px', marginBottom: '10px' }}>📖</div>
                <p>Нет записей</p>
              </div>
            ) : (
              filteredMovements.map((movement, index) => (
                <div
                  key={movement.id}
                  onClick={() => {
                    setSelectedMovement(movement);
                    setShowDetails(true);
                  }}
                  style={itemRowStyle(selectedMovement && selectedMovement.id === movement.id, index)}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500', color: '#2c3e50', fontSize: '14px' }}>
                      {movement.item_name || 'Товар'}
                    </span>
                    <span style={badgeStyle(getMovementTypeColor(movement.movement_type))}>
                      {getMovementTypeLabel(movement.movement_type)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <div>QR: {movement.qr_code || 'N/A'}</div>
                    <div>📍 {movement.from_location_name || 'N/A'} → {movement.to_location_name || 'N/A'}</div>
                    <div>📅 {new Date(movement.created_at).toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Статистика */}
          <div style={statsStyle} className="fade-in">
            Найдено: <strong>{filteredMovements.length}</strong> из <strong>{movements.length}</strong>
          </div>
        </div>

        {/* Правая панель - детали */}
        <div className="right-panel" style={{
          ...rightPanelStyle,
          display: showDetails || window.innerWidth > 768 ? 'block' : 'none'
        }}>
          {selectedMovement ? (
            <>
              {/* Кнопка назад (только для мобильных) */}
              <button
                className="mobile-back-button glow-hover"
                onClick={() => setShowDetails(false)}
                style={{
                  ...headerButtonStyle,
                  display: 'none',
                  marginBottom: '15px',
                  width: '100%',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ← Назад к списку
              </button>

              {/* Основная информация */}
              <div style={cardStyle} className="inventory-card card-hover">
                <h2 style={cardTitleStyle}>📖 Информация о перемещении</h2>
                <div style={infoGridStyle}>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Тип операции</span>
                    <span style={infoValueStyle}>
                      <span style={badgeStyle(getMovementTypeColor(selectedMovement.movement_type))}>
                        {getMovementTypeLabel(selectedMovement.movement_type)}
                      </span>
                    </span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Товар</span>
                    <span style={{ ...infoValueStyle, fontWeight: '600' }}>{selectedMovement.item_name || 'N/A'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>QR-код</span>
                    <span style={infoValueStyle}>{selectedMovement.qr_code || 'N/A'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Количество</span>
                    <span style={{ ...infoValueStyle, fontWeight: '600', fontSize: '16px' }}>
                      {selectedMovement.quantity} шт.
                    </span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Откуда</span>
                    <span style={infoValueStyle}>📍 {selectedMovement.from_location_name || 'N/A'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Куда</span>
                    <span style={infoValueStyle}>📍 {selectedMovement.to_location_name || 'N/A'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Дата и время</span>
                    <span style={infoValueStyle}>📅 {new Date(selectedMovement.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Выполнил</span>
                    <span style={infoValueStyle}>👤 {selectedMovement.created_by_username || 'N/A'}</span>
                  </div>
                  {selectedMovement.comment && (
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>Комментарий</span>
                      <span style={{ ...infoValueStyle, minHeight: '60px' }}>{selectedMovement.comment}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Дополнительная информация */}
              <div style={cardStyle} className="inventory-card card-hover">
                <h2 style={cardTitleStyle}>🔧 Технические данные</h2>
                <div style={infoGridStyle}>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>ID перемещения</span>
                    <span style={infoValueStyle}>#{selectedMovement.id}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>ID товара</span>
                    <span style={infoValueStyle}>#{selectedMovement.item_id}</span>
                  </div>
                  {selectedMovement.from_location_id && (
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>ID склада (откуда)</span>
                      <span style={infoValueStyle}>#{selectedMovement.from_location_id}</span>
                    </div>
                  )}
                  {selectedMovement.to_location_id && (
                    <div style={infoFieldStyle}>
                      <span style={infoLabelStyle}>ID склада (куда)</span>
                      <span style={infoValueStyle}>#{selectedMovement.to_location_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={cardStyle} className="scale-in">
              <div style={emptyStateStyle}>
                <div className="bounce" style={{ fontSize: '64px', marginBottom: '15px' }}>👈</div>
                <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Выберите перемещение</h3>
                <p style={{ color: '#666' }}>Кликните на запись в списке</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovementHistoryPage;