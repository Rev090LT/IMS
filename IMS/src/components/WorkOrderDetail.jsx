// IMS/src/pages/WorkOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function WorkOrderDetail({ token }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id, token]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/crm/work-orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const response = await fetch(`/api/crm/work-orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchOrder();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Загрузка...</div>;
  if (!order) return <div style={{ padding: '40px', textAlign: 'center' }}>❌ Заказ-наряд не найден</div>;

  const { order: o, items, history, payments } = order;

  const sectionStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '8px',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '20px' }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{o.order_number}</h1>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            Создан: {new Date(o.created_at).toLocaleString('ru-RU')}
          </div>
        </div>
        <div>
          <button onClick={() => navigate(-1)} style={{ ...buttonStyle, backgroundColor: '#95a5a6', color: 'white' }}>
            ← Назад
          </button>
          <button onClick={() => navigate(`/crm/work-orders/${id}/edit`)} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white' }}>
            ✏️ Редактировать
          </button>
        </div>
      </div>

      {/* Статус и приоритет */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Статус:</strong> <span style={{ color: '#27ae60' }}>{o.status}</span>
          </div>
          <div>
            <strong>Приоритет:</strong> <span style={{ color: '#f39c12' }}>{o.priority}</span>
          </div>
          <div>
            <strong>Сумма:</strong> <span style={{ color: '#3498db' }}>{o.final_total?.toLocaleString('ru-RU') || 0} ₽</span>
          </div>
        </div>
        
        {/* Кнопки смены статуса */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {o.status === 'draft' && (
            <button onClick={() => updateStatus('accepted')} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white' }}>
              ✅ Принять в работу
            </button>
          )}
          {o.status === 'accepted' && (
            <button onClick={() => updateStatus('in_progress')} style={{ ...buttonStyle, backgroundColor: '#f39c12', color: 'white' }}>
              🔧 Начать работу
            </button>
          )}
          {o.status === 'in_progress' && (
            <button onClick={() => updateStatus('ready')} style={{ ...buttonStyle, backgroundColor: '#27ae60', color: 'white' }}>
              ✅ Готов к выдаче
            </button>
          )}
          {o.status === 'ready' && (
            <button onClick={() => updateStatus('completed')} style={{ ...buttonStyle, backgroundColor: '#2ecc71', color: 'white' }}>
              🎉 Завершить
            </button>
          )}
        </div>
      </div>

      {/* Информация о клиенте и авто */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px' }}>👤 Клиент</h3>
          <div><strong>Телефон:</strong> {o.phone_primary}</div>
          <div><strong>Уровень лояльности:</strong> {o.loyalty_level}</div>
          <button onClick={() => navigate(`/crm/customers/${o.customer_id}`)} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', marginTop: '10px' }}>
            📋 История клиента
          </button>
        </div>

        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 15px' }}>🚗 Автомобиль</h3>
          <div><strong>Марка:</strong> {o.vehicle_info?.brand || o.info_brand || '—'}</div>
          <div><strong>Модель:</strong> {o.vehicle_info?.model || '—'}</div>
          <div><strong>VIN:</strong> {o.vehicle_vin || '—'}</div>
          <div><strong>Пробег:</strong> {o.vehicle_info?.mileage ? `${o.vehicle_info.mileage} км` : '—'}</div>
        </div>
      </div>

      {/* Жалоба клиента */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 15px' }}>📝 Жалоба клиента</h3>
        <p style={{ margin: 0, padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>{o.complaint}</p>
      </div>

      {/* Позиции заказ-наряда */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 15px' }}>📋 Работы и запчасти</h3>
        {items && items.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Название</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Тип</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Кол-во</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Цена</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Сумма</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid #e0e0e0' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{item.name}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{item.item_type}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{item.unit_price} ₽</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{item.total_price} ₽</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Позиции не добавлены</p>
        )}
      </div>

      {/* История изменений */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 15px' }}>📜 История изменений</h3>
        {history && history.length > 0 ? (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {history.map(h => (
              <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                <strong>{h.field_name}:</strong> {h.old_value} → {h.new_value}
                <span style={{ color: '#999', marginLeft: '10px' }}>
                  {new Date(h.changed_at).toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999' }}>История пуста</p>
        )}
      </div>
    </div>
  );
}

export default WorkOrderDetail;