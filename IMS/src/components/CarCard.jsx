// IMS/src/components/CarCard.jsx
import React from 'react';

function CarCard({ car, token, onViewDetails, viewMode = 'grid' }) {
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

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'all 0.3s',
    cursor: 'pointer',
  };

  const imageStyle = {
    width: '100%',
    height: viewMode === 'grid' ? '200px' : '150px',
    objectFit: 'cover',
    backgroundColor: '#f5f5f5',
  };

  const contentStyle = {
    padding: '15px',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '8px',
  };

  const infoStyle = {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px',
  };

  const badgeStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: getStatusColor(car.status),
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '10px',
  };

  const statsStyle = {
    display: 'flex',
    gap: '15px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  };

  const statStyle = {
    fontSize: '12px',
    color: '#666',
  };

  return (
    <div
      style={cardStyle}
      onClick={onViewDetails}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Фото (заглушка если нет) */}
      <div style={imageStyle}>
        {car.photos?.[0] ? (
          <img src={car.photos[0]} alt={car.brand} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e0e0', color: '#999', fontSize: '48px' }}>
            🚗
          </div>
        )}
      </div>

      {/* Информация */}
      <div style={contentStyle}>
        <div style={titleStyle}>
          {car.brand} {car.model} {car.generation ? `(${car.generation})` : ''}
        </div>
        
        <div style={infoStyle}>🔢 VIN: {car.vin}</div>
        <div style={infoStyle}>📅 Год: {car.year || 'N/A'}</div>
        <div style={infoStyle}>⚙️ Двигатель: {car.engine_type || 'N/A'} {car.engine_volume ? `${car.engine_volume}L` : ''}</div>
        <div style={infoStyle}>📍 Склад: {car.location_name || 'N/A'}</div>

        <div style={statsStyle}>
          <span style={statStyle}>📦 Запчастей: <strong>{car.parts_count || 0}</strong></span>
          <span style={statStyle}>✅ Доступно: <strong>{car.available_parts || 0}</strong></span>
        </div>

        <div style={badgeStyle}>
          {getStatusLabel(car.status)}
        </div>
      </div>
    </div>
  );
}

export default CarCard;