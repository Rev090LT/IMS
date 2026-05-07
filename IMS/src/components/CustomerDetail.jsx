// IMS/src/components/CustomerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function CustomerDetail({ token }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [id, token]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/crm/customers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Загрузка...</div>;
  if (!customer) return <div style={{ padding: '40px', textAlign: 'center' }}>❌ Клиент не найден</div>;

  const { customer: c, recent_orders } = customer;

  const sectionStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>👤 {c.counterparty_name || c.phone_primary}</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          ← Назад
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Контакты */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px' }}>📞 Контакты</h3>
          <div><strong>Телефон:</strong> {c.phone_primary}</div>
          {c.phone_secondary && <div><strong>Доп. телефон:</strong> {c.phone_secondary}</div>}
          <div><strong>Email:</strong> {c.email || '—'}</div>
          {c.telegram && <div><strong>Telegram:</strong> {c.telegram}</div>}
          <div><strong>Предпочтительный способ связи:</strong> {c.preferred_contact_method}</div>
        </div>

        {/* Статистика */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px' }}>📊 Статистика</h3>
          <div><strong>Уровень лояльности:</strong> {c.loyalty_level}</div>
          <div><strong>Всего посещений:</strong> {c.total_visits}</div>
          <div><strong>Всего потрачено:</strong> {c.total_spent?.toLocaleString('ru-RU') || 0} ₽</div>
          <div><strong>Средний чек:</strong> {c.avg_check?.toLocaleString('ru-RU') || 0} ₽</div>
          <div><strong>Последний визит:</strong> {c.last_visit_date ? new Date(c.last_visit_date).toLocaleDateString('ru-RU') : '—'}</div>
        </div>
      </div>

      {/* История заказов */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 15px' }}>📋 История заказов ({recent_orders?.length || 0})</h3>
        {recent_orders && recent_orders.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Номер</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Дата</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Статус</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {recent_orders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/crm/work-orders/${order.id}`)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{order.order_number}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{order.status}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{order.final_total?.toLocaleString('ru-RU') || 0} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Заказов нет</p>
        )}
      </div>
    </div>
  );
}

export default CustomerDetail; // ← ОБЯЗАТЕЛЬНО!