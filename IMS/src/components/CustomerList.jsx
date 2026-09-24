// IMS/src/components/CustomerList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CustomerList({ token }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [token, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, limit: 100 });
      const response = await fetch(`/api/crm/customers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLoyaltyBadge = (level) => {
    const badges = {
      'bronze': { color: '#cd7f32', label: '🥉 Бронза' },
      'silver': { color: '#c0c0c0', label: '🥈 Серебро' },
      'gold': { color: '#ffd700', label: '🥇 Золото' },
      'platinum': { color: '#e5e4e2', label: '💎 Платина' }
    };
    return badges[level] || badges['bronze'];
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>👥 Клиенты</h1>
        <button onClick={() => navigate('/crm/customers/new')} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          ➕ Добавить клиента
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Поиск по телефону или имени..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '20px' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>⏳ Загрузка...</div>
        ) : customers.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>Клиенты не найдены</div>
        ) : (
          customers.map(c => {
            const badge = getLoyaltyBadge(c.loyalty_level);
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/crm/customers/${c.id}`)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '16px' }}>{c.counterparty_name || c.phone_primary}</strong>
                  <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', color: 'white', backgroundColor: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>📞 {c.phone_primary}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>📧 {c.email || '—'}</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                  📦 Посещений: <strong>{c.total_visits || 0}</strong> • 💰 Потрачено: <strong>{c.total_spent?.toLocaleString('ru-RU') || 0} ₽</strong>
                </div>
                {c.last_visit_date && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Последний визит: {new Date(c.last_visit_date).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CustomerList; // ← ОБЯЗАТЕЛЬНО!