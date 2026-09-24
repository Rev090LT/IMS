// IMS/src/pages/WorkOrdersList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WorkOrdersList({ token }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    master: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [token, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/crm/work-orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Безопасное извлечение массива
        const ordersArray = Array.isArray(data) 
          ? data 
          : Array.isArray(data?.work_orders) 
            ? data.work_orders 
            : Array.isArray(data?.orders) 
              ? data.orders 
              : [];
        
        setOrders(ordersArray);
      } else {
        console.error('API Error:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#95a5a6',
      'accepted': '#3498db',
      'in_progress': '#f39c12',
      'waiting_parts': '#e67e22',
      'ready': '#27ae60',
      'completed': '#2ecc71',
      'cancelled': '#e74c3c',
      'archived': '#7f8c8d',
      'closed': '#34495e'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': '📝 Черновик',
      'accepted': '✅ Принят',
      'in_progress': '🔧 В работе',
      'waiting_parts': '⏳ Ждём запчасти',
      'ready': '✅ Готов к выдаче',
      'completed': '✔️ Завершён',
      'closed': '🔒 Закрыт',
      'cancelled': '❌ Отменён',
      'archived': '📁 Архив'
    };
    return labels[status] || status || '—';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'low': { color: '#95a5a6', label: '📌 Низкий' },
      'normal': { color: '#3498db', label: '📌 Обычный' },
      'high': { color: '#f39c12', label: '⚡ Высокий' },
      'urgent': { color: '#e74c3c', label: '🔥 Срочно' }
    };
    return badges[priority] || badges['normal'];
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  };

  const filtersStyle = {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  };

  const tableStyle = {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: '600',
    color: '#666',
    fontSize: '13px',
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '14px',
  };

  const badgeStyle = (color) => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: color,
  });

  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div style={containerStyle}>
      {/* Заголовок */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>📋 Заказ-наряды</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/crm/work-orders/new')}
            style={{ padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            ➕ Новый заказ-наряд
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ padding: '10px 18px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            ← Назад
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="🔍 Поиск по номеру, жалобе или клиенту..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={inputStyle}
        >
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="accepted">Принят</option>
          <option value="in_progress">В работе</option>
          <option value="waiting_parts">Ждём запчасти</option>
          <option value="ready">Готов к выдаче</option>
          <option value="completed">Завершён</option>
          <option value="closed">Закрыт</option>
          <option value="cancelled">Отменён</option>
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          style={inputStyle}
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          style={inputStyle}
        />
        <button
          onClick={() => setFilters({ status: '', search: '', date_from: '', date_to: '' })}
          style={{ ...inputStyle, backgroundColor: '#95a5a6', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          🔄 Сброс
        </button>
      </div>

      {/* Таблица */}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Номер</th>
              <th style={thStyle}>Клиент</th>
              <th style={thStyle}>Авто</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Приоритет</th>
              <th style={thStyle}>Мастер</th>
              <th style={thStyle}>Сумма</th>
              <th style={thStyle}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>
                  ⏳ Загрузка...
                </td>
              </tr>
            ) : safeOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#999' }}>
                  Заказ-наряды не найдены
                </td>
              </tr>
            ) : (
              safeOrders.map(order => {
                const priority = getPriorityBadge(order?.priority || 'normal');
                const vehicle = order?.vehicle_info || {};
                
                // 🔥 ИСПРАВЛЕНО: Берем customer_name вместо customer_phone
                const customerName = order?.customer_name || 'Без клиента';
                const customerPhone = order?.customer_phone || '—';
                const loyaltyLevel = order?.loyalty_level;
                
                return (
                  <tr
                    key={order?.id || Math.random()}
                    onClick={() => order?.id && navigate(`/crm/work-orders/${order.id}`)}
                    style={{ cursor: order?.id ? 'pointer' : 'default', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#2c3e50' }}>
                      {order?.order_number || '—'}
                    </td>
                    
                    {/* 🔥 ИСПРАВЛЕННАЯ КОЛОНКА КЛИЕНТА */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '500', color: '#2c3e50' }}>
                        {customerName}
                        {loyaltyLevel && loyaltyLevel !== 'bronze' && (
                          <span style={{ marginLeft: '6px', fontSize: '12px' }}>
                            {loyaltyLevel === 'gold' ? '🥇' : loyaltyLevel === 'silver' ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                      {customerPhone !== '—' && (
                        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                          {customerPhone}
                        </div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      {vehicle?.brand || '—'} {vehicle?.model || ''} {vehicle?.year ? `(${vehicle.year})` : ''}
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(getStatusColor(order?.status))}>
                        {getStatusLabel(order?.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(priority.color)}>{priority.label}</span>
                    </td>
                    <td style={tdStyle}>
                      {order?.assigned_master_name || order?.master_name || 'Не назначен'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#27ae60' }}>
                      {order?.final_total ? `${Number(order.final_total).toLocaleString('ru-RU')} ₽` : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#666', fontSize: '13px' }}>
                      {order?.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkOrdersList;