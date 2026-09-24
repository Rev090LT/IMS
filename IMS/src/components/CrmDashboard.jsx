// IMS/src/pages/CrmDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CrmDashboard({ token }) {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/crm/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard Data Received:', data); // 🔍 ОТЛАДКА
        setDashboard(data);
      } else {
        console.error('API Error:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCardStyle = (color) => ({
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderLeft: `4px solid ${color}`,
  });

  const orderRowStyle = (priority) => ({
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    backgroundColor: priority === 'urgent' ? '#fff5f5' : priority === 'high' ? '#fffaf0' : 'white',
    transition: 'all 0.2s',
  });

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Загрузка CRM...</div>;
  }

  // 🔥 Безопасное получение выручки (гарантируем число)
  const todayRevenue = Number(dashboard?.stats?.today_revenue) || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '20px' }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🔧 CRM Автосервис</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/crm/work-orders/new')}
            style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ➕ Новый заказ-наряд
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ 
              padding: '10px 18px', 
              backgroundColor: '#95a5a6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7f8c8d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#95a5a6'}
          >
            ← На главную
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={statCardStyle('#e74c3c')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{dashboard?.stats?.active_orders || 0}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>🔧 В работе</div>
        </div>
        <div style={statCardStyle('#f39c12')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{dashboard?.stats?.waiting_parts || 0}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>⏳ Ждём запчасти</div>
        </div>
        <div style={statCardStyle('#27ae60')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{dashboard?.stats?.ready_for_pickup || 0}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>✅ Готовы к выдаче</div>
        </div>
        <div style={statCardStyle('#9b59b6')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
            {todayRevenue.toLocaleString('ru-RU')} ₽
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>💰 Выручка сегодня</div>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* 🔥 ИСПРАВЛЕНО: Заказы на сегодня (читаем из today_orders) */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px' }}>📋 Заказы на сегодня</h3>
          {dashboard?.today_orders?.map(order => (
            <div 
              key={order.id} 
              style={orderRowStyle(order.priority || 'normal')}
              onClick={() => navigate(`/crm/work-orders/${order.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{order.order_number}</strong>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {order.brand || 'Авто'} {order.model || ''} • {order.phone || 'Без телефона'}
                  </div>
                  {order.master_name && (
                    <div style={{ fontSize: '12px', color: '#999' }}>👷 {order.master_name}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px',
                    backgroundColor: order.priority === 'urgent' ? '#e74c3c' : order.priority === 'high' ? '#f39c12' : '#95a5a6',
                    color: 'white'
                  }}>
                    {order.priority === 'urgent' ? '🔥 Срочно' : order.priority === 'high' ? '⚡ Высокий' : '📌 Обычный'}
                  </span>
                  {order.promised_at && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      ⏰ {new Date(order.promised_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!dashboard?.today_orders || dashboard.today_orders.length === 0) && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              На сегодня заказов нет 🎉
            </div>
          )}
        </div>

        {/* 🔥 ИСПРАВЛЕНО: Просроченные заказы (читаем из overdue_orders) */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px' }}>⚠️ Просроченные заказы</h3>
          {dashboard?.overdue_orders?.map(order => (
            <div 
              key={order.id} 
              style={{ ...orderRowStyle('urgent'), borderLeft: '3px solid #e74c3c' }}
              onClick={() => navigate(`/crm/work-orders/${order.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{order.order_number}</strong>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {order.brand || 'Авто'} {order.model || ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#e74c3c', fontWeight: '500' }}>
                  +{Math.round(order.hours_overdue || 0)}ч
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                Обещано: {order.promised_at ? new Date(order.promised_at).toLocaleString('ru-RU') : 'Не указано'}
              </div>
            </div>
          ))}
          {(!dashboard?.overdue_orders || dashboard.overdue_orders.length === 0) && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              ✅ Все заказы в срок
            </div>
          )}
        </div>
      </div>

      {/* График выручки */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 15px' }}>📊 Выручка за 7 дней</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '150px', paddingBottom: '10px' }}>
          {dashboard?.revenue_chart?.map((day, idx) => {
            const revenue = Number(day.revenue) || 0;
            const maxRevenue = 50000; // Масштаб графика
            const heightPercent = Math.min((revenue / maxRevenue) * 100, 100);
            
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: revenue > 0 ? '#3498db' : '#ecf0f1', 
                  borderRadius: '4px 4px 0 0',
                  height: `${Math.max(heightPercent, revenue > 0 ? 5 : 2)}%`,
                  transition: 'height 0.3s ease'
                }} />
                <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', fontWeight: '500' }}>
                  {day.label || new Date(day.date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'numeric'})}
                </div>
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {revenue >= 1000 ? `${(revenue / 1000).toFixed(1)}к` : revenue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CrmDashboard;