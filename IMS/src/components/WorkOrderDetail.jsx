// IMS/src/pages/WorkOrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function WorkOrderDetail({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false); // 🔥 Состояние для удаления

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log(`🔍 Fetching order ${id}...`);
        
        const response = await fetch(`/api/crm/work-orders/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          const err = await response.json();
          console.error('❌ API Error:', err);
          throw new Error(err.error || 'Ошибка загрузки');
        }
        
        const data = await response.json();
        console.log('✅ API Response:', JSON.stringify(data, null, 2));
        
        const orderData = data.work_order || data.order || data;
        const itemsData = data.items || [];
        
        console.log('📦 Parsed order:', orderData);
        console.log('📦 Parsed items:', itemsData);
        console.log('🚗 vehicle_info type:', typeof orderData.vehicle_info);
        console.log('🚗 vehicle_info value:', orderData.vehicle_info);
        
        setOrder(orderData);
        setItems(itemsData);
      } catch (err) {
        console.error('❌ Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id, token]);

  // 🔍 Логирование после загрузки данных
  useEffect(() => {
    if (order) {
      console.log('🔄 Order state updated:', order);
      
      const customerName = order?.customer_name || '—';
      const phone = order?.customer_phone || order?.phone_primary || '—';
      const loyaltyLevel = order?.customer_loyalty_level || order?.loyalty_level || '—';
      
      const vehicleRaw = order?.vehicle_info;
      const vehicle = typeof vehicleRaw === 'string' 
        ? (() => { try { return JSON.parse(vehicleRaw); } catch { return {}; } })()
        : (vehicleRaw || {});
      
      const vehicleBrand = vehicle?.brand || order?.brand || '—';
      const vehicleModel = vehicle?.model || order?.model || '—';
      
      console.log('🧩 Extracted values:');
      console.log('  - orderNumber:', order?.order_number || `#${order?.id}`);
      console.log('  - customerName:', customerName);
      console.log('  - vehicleBrand:', vehicleBrand);
      console.log('  - vehicleModel:', vehicleModel);
      console.log('  - hasVehicleData:', [vehicleBrand, vehicleModel].some(v => v !== '—'));
    }
    
    if (items && items.length > 0) {
      console.log('🔧 Items count:', items.length);
      console.log('🔧 First item:', items[0]);
    }
  }, [order, items]);

  // 🔧 Функция удаления заказ-наряда
  const handleDeleteOrder = async () => {
    if (!window.confirm(`⚠️ Удалить заказ-наряд №${order?.order_number || id}?\n\nЭто действие нельзя отменить.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/crm/work-orders/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        alert('✅ Заказ-наряд успешно удалён');
        navigate('/crm/work-orders', { state: { refreshed: true, message: 'Заказ-наряд удалён' } });
      } else {
        const err = await response.json();
        alert(`❌ Ошибка: ${err.error || 'Не удалось удалить заказ-наряд'}`);
      }
    } catch (err) {
      console.error('❌ Error deleting order:', err);
      alert('❌ Ошибка сети при удалении. Проверьте подключение.');
    } finally {
      setDeleting(false);
    }
  };

  // 🔧 Функция перехода к редактированию
  const handleEditOrder = () => {
    navigate(`/crm/work-orders/${id}/edit`);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
        {error}
        <button 
          onClick={() => navigate('/crm/work-orders')}
          style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Назад к списку
        </button>
      </div>
    );
  }

  // 🔧 Безопасное извлечение данных
  const orderNumber = order?.order_number || `#${order?.id}`;
  const status = order?.status || '—';
  const customerName = order?.customer_name || '—';
  const phone = order?.phone_primary || order?.customer_phone || '—';
  const complaint = order?.complaint || order?.description || '—';
  const finalTotal = order?.final_total || order?.total_cost || 0;

  const parseDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
  };
  const parseDateTime = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU');
  };

  const createdAt = parseDate(order?.created_at);
  const promisedAt = parseDate(order?.promised_at);
  const startedAt = parseDateTime(order?.started_at);
  const completedAt = parseDateTime(order?.completed_at);
  const assignedMaster = order?.assigned_master || order?.master_id || '—';
  const assignedBay = order?.assigned_bay || '—';
  
  // 🔧 Автомобиль: обработка JSONB
  const vehicleRaw = order?.vehicle_info;
  const vehicle = typeof vehicleRaw === 'string' 
    ? (() => { try { return JSON.parse(vehicleRaw); } catch { return {}; } })()
    : (vehicleRaw || {});

  const vehicleBrand = vehicle?.brand || order?.brand || '—';
  const vehicleModel = vehicle?.model || order?.model || '—';
  const vehicleVin = vehicle?.vin || order?.vin || '—';
  const vehicleYear = vehicle?.year || order?.year || '—';
  const vehiclePlate = vehicle?.license_plate || order?.license_plate || '—';

  const hasVehicleData = [vehicleBrand, vehicleModel, vehicleVin, vehicleYear, vehiclePlate]
    .some(val => val && val !== '—');

  const hasExecutionData = !!(order?.assigned_master || order?.assigned_bay || order?.started_at);

  const getStatusColor = (status) => {
    const colors = {
      draft: '#95a5a6',
      accepted: '#3498db',
      in_progress: '#f39c12',
      waiting_parts: '#e67e22',
      ready: '#27ae60',
      completed: '#229954',
      cancelled: '#e74c3c'
    };
    return colors[status?.toLowerCase()] || '#95a5a6';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 🔹 Заголовок с кнопками управления */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📋 Заказ-наряд №{orderNumber}</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>
            Создан: {createdAt} • Обещан к: {promisedAt}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Статус */}
          <span style={{ 
            padding: '6px 12px', 
            backgroundColor: getStatusColor(status), 
            color: 'white', 
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center'
          }}>
            ● {status}
          </span>
          
          {/* ✏️ Кнопка редактирования */}
          <button 
            onClick={handleEditOrder}
            style={{ 
              padding: '10px 18px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
          >
            ✏️ Редактировать
          </button>
          
          {/* 🗑️ Кнопка удаления */}
          <button 
            onClick={handleDeleteOrder}
            disabled={deleting}
            style={{ 
              padding: '10px 18px', 
              backgroundColor: deleting ? '#95a5a6' : '#e74c3c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!deleting) e.currentTarget.style.backgroundColor = '#c0392b';
            }}
            onMouseLeave={(e) => {
              if (!deleting) e.currentTarget.style.backgroundColor = '#e74c3c';
            }}
          >
            {deleting ? '⏳...' : '🗑️ Удалить'}
          </button>
          
          {/* ← Назад */}
          <button 
            onClick={() => navigate('/crm/work-orders')}
            style={{ 
              padding: '10px 18px', 
              backgroundColor: '#95a5a6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7f8c8d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#95a5a6'}
          >
            ← Назад
          </button>
        </div>
      </div>

      {/* 🔹 Основная информация */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px', fontSize: '18px' }}>ℹ️ Информация о клиенте</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#666' }}>Клиент</label>
            <div style={{ fontWeight: '500' }}>{customerName}</div>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#666' }}>Телефон</label>
            <div style={{ fontWeight: '500' }}>{phone}</div>
          </div>
          {order?.loyalty_level && (
            <div>
              <label style={{ fontSize: '13px', color: '#666' }}>Лояльность</label>
              <div style={{ fontWeight: '500' }}>
                {order.loyalty_level === 'gold' ? '🥇' : order.loyalty_level === 'silver' ? '🥈' : '🥉'} {order.loyalty_level}
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize: '13px', color: '#666' }}>Сумма</label>
            <div style={{ fontWeight: '500', color: '#27ae60', fontSize: '18px' }}>{Number(finalTotal).toLocaleString('ru-RU')} ₽</div>
          </div>
        </div>
      </div>

      {/* 🔹 Автомобиль */}
      {hasVehicleData && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 15px', fontSize: '18px' }}>🚗 Автомобиль</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            {vehicleBrand !== '—' && (
              <div>
                <label style={{ fontSize: '13px', color: '#666' }}>Марка</label>
                <div style={{ fontWeight: '500' }}>{vehicleBrand}</div>
              </div>
            )}
            {vehicleModel !== '—' && (
              <div>
                <label style={{ fontSize: '13px', color: '#666' }}>Модель</label>
                <div style={{ fontWeight: '500' }}>{vehicleModel}</div>
              </div>
            )}
            {vehicleVin !== '—' && (
              <div>
                <label style={{ fontSize: '13px', color: '#666' }}>VIN</label>
                <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{vehicleVin}</div>
              </div>
            )}
            {vehicleYear !== '—' && (
              <div>
                <label style={{ fontSize: '13px', color: '#666' }}>Год</label>
                <div style={{ fontWeight: '500' }}>{vehicleYear}</div>
              </div>
            )}
            {vehiclePlate !== '—' && (
              <div>
                <label style={{ fontSize: '13px', color: '#666' }}>Госномер</label>
                <div style={{ fontWeight: '500' }}>{vehiclePlate}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Детали выполнения */}
      {hasExecutionData && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 15px', fontSize: '18px' }}>⚙️ Детали выполнения</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#666' }}>Начало работ</label>
              <div style={{ fontWeight: '500' }}>{startedAt}</div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#666' }}>Завершение</label>
              <div style={{ fontWeight: '500' }}>{completedAt}</div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#666' }}>Мастер</label>
              <div style={{ fontWeight: '500' }}>№{assignedMaster}</div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#666' }}>Пост</label>
              <div style={{ fontWeight: '500' }}>{assignedBay || '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Жалоба */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px', fontSize: '18px' }}>📝 Жалоба клиента</h2>
        <p style={{ margin: 0, color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{complaint}</p>
      </div>

      {/* 🔹 Элементы заказ-наряда */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px', fontSize: '18px' }}>🔧 Работы и запчасти</h2>
        {items.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Нет элементов</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Наименование</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Категория</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Артикул</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Кол-во</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Ед.</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Нормо-часы</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Цена</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Сумма</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isPart = item.part_number || item.item_type === 'part';
                  const isWork = item.service_id || item.labor_hours > 0 || item.item_type === 'labor';
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: isPart ? '#fff5f5' : 'white' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '500' }}>{item.name || item.service_name || '—'}</div>
                        {item.notes && (
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{item.notes}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {item.category && (
                          <span style={{ backgroundColor: '#ebf5fb', color: '#2980b9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {item.part_number && (
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{item.part_number}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{item.quantity || 1}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{item.unit || (isPart ? 'шт' : 'усл')}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{item.labor_hours || item.service_labor_hours || '—'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Number(item.unit_price || 0).toLocaleString('ru-RU')} ₽</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#27ae60' }}>
                        {Number(item.total_price || 0).toLocaleString('ru-RU')} ₽
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {item.status && (
                          <span style={{ 
                            padding: '2px 8px', 
                            backgroundColor: getStatusColor(item.status), 
                            color: 'white', 
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}>
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default WorkOrderDetail;