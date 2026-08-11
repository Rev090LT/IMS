// IMS/src/components/CarsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CarCard from './CarCard';
import AddCarModal from './AddCarModal';

function CarsPage({ token }) {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchCars();
  }, [token]);

  const fetchCars = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterBrand) params.append('brand', filterBrand);
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/cars?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch cars');
      const data = await response.json();
      setCars(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCarAdded = () => {
    setShowAddModal(false);
    fetchCars();
  };

  const filteredCars = cars.filter(car => {
    const matchesSearch = searchTerm === '' || 
      car.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = filterBrand === '' || car.brand === filterBrand;
    const matchesStatus = filterStatus === '' || car.status === filterStatus;

    return matchesSearch && matchesBrand && matchesStatus;
  });

  // Статистика
  const stats = {
    total: cars.length,
    active: cars.filter(c => c.status === 'active').length,
    dismantling: cars.filter(c => c.status === 'dismantling').length,
    completed: cars.filter(c => c.status === 'completed').length,
  };

  // Уникальные бренды для фильтра
  const brands = [...new Set(cars.map(c => c.brand))].sort();

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

  const filtersStyle = {
    backgroundColor: 'white',
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const inputStyle = {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minWidth: '200px',
  };

  const selectStyle = {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    padding: '20px',
  };

  const statBoxStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  };

  const statNumberStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3498db',
  };

  const statLabelStyle = {
    fontSize: '13px',
    color: '#666',
    marginTop: '5px',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    padding: '20px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  };

  return (
    <div style={pageStyle} className="page-transition">
      {/* Шапка */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>🚗 Автомобили в разборе</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{ ...headerButtonStyle, backgroundColor: '#95a5a6' }}
          >
            {viewMode === 'grid' ? '📋 Список' : '🔲 Сетка'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={headerButtonStyle}
          >
            ➕ Добавить авто
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ ...headerButtonStyle, backgroundColor: '#e74c3c' }}
          >
            ← Назад
          </button>
        </div>
      </header>

      {/* Фильтры */}
      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="🔍 Поиск по VIN, марке, модели..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={selectStyle}>
          <option value="">Все марки</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">Все статусы</option>
          <option value="active">🟢 В разборе</option>
          <option value="dismantling">🟡 Разбирается</option>
          <option value="completed">🔴 Разобран</option>
        </select>
      </div>

      {/* Статистика */}
      <div style={statsStyle}>
        <div style={statBoxStyle}>
          <div style={statNumberStyle}>{stats.total}</div>
          <div style={statLabelStyle}>Всего авто</div>
        </div>
        <div style={{ ...statBoxStyle, borderLeft: '4px solid #27ae60' }}>
          <div style={{ ...statNumberStyle, color: '#27ae60' }}>{stats.active}</div>
          <div style={statLabelStyle}>В разборе</div>
        </div>
        <div style={{ ...statBoxStyle, borderLeft: '4px solid #f39c12' }}>
          <div style={{ ...statNumberStyle, color: '#f39c12' }}>{stats.dismantling}</div>
          <div style={statLabelStyle}>Разбирается</div>
        </div>
        <div style={{ ...statBoxStyle, borderLeft: '4px solid #e74c3c' }}>
          <div style={{ ...statNumberStyle, color: '#e74c3c' }}>{stats.completed}</div>
          <div style={statLabelStyle}>Разобрано</div>
        </div>
      </div>

      {/* Список автомобилей */}
      {loading ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <p>Загрузка автомобилей...</p>
        </div>
      ) : error ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>❌</div>
          <p>{error}</p>
        </div>
      ) : filteredCars.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚗</div>
          <p>Автомобили не найдены</p>
          <button onClick={() => setShowAddModal(true)} style={{ ...headerButtonStyle, marginTop: '15px' }}>
            ➕ Добавить первый автомобиль
          </button>
        </div>
      ) : (
        <div style={viewMode === 'grid' ? gridStyle : { padding: '20px' }}>
          {filteredCars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              token={token}
              onViewDetails={() => navigate(`/cars/${car.id}`)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Модальное окно добавления */}
      {showAddModal && (
        <div className="modal-overlay">
          <AddCarModal
            onClose={() => setShowAddModal(false)}
            token={token}
            onCarAdded={handleCarAdded}
          />
        </div>
      )}
    </div>
  );
}

export default CarsPage;