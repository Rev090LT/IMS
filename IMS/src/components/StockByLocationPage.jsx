// IMS/src/pages/StockByLocationPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StockByLocationPage({ token }) {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  useEffect(() => {
    fetchStockData();
  }, [token]);

  const fetchStockData = async () => {
    try {
      const response = await fetch('/api/stock/by-locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStockData(data);
      } else {
        console.error('Error fetching stock data');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Получаем уникальные склады
  const locations = [...new Set(stockData.map(item => item.location_name))].filter(Boolean);

  // Фильтрация данных
  const filteredData = stockData.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.qr_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.part_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = selectedLocation === 'all' || item.location_name === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  // Группировка по товарам
  const groupedByItem = filteredData.reduce((acc, item) => {
    if (!acc[item.qr_code]) {
      acc[item.qr_code] = {
        qr_code: item.qr_code,
        name: item.name,
        part_number: item.part_number,
        locations: []
      };
    }
    acc[item.qr_code].locations.push({
      location_name: item.location_name,
      quantity: item.quantity,
      updated_at: item.updated_at
    });
    return acc;
  }, {});

  const itemsList = Object.values(groupedByItem);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        Загрузка данных об остатках...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📦 Остатки по складам</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Просмотр остатков товаров по всем складам
          </p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#95a5a6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Назад
        </button>
      </div>

      {/* Фильтры */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          
          {/* Поиск */}
          <div>
            <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              🔍 Поиск по названию, QR-коду или артикулу
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Введите для поиска..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Фильтр по складу */}
          <div>
            <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              🏭 Фильтр по складу
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">Все склады</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Таблица остатков */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        
        {itemsList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <p>Товары не найдены</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Наименование</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>QR-код</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Артикул</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Склад</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#555', width: '100px' }}>Количество</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Обновлено</th>
                </tr>
              </thead>
              <tbody>
                {itemsList.map((item, index) => (
                  <React.Fragment key={item.qr_code}>
                    {item.locations.map((loc, locIndex) => (
                      <tr 
                        key={`${item.qr_code}-${loc.location_name}`}
                        style={{ 
                          borderBottom: '1px solid #eee',
                          backgroundColor: locIndex === 0 && item.locations.length > 1 ? '#f9f9f9' : 'white'
                        }}
                      >
                        {locIndex === 0 && (
                          <>
                            <td 
                              rowSpan={item.locations.length}
                              style={{ padding: '10px 8px', verticalAlign: 'middle', fontWeight: '500' }}
                            >
                              {item.name}
                            </td>
                            <td 
                              rowSpan={item.locations.length}
                              style={{ padding: '10px 8px', verticalAlign: 'middle', fontFamily: 'monospace', fontSize: '12px', color: '#666' }}
                            >
                              {item.qr_code}
                            </td>
                            <td 
                              rowSpan={item.locations.length}
                              style={{ padding: '10px 8px', verticalAlign: 'middle', color: '#666' }}
                            >
                              {item.part_number || '—'}
                            </td>
                          </>
                        )}
                        <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                          {loc.location_name || 'Неизвестно'}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '600' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: loc.quantity > 0 ? '#d4edda' : '#f8d7da',
                            color: loc.quantity > 0 ? '#155724' : '#721c24',
                            fontSize: '13px'
                          }}>
                            {loc.quantity} шт
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'middle', color: '#666', fontSize: '12px' }}>
                          {loc.updated_at ? new Date(loc.updated_at).toLocaleString('ru-RU') : '—'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Итоговая статистика */}
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-around',
        fontSize: '14px'
      }}>
        <div>
          <strong>Всего товаров:</strong> {itemsList.length}
        </div>
        <div>
          <strong>Всего складов:</strong> {locations.length}
        </div>
        <div>
          <strong>Общий остаток:</strong> {filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0)} шт
        </div>
      </div>

    </div>
  );
}

export default StockByLocationPage;