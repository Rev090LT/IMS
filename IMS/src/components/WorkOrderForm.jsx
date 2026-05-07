// IMS/src/pages/WorkOrderForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ServiceSelectorModal from '../components/ServiceSelectorModal';

function WorkOrderForm({ token, orderId = null }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_info: { brand: '', model: '', year: '', vin: '', mileage: '' },
    complaint: '',
    diagnostics: '',
    priority: 'normal',
    assigned_master: '',
    promised_at: '',
    status: 'draft'
  });

  const [workItems, setWorkItems] = useState([]);
  const [partsItems, setPartsItems] = useState([]);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, servicesRes, mastersRes] = await Promise.all([
          fetch('/api/crm/customers?limit=200', { 
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/services?active=true&limit=500', { 
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/users?role=master', { 
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (customersRes.ok) setCustomers(await customersRes.json());
        if (servicesRes.ok) setServices(await servicesRes.json());
        if (mastersRes.ok) setMasters(await mastersRes.json());

        if (orderId) {
          const orderRes = await fetch(`/api/crm/work-orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (orderRes.ok) {
            const data = await orderRes.json();
            setOrder(data.order);
            setFormData({
              customer_id: data.order.customer_id || '',
              vehicle_info: data.order.vehicle_info || {},
              complaint: data.order.complaint || '',
              diagnostics: data.order.diagnostics || '',
              priority: data.order.priority || 'normal',
              assigned_master: data.order.assigned_master || '',
              promised_at: data.order.promised_at?.slice(0, 16) || '',
              status: data.order.status || 'draft'
            });
            if (data.order.work_items) setWorkItems(data.order.work_items);
            if (data.order.parts_items) setPartsItems(data.order.parts_items);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, orderId]);

  // Подсчёт итогов
  const totals = useMemo(() => {
    const laborTotal = workItems.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    const partsTotal = partsItems.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    return {
      labor: laborTotal,
      parts: partsTotal,
      total: laborTotal + partsTotal
    };
  }, [workItems, partsItems]);

  // Обработчики для работ
  const addWorkItem = (template = {}) => {
    setWorkItems([...workItems, {
      id: Date.now() + Math.random(),
      service_id: template.service_id || null,
      name: template.name || '',
      category: template.category || '',
      quantity: template.quantity || 1,
      unit: template.unit || 'усл',
      unit_price: template.unit_price || 0,
      labor_hours: template.labor_hours || 0,
      total_price: template.unit_price || 0,
      status: 'pending',
      notes: '',
      ...template
    }]);
  };

  const updateWorkItem = (id, field, value) => {
    setWorkItems(items => items.map(item => 
      item.id === id 
        ? { ...item, [field]: value, total_price: field === 'quantity' || field === 'unit_price' 
            ? (field === 'quantity' ? value : item.quantity) * (field === 'unit_price' ? value : item.unit_price) 
            : item.total_price }
        : item
    ));
  };

  const removeWorkItem = (id) => {
    setWorkItems(items => items.filter(item => item.id !== id));
  };

  // Обработчики для запчастей
  const addPartItem = (template = {}) => {
    setPartsItems([...partsItems, {
      id: Date.now() + Math.random(),
      part_id: template.part_id || null,
      name: template.name || '',
      article: template.article || '',
      quantity: template.quantity || 1,
      unit: template.unit || 'шт',
      unit_price: template.unit_price || 0,
      total_price: template.unit_price || 0,
      warehouse_location: '',
      status: 'pending',
      ...template
    }]);
  };

  const updatePartItem = (id, field, value) => {
    setPartsItems(items => items.map(item => 
      item.id === id 
        ? { ...item, [field]: value, total_price: field === 'quantity' || field === 'unit_price' 
            ? (field === 'quantity' ? value : item.quantity) * (field === 'unit_price' ? value : item.unit_price) 
            : item.total_price }
        : item
    ));
  };

  const removePartItem = (id) => {
    setPartsItems(items => items.filter(item => item.id !== id));
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.vehicle_info.brand || !formData.complaint) {
      alert('⚠️ Заполните обязательные поля: клиент, марка авто и жалоба');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...formData,
        work_items: workItems,
        parts_items: partsItems,
        totals: { ...totals, currency: 'RUB' }
      };

      const url = orderId 
        ? `/api/crm/work-orders/${orderId}`
        : '/api/crm/work-orders';
      const method = orderId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        navigate(`/crm/work-orders/${data.work_order?.id || orderId}`, { 
          state: { saved: true } 
        });
      } else {
        const err = await response.json();
        alert(`❌ Ошибка: ${err.message || 'Не удалось сохранить'}`);
      }
    } catch (err) {
      console.error('Error saving order:', err);
      alert('❌ Ошибка сети. Проверьте подключение.');
    } finally {
      setSaving(false);
    }
  };

  // Группировка услуг по категориям для селектора
  const servicesByCategory = useMemo(() => {
    const grouped = {};
    services.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [services]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        Загрузка данных...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      {/* Заголовок */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            {orderId ? '✏️ Редактировать заказ-наряд' : '➕ Новый заказ-наряд'}
          </h1>
          {order && (
            <span style={{ fontSize: '14px', color: '#666' }}>
              №{order.order_number} • {new Date(order.created_at).toLocaleDateString('ru-RU')}
            </span>
          )}
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 👤 Клиент */}
        <Card title="👤 Клиент">
          <select
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Выберите клиента...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.counterparty_name || 'Частное лицо'} • {c.phone_primary}
                {c.loyalty_level && c.loyalty_level !== 'bronze' && ` • ${getLoyaltyEmoji(c.loyalty_level)} ${c.loyalty_level}`}
              </option>
            ))}
          </select>
        </Card>

        {/* 🚗 Автомобиль */}
        <Card title="🚗 Автомобиль">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <Input 
              label="Марка *" 
              value={formData.vehicle_info.brand || ''} 
              onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, brand: v }})} 
              required 
            />
            <Input 
              label="Модель *" 
              value={formData.vehicle_info.model || ''} 
              onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, model: v }})} 
              required 
            />
            <Input 
              label="Год" 
              type="number"
              value={formData.vehicle_info.year || ''} 
              onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, year: v }})} 
            />
            <Input 
              label="Пробег, км" 
              type="number"
              value={formData.vehicle_info.mileage || ''} 
              onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, mileage: v }})} 
            />
            <Input 
              label="VIN" 
              value={formData.vehicle_info.vin || ''} 
              onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, vin: v }})} 
              style={{ gridColumn: 'span 2' }}
            />
          </div>
        </Card>

        {/* 📝 Жалоба и диагностика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <Card title="📝 Жалоба клиента *">
            <textarea
              value={formData.complaint}
              onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
              placeholder="Опишите проблему: стуки, вибрация, ошибки на панели..."
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              required
            />
          </Card>
          <Card title="🔍 Диагностика (после осмотра)">
            <textarea
              value={formData.diagnostics}
              onChange={(e) => setFormData({ ...formData, diagnostics: e.target.value })}
              placeholder="Результаты диагностики, выявленные неисправности..."
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </Card>
        </div>

        {/* ⚙️ Параметры заказа */}
        <Card title="⚙️ Параметры">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Приоритет</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} style={inputStyle}>
                <option value="normal">📌 Обычный</option>
                <option value="high">⚡ Высокий</option>
                <option value="urgent">🔥 Срочный</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Мастер</label>
              <select value={formData.assigned_master} onChange={(e) => setFormData({ ...formData, assigned_master: e.target.value })} style={inputStyle}>
                <option value="">Не назначен</option>
                {masters.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name || m.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Обещать к</label>
              <input type="datetime-local" value={formData.promised_at} onChange={(e) => setFormData({ ...formData, promised_at: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Статус</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={inputStyle}>
                <option value="draft">📄 Черновик</option>
                <option value="in_progress">🔧 В работе</option>
                <option value="waiting_parts">📦 Ждём запчасти</option>
                <option value="ready">✅ Готов</option>
                <option value="closed">🔒 Закрыт</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 🔧 Работы */}
        <Card title="🔧 Работы">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <strong>Добавленные работы</strong>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowServiceSelector(true)} style={{ ...btnStyle, backgroundColor: '#9b59b6' }}>
                📚 Из справочника
              </button>
              <button type="button" onClick={() => addWorkItem()} style={{ ...btnStyle, backgroundColor: '#3498db' }}>
                ➕ Вручную
              </button>
            </div>
          </div>

          {workItems.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
              Работы не добавлены. Нажмите "Из справочника" или "Вручную"
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                    <th style={thStyle}>Услуга</th>
                    <th style={thStyle}>Категория</th>
                    <th style={{ ...thStyle, width: '80px' }}>Кол-во</th>
                    <th style={{ ...thStyle, width: '100px' }}>Цена</th>
                    <th style={{ ...thStyle, width: '100px' }}>Сумма</th>
                    <th style={{ ...thStyle, width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {workItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>
                        <input 
                          value={item.name} 
                          onChange={(e) => updateWorkItem(item.id, 'name', e.target.value)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }}
                          placeholder="Название работы"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          value={item.category || ''} 
                          onChange={(e) => updateWorkItem(item.id, 'category', e.target.value)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }}
                          placeholder="Категория"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="0.1"
                          value={item.quantity} 
                          onChange={(e) => updateWorkItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '70px' }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={item.unit_price} 
                          onChange={(e) => updateWorkItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '90px' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>
                        {(item.quantity * item.unit_price).toLocaleString('ru-RU')} ₽
                      </td>
                      <td style={tdStyle}>
                        <button type="button" onClick={() => removeWorkItem(item.id)} style={{ 
                          background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' 
                        }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 🔩 Запчасти */}
        <Card title="🔩 Запчасти">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <strong>Добавленные запчасти</strong>
            <button type="button" onClick={() => addPartItem()} style={{ ...btnStyle, backgroundColor: '#e67e22' }}>
              ➕ Добавить запчасть
            </button>
          </div>

          {partsItems.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
              Запчасти не добавлены
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                    <th style={thStyle}>Наименование</th>
                    <th style={thStyle}>Артикул</th>
                    <th style={{ ...thStyle, width: '80px' }}>Кол-во</th>
                    <th style={{ ...thStyle, width: '100px' }}>Цена</th>
                    <th style={{ ...thStyle, width: '100px' }}>Сумма</th>
                    <th style={{ ...thStyle, width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {partsItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>
                        <input 
                          value={item.name} 
                          onChange={(e) => updatePartItem(item.id, 'name', e.target.value)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }}
                          placeholder="Название запчасти"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          value={item.article || ''} 
                          onChange={(e) => updatePartItem(item.id, 'article', e.target.value)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }}
                          placeholder="Артикул"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={(e) => updatePartItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '70px' }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          value={item.unit_price} 
                          onChange={(e) => updatePartItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '90px' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>
                        {(item.quantity * item.unit_price).toLocaleString('ru-RU')} ₽
                      </td>
                      <td style={tdStyle}>
                        <button type="button" onClick={() => removePartItem(item.id)} style={{ 
                          background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' 
                        }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 💰 Итого */}
        <Card title="💰 Итого">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '30px', fontSize: '16px' }}>
            <div>Работы: <strong>{totals.labor.toLocaleString('ru-RU')} ₽</strong></div>
            <div>Запчасти: <strong>{totals.parts.toLocaleString('ru-RU')} ₽</strong></div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
              Всего: {totals.total.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </Card>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px' }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            style={{ ...btnStyle, backgroundColor: '#95a5a6' }}
            disabled={saving}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            style={{ ...btnStyle, backgroundColor: '#27ae60', minWidth: '180px' }}
            disabled={saving}
          >
            {saving ? '⏳ Сохранение...' : (orderId ? '💾 Сохранить изменения' : '📄 Создать заказ-наряд')}
          </button>
        </div>

      </form>

      {/* Модальное окно выбора услуг */}
      {showServiceSelector && (
        <ServiceSelectorModal
          token={token}
          services={services}
          servicesByCategory={servicesByCategory}
          onClose={() => setShowServiceSelector(false)}
          onSelect={(selected) => {
            const items = Array.isArray(selected) ? selected : [selected];
            items.forEach(s => addWorkItem({
              service_id: s.id,
              name: s.name,
              category: s.category,
              unit_price: s.base_price || Math.round(s.labor_hours * 2500),
              labor_hours: s.labor_hours || 0
            }));
            setShowServiceSelector(false);
          }}
          multiple={true}
        />
      )}

    </div>
  );
}

// Вспомогательные компоненты и стили
const Card = ({ title, children }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
    <h3 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '600' }}>{title}</h3>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required, style = {} }) => (
  <div>
    {label && <label style={labelStyle}>{label}</label>}
    <input 
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      style={{ ...inputStyle, ...style }}
      required={required}
    />
  </div>
);

const labelStyle = { fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };
const btnStyle = { padding: '10px 18px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' };
const thStyle = { padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555', fontSize: '13px' };
const tdStyle = { padding: '10px 8px', verticalAlign: 'middle' };

const getLoyaltyEmoji = (level) => {
  const map = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  return map[level] || '•';
};

export default WorkOrderForm;