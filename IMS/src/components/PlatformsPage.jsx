// IMS/src/pages/PlatformsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PlatformsPage({ token }) {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [platformsRes, statsRes] = await Promise.all([
        fetch('/api/platforms', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/platforms/stats/summary', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (platformsRes.ok) setPlatforms(await platformsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const manufacturers = [...new Set(platforms.map(p => p.manufacturer))].sort();

  const filteredPlatforms = platforms.filter(p => {
    const matchesSearch = search === '' || 
      p.platform_name.toLowerCase().includes(search.toLowerCase()) ||
      p.platform_code.toLowerCase().includes(search.toLowerCase());
    const matchesManufacturer = filterManufacturer === '' || p.manufacturer === filterManufacturer;
    return matchesSearch && matchesManufacturer;
  });

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
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  };

  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
  const thStyle = { textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' };
  const tdStyle = { padding: '12px', borderBottom: '1px solid #f0f0f0' };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>🏗️ Платформы автомобилей</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          ← Назад
        </button>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', padding: '20px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>{platforms.length}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Всего платформ</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{manufacturers.length}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>Производителей</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f39c12' }}>
            {stats.reduce((sum, s) => sum + (s.cars_count || 0), 0)}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>Авто на платформах</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="🔍 Поиск платформы..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
        />
        <select
          value={filterManufacturer}
          onChange={(e) => setFilterManufacturer(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
        >
          <option value="">Все производители</option>
          {manufacturers.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={cardStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Загрузка...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Код</th>
                    <th style={thStyle}>Название</th>
                    <th style={thStyle}>Производитель</th>
                    <th style={thStyle}>Годы</th>
                    <th style={thStyle}>Авто</th>
                    <th style={thStyle}>Описание</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlatforms.map(p => {
                    const stat = stats.find(s => s.platform_code === p.platform_code);
                    return (
                      <tr key={p.platform_code}>
                        <td style={tdStyle}><strong>{p.platform_code}</strong></td>
                        <td style={tdStyle}>{p.platform_name}</td>
                        <td style={tdStyle}>{p.manufacturer}</td>
                        <td style={tdStyle}>{p.years_active?.[0] || '?'}-{p.years_active?.[1] || '?'}</td>
                        <td style={tdStyle}>{stat?.cars_count || 0}</td>
                        <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlatformsPage;