// IMS/src/pages/WorkOrderForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function WorkOrderForm({ token }) {
  const navigate = useNavigate();
  const { id } = useParams(); // 🔥 Получаем id из URL (например, /crm/work-orders/3/edit)
  
  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [masters, setMasters] = useState([]);
  const [warehouseParts, setWarehouseParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showPartsSelector, setShowPartsSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_info: { brand: '', model: '', year: '', vin: '', mileage: '' },
    complaint: '',
    diagnostics: '',
    priority: 'normal',
    assigned_master: '',
    promised_at: '',
    status: 'draft',
    discount_type: 'percent',
    discount_value: 0,
    discount_reason: ''
  });

  const [workItems, setWorkItems] = useState([]);
  const [partsItems, setPartsItems] = useState([]);

  // 🔧 Определяем режим: создание или редактирование
  const isEditMode = !!id;

  // 🔧 Хелпер: извлекает массив из ответа API
  const extractArray = (data, possibleKeys = []) => {
    if (Array.isArray(data)) return data;
    for (const key of possibleKeys) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    for (const key of ['customers', 'services', 'users', 'data', 'rows', 'items', 'results', 'parts']) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    return [];
  };

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, servicesRes, mastersRes] = await Promise.all([
          fetch('/api/crm/customers?limit=200', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/services?active=true&limit=500', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/users?role=master', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (customersRes.ok) setCustomers(extractArray(await customersRes.json(), ['customers']));
        if (servicesRes.ok) setServices(extractArray(await servicesRes.json(), ['services']));
        if (mastersRes.ok) setMasters(extractArray(await mastersRes.json(), ['users', 'masters']));

        // 🔥 Загружаем данные заказ-наряда ТОЛЬКО если есть id (режим редактирования)
        if (isEditMode && id) {
          console.log('🔍 Loading order for edit:', id);
          const orderRes = await fetch(`/api/crm/work-orders/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (orderRes.ok) {
            const data = await orderRes.json();
            const orderData = data.order || data.work_order || data;
            setOrder(orderData);
            
            // 🔥 Заполняем форму данными из БД
            setFormData({
              customer_id: orderData.customer_id || '',
              vehicle_info: orderData.vehicle_info || {},
              complaint: orderData.complaint || '',
              diagnostics: orderData.diagnostics || '',
              priority: orderData.priority || 'normal',
              assigned_master: orderData.assigned_master || '',
              promised_at: orderData.promised_at?.slice(0, 16) || '',
              status: orderData.status || 'draft',
              discount_type: 'percent',
              discount_value: 0,
              discount_reason: ''
            });
            
            if (orderData.work_items) setWorkItems(orderData.work_items);
            if (orderData.parts_items) setPartsItems(orderData.parts_items);
            
            console.log('✅ Order loaded:', orderData);
          } else {
            console.error('❌ Failed to load order');
            alert('⚠️ Не удалось загрузить заказ-наряд');
            navigate('/crm/work-orders');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setCustomers([]); setServices([]); setMasters([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, id, isEditMode]); // 🔥 Зависимость от id

  // 🔧 Загрузка запчастей со склада при открытии модалки
  useEffect(() => {
    if (showPartsSelector) {
      console.log('🔍 Opening parts selector, fetching...');
      
      const fetchWarehouseParts = async () => {
        try {
          const response = await fetch('/api/parts?limit=200', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('📦 Parts API response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 Parts API data:', { 
              total: data.total, 
              parts_count: data.parts?.length,
              first_part: data.parts?.[0]
            });
            setWarehouseParts(data.parts || []);
          } else {
            const err = await response.json();
            console.error('❌ Parts API error:', err);
          }
        } catch (err) {
          console.error('❌ Error fetching warehouse parts:', err);
        }
      };
      fetchWarehouseParts();
    }
  }, [showPartsSelector, token]);

  // 🔧 БЕЗОПАСНЫЕ МАССИВЫ
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeMasters = Array.isArray(masters) ? masters : [];
  const safeServices = Array.isArray(services) ? services : [];
  const safeWorkItems = Array.isArray(workItems) ? workItems : [];
  const safePartsItems = Array.isArray(partsItems) ? partsItems : [];

  // Подсчёт итогов
  const totals = useMemo(() => {
    const laborTotal = safeWorkItems.reduce((sum, item) => 
      sum + ((item.quantity || 1) * (item.unit_price || 0)), 0);
    const partsTotal = safePartsItems.reduce((sum, item) => 
      sum + ((item.quantity || 1) * (item.unit_price || 0)), 0);
    return { labor: laborTotal, parts: partsTotal, total: laborTotal + partsTotal };
  }, [safeWorkItems, safePartsItems]);

  // 🔧 Расчёт скидки
  const pricing = useMemo(() => {
    const subtotal = totals.total;
    let discountAmount = 0;
    
    if (formData.discount_type === 'loyalty' && formData.customer_id) {
      const customer = safeCustomers.find(c => c.id == formData.customer_id);
      const loyaltyRates = { bronze: 0, silver: 5, gold: 10, platinum: 15 };
      const rate = customer?.loyalty_level ? loyaltyRates[customer.loyalty_level] || 0 : 0;
      discountAmount = subtotal * (rate / 100);
    } else if (formData.discount_type === 'percent') {
      const percent = parseFloat(formData.discount_value) || 0;
      discountAmount = subtotal * (Math.min(percent, 100) / 100);
    } else if (formData.discount_type === 'fixed') {
      const fixed = parseFloat(formData.discount_value) || 0;
      discountAmount = Math.min(fixed, subtotal);
    }
    
    const finalTotal = Math.max(0, subtotal - discountAmount);
    
    return {
      subtotal,
      discount: discountAmount,
      final: finalTotal,
      discountPercent: subtotal > 0 ? Math.round((discountAmount / subtotal) * 100) : 0
    };
  }, [totals.total, formData.discount_type, formData.discount_value, formData.customer_id, safeCustomers]);

  // Группировка услуг
  const servicesByCategory = useMemo(() => {
    if (!Array.isArray(services) || services.length === 0) return {};
    const grouped = {};
    services.forEach(s => {
      if (!s?.category) return;
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });
    return grouped;
  }, [services]);

  // Обработчики для работ
  const addWorkItem = (template = {}) => {
    setWorkItems(prev => [...prev, {
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

  const updateWorkItem = (itemId, field, value) => {
    setWorkItems(items => items.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? value : item.quantity || 1;
        const price = field === 'unit_price' ? value : item.unit_price || 0;
        updated.total_price = qty * price;
      }
      return updated;
    }));
  };

  const removeWorkItem = (itemId) => setWorkItems(items => items.filter(item => item.id !== itemId));

  // Обработчики для запчастей
  const addPartItem = (template = {}) => {
    setPartsItems(prev => [...prev, {
      id: Date.now() + Math.random(),
      part_id: template.part_id || null,
      name: template.name || '',
      article: template.article || template.part_number || '',
      quantity: template.quantity || 1,
      unit: template.unit || 'шт',
      unit_price: template.unit_price || 0,
      total_price: template.unit_price || 0,
      warehouse_location: template.location_name || '',
      status: 'pending',
      ...template
    }]);
  };

  const updatePartItem = (itemId, field, value) => {
    setPartsItems(items => items.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? value : item.quantity || 1;
        const price = field === 'unit_price' ? value : item.unit_price || 0;
        updated.total_price = qty * price;
      }
      return updated;
    }));
  };

  const removePartItem = (itemId) => setPartsItems(items => items.filter(item => item.id !== itemId));

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.vehicle_info.brand || !formData.complaint) {
      alert('⚠️ Заполните обязательные поля: клиент, марка авто и жалоба');
      return;
    }
    setSaving(true);
    try {
      console.log('🔍 Sending payload:', {
        work_items_count: workItems.length,
        parts_items_count: partsItems.length,
        first_work: workItems[0],
        first_part: partsItems[0]
      });

      const payload = { 
        customer_id: formData.customer_id || null,
        vehicle_id: formData.vehicle_id || null,
        complaint: formData.complaint || '',
        notes: formData.notes || '',
        priority: formData.priority || 'normal',
        assigned_master: formData.assigned_master || null,
        assigned_bay: formData.assigned_bay || null,
        promised_at: formData.promised_at || null,
        status: formData.status || 'draft',
        vehicle_info: formData.vehicle_info || {},
        discount_type: formData.discount_type || 'none',
        discount_value: formData.discount_value || 0,
        discount_reason: formData.discount_reason || '',
        
        // 🔥 Явно преобразуем в массивы (защита от undefined)
        work_items: Array.isArray(workItems) ? workItems : [],
        parts_items: Array.isArray(partsItems) ? partsItems : [],
        
        totals: { 
          ...totals, 
          currency: 'RUB',
          discount_amount: pricing.discount,
          final_total: pricing.final
        }
      };
      
      // 🔥 Используем id из useParams() для определения режима
      const url = isEditMode ? `/api/crm/work-orders/${id}` : '/api/crm/work-orders';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        const savedId = data.work_order?.id || data.order?.id || id;
        navigate(`/crm/work-orders/${savedId}`, { state: { saved: true } });
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

  // 🔧 Встроенная модалка выбора услуг
  const ServiceSelectorInline = ({ services, categories, onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('all');
    const [selected, setSelected] = useState([]);

    const filtered = useMemo(() => {
      let list = Array.isArray(services) ? services : [];
      if (selectedCat !== 'all') list = list.filter(s => s.category === selectedCat);
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(s => 
          s.name?.toLowerCase().includes(q) || 
          s.full_name?.toLowerCase().includes(q) ||
          s.service_code?.toLowerCase().includes(q)
        );
      }
      return list.slice(0, 200);
    }, [services, selectedCat, search]);

    const toggle = (svc) => {
      setSelected(prev => {
        const exists = prev.find(s => s.id === svc.id);
        return exists ? prev.filter(s => s.id !== svc.id) : [...prev, svc];
      });
    };

    const confirm = () => {
      if (selected.length > 0) onSelect(selected);
      onClose();
    };

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000,
        padding: '20px'
      }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', width: '100%',
          maxWidth: '850px', maxHeight: '90vh', display: 'flex',
          flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }} onClick={e => e.stopPropagation()}>
          
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>📚 Выбор услуг</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="🔍 Поиск..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minWidth: '180px' }}>
              <option value="all">📁 Все категории</option>
              {Object.keys(categories || {}).sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px', maxHeight: '45vh' }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '30px' }}>🔍 Услуги не найдены</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map(svc => {
                  const isSel = selected.some(s => s.id === svc.id);
                  return (
                    <div key={svc.id} onClick={() => toggle(svc)}
                      style={{
                        padding: '12px 15px', border: `2px solid ${isSel ? '#27ae60' : '#eee'}`,
                        borderRadius: '8px', cursor: 'pointer', backgroundColor: isSel ? '#f0fdf4' : 'white',
                        transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{svc.name}{svc.service_code && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>[{svc.service_code}]</span>}</div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                          {svc.category && <span>📁 {svc.category} • </span>}
                          <span>⏱ {svc.labor_hours || 0} ч</span>
                          {svc.base_price > 0 && <span> • 💰 {svc.base_price.toLocaleString('ru-RU')} ₽</span>}
                        </div>
                      </div>
                      {isSel && <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '18px' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
            <button onClick={confirm} disabled={selected.length === 0}
              style={{ padding: '10px 20px', backgroundColor: selected.length === 0 ? '#bdc3c7' : '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '500' }}>
              Добавить ({selected.length})
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🔧 Встроенная модалка выбора запчастей со склада
  const PartsSelectorInline = ({ parts, onClose, onSelect }) => {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);

    const filteredParts = useMemo(() => {
      if (!search.trim()) return parts.slice(0, 100);
      const q = search.toLowerCase();
      return parts.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.part_number?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.manufacturer_name?.toLowerCase().includes(q)
      ).slice(0, 100);
    }, [parts, search]);

    const togglePart = (part) => {
      setSelected(prev => {
        const exists = prev.find(p => p.id === part.id);
        return exists ? prev.filter(p => p.id !== part.id) : [...prev, part];
      });
    };

    const confirm = () => {
      if (selected.length > 0) onSelect(selected);
      onClose();
    };

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 10000,
        padding: '20px'
      }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', width: '100%',
          maxWidth: '900px', maxHeight: '90vh', display: 'flex',
          flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }} onClick={e => e.stopPropagation()}>
          
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>📦 Выбор запчастей со склада</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666' }}>×</button>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee' }}>
            <input 
              type="text" 
              placeholder="🔍 Поиск по названию, артикулу или описанию..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px', maxHeight: '45vh' }}>
            {filteredParts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '30px' }}>🔍 Запчасти не найдены</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredParts.map(part => {
                  const isSelected = selected.some(p => p.id === part.id);
                  return (
                    <div 
                      key={part.id} 
                      onClick={() => togglePart(part)}
                      style={{
                        padding: '12px 15px',
                        border: `2px solid ${isSelected ? '#e67e22' : '#eee'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#fff5f5' : 'white',
                        transition: 'all 0.15s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>
                          {part.name}
                          {part.part_number && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
                              [{part.part_number}]
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                          {part.manufacturer_name && <span>🏭 {part.manufacturer_name} • </span>}
                          {part.category_name && <span>📁 {part.category_name} • </span>}
                          {part.quantity !== null && (
                            <span style={{ marginLeft: '8px', color: part.quantity > 0 ? '#27ae60' : '#e74c3c' }}>
                              📦 Остаток: {part.quantity} шт
                            </span>
                          )}
                          {part.location_name && <span> • 📍 {part.location_name}</span>}
                        </div>
                        {part.description && (
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {part.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '18px' }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Отмена</button>
            <button 
              onClick={confirm} 
              disabled={selected.length === 0}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: selected.length === 0 ? '#bdc3c7' : '#e67e22', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              Добавить ({selected.length})
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      
      {/* 🔹 Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            {isEditMode ? '✏️ Редактировать заказ-наряд' : '➕ Новый заказ-наряд'}
          </h1>
          {order && (
            <span style={{ fontSize: '14px', color: '#666' }}>
              №{order.order_number} • {new Date(order.created_at).toLocaleDateString('ru-RU')}
            </span>
          )}
        </div>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>← Назад</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 👤 Клиент */}
        <Card title="👤 Клиент">
          <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} style={inputStyle} required>
            <option value="">Выберите клиента...</option>
            {safeCustomers.map(c => (
              <option key={c.id} value={c.id}>
                {c.counterparty_name || c.name || 'Частное лицо'} • {c.phone || c.phone_primary || 'нет телефона'}
                {c.loyalty_level && c.loyalty_level !== 'bronze' && ` • ${getLoyaltyEmoji(c.loyalty_level)} ${c.loyalty_level}`}
              </option>
            ))}
          </select>
        </Card>

        {/* 🚗 Автомобиль */}
        <Card title="🚗 Автомобиль">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <Input label="Марка *" value={formData.vehicle_info.brand || ''} onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, brand: v }})} required />
            <Input label="Модель *" value={formData.vehicle_info.model || ''} onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, model: v }})} required />
            <Input label="Год" type="number" value={formData.vehicle_info.year || ''} onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, year: v }})} />
            <Input label="Пробег, км" type="number" value={formData.vehicle_info.mileage || ''} onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, mileage: v }})} />
            <Input label="VIN" value={formData.vehicle_info.vin || ''} onChange={(v) => setFormData({ ...formData, vehicle_info: { ...formData.vehicle_info, vin: v }})} style={{ gridColumn: 'span 2' }} />
          </div>
        </Card>

        {/* 📝 Жалоба и диагностика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <Card title="📝 Жалоба клиента *">
            <textarea value={formData.complaint} onChange={(e) => setFormData({ ...formData, complaint: e.target.value })} placeholder="Опишите проблему..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} required />
          </Card>
          <Card title="🔍 Диагностика (после осмотра)">
            <textarea value={formData.diagnostics} onChange={(e) => setFormData({ ...formData, diagnostics: e.target.value })} placeholder="Результаты диагностики..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
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
                {safeMasters.map(m => <option key={m.id} value={m.id}>{m.full_name || m.username || m.name || 'Без имени'}</option>)}
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
              <button type="button" onClick={() => setShowServiceSelector(true)} style={{ ...btnStyle, backgroundColor: '#9b59b6' }}>📚 Из справочника</button>
              <button type="button" onClick={() => addWorkItem()} style={{ ...btnStyle, backgroundColor: '#3498db' }}>➕ Вручную</button>
            </div>
          </div>

          {safeWorkItems.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>Работы не добавлены. Нажмите "Из справочника" или "Вручную"</p>
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
                  {safeWorkItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}><input value={item.name} onChange={(e) => updateWorkItem(item.id, 'name', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }} placeholder="Название работы" /></td>
                      <td style={tdStyle}><input value={item.category || ''} onChange={(e) => updateWorkItem(item.id, 'category', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }} placeholder="Категория" /></td>
                      <td style={tdStyle}><input type="number" min="0.1" step="0.1" value={item.quantity} onChange={(e) => updateWorkItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '70px' }} /></td>
                      <td style={tdStyle}><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateWorkItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '90px' }} /></td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{((item.quantity || 1) * (item.unit_price || 0)).toLocaleString('ru-RU')} ₽</td>
                      <td style={tdStyle}><button type="button" onClick={() => removeWorkItem(item.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' }}>×</button></td>
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowPartsSelector(true)} style={{ ...btnStyle, backgroundColor: '#e67e22' }}>📦 Из справочника</button>
              <button type="button" onClick={() => addPartItem()} style={{ ...btnStyle, backgroundColor: '#3498db' }}>➕ Вручную</button>
            </div>
          </div>
          {safePartsItems.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>Запчасти не добавлены</p>
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
                  {safePartsItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}><input value={item.name} onChange={(e) => updatePartItem(item.id, 'name', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }} placeholder="Название запчасти" /></td>
                      <td style={tdStyle}><input value={item.article || ''} onChange={(e) => updatePartItem(item.id, 'article', e.target.value)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px' }} placeholder="Артикул" /></td>
                      <td style={tdStyle}><input type="number" min="1" value={item.quantity} onChange={(e) => updatePartItem(item.id, 'quantity', parseInt(e.target.value) || 1)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '70px' }} /></td>
                      <td style={tdStyle}><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updatePartItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, padding: '6px 8px', fontSize: '13px', width: '90px' }} /></td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{((item.quantity || 1) * (item.unit_price || 0)).toLocaleString('ru-RU')} ₽</td>
                      <td style={tdStyle}><button type="button" onClick={() => removePartItem(item.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' }}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 💸 Скидка */}
        <Card title="💸 Скидка">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Тип скидки</label>
              <select 
                value={formData.discount_type} 
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })} 
                style={inputStyle}
              >
                <option value="loyalty">🏆 По лояльности</option>
                <option value="percent">📊 Процент (%)</option>
                <option value="fixed">💵 Фиксированная</option>
                <option value="none">❌ Без скидки</option>
              </select>
            </div>
            
            {formData.discount_type !== 'none' && formData.discount_type !== 'loyalty' && (
              <div>
                <label style={labelStyle}>
                  {formData.discount_type === 'percent' ? 'Размер, %' : 'Сумма, ₽'}
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max={formData.discount_type === 'percent' ? 100 : undefined}
                  step={formData.discount_type === 'percent' ? 0.1 : 1}
                  value={formData.discount_value} 
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} 
                  style={inputStyle}
                  placeholder={formData.discount_type === 'percent' ? '10' : '500'}
                />
              </div>
            )}
            
            {formData.discount_type === 'loyalty' && formData.customer_id && (
              <div style={{ padding: '10px', backgroundColor: '#ebf5fb', borderRadius: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Автоскидка:</label>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#27ae60' }}>
                  {(() => {
                    const customer = safeCustomers.find(c => c.id == formData.customer_id);
                    const rates = { bronze: 0, silver: 5, gold: 10, platinum: 15 };
                    const level = customer?.loyalty_level || 'bronze';
                    const rate = rates[level] || 0;
                    const amount = totals.total * (rate / 100);
                    return (
                      <>
                        {getLoyaltyEmoji(level)} {level.toUpperCase()}: -{rate}%<br/>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          -{amount.toLocaleString('ru-RU')} ₽
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Причина / Комментарий</label>
              <input 
                type="text"
                value={formData.discount_reason} 
                onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })} 
                style={inputStyle}
                placeholder="Акция, постоянный клиент, ошибка в расчёте..."
              />
            </div>
          </div>
          
          {pricing.discount > 0 && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '6px',
              border: '1px solid #27ae60',
              fontSize: '14px'
            }}>
              <strong>💰 Расчёт:</strong><br/>
              Сумма работ и запчастей: <strong>{pricing.subtotal.toLocaleString('ru-RU')} ₽</strong><br/>
              Скидка ({formData.discount_type === 'percent' ? `${formData.discount_value}%` : 
                      formData.discount_type === 'fixed' ? 'фикс.' : 
                      formData.discount_type === 'loyalty' ? 'по лояльности' : '-'}): 
              <strong style={{ color: '#e74c3c' }}> -{pricing.discount.toLocaleString('ru-RU')} ₽</strong><br/>
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px dashed #27ae60' }}/>
              <strong>Итого к оплате: <span style={{ color: '#27ae60', fontSize: '18px' }}>
                {pricing.final.toLocaleString('ru-RU')} ₽
              </span></strong>
            </div>
          )}
        </Card>

        {/* 💰 Итого */}
        <Card title="💰 Итого">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Работы:</span>
              <strong>{totals.labor.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Запчасти:</span>
              <strong>{totals.parts.toLocaleString('ru-RU')} ₽</strong>
            </div>
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Подытог:</span>
              <strong>{pricing.subtotal.toLocaleString('ru-RU')} ₽</strong>
            </div>
            {pricing.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                <span>Скидка {formData.discount_reason && `(${formData.discount_reason})`}:</span>
                <strong>-{pricing.discount.toLocaleString('ru-RU')} ₽</strong>
              </div>
            )}
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '2px solid #27ae60' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>
              <span>К оплате:</span>
              <span>{pricing.final.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </Card>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ ...btnStyle, backgroundColor: '#95a5a6' }} disabled={saving}>Отмена</button>
          <button type="submit" style={{ ...btnStyle, backgroundColor: '#27ae60', minWidth: '180px' }} disabled={saving}>
            {saving ? '⏳ Сохранение...' : (isEditMode ? '💾 Сохранить изменения' : '📄 Создать заказ-наряд')}
          </button>
        </div>
      </form>

      {/* 🔧 Встроенная модалка выбора услуг */}
      {showServiceSelector && (
        <ServiceSelectorInline
          services={safeServices}
          categories={servicesByCategory}
          onClose={() => setShowServiceSelector(false)}
          onSelect={(selected) => {
            const items = Array.isArray(selected) ? selected : [selected];
            items.forEach(s => addWorkItem({
              service_id: s?.id,
              name: s?.name || '',
              category: s?.category || '',
              unit_price: s?.base_price || Math.round((s?.labor_hours || 0) * 2500),
              labor_hours: s?.labor_hours || 0
            }));
            setShowServiceSelector(false);
          }}
        />
      )}

      {/* 🔧 Встроенная модалка выбора запчастей */}
      {showPartsSelector && (
        <PartsSelectorInline
          parts={warehouseParts}
          onClose={() => setShowPartsSelector(false)}
          onSelect={(selectedParts) => {
            selectedParts.forEach(part => {
              addPartItem({
                part_id: part.id,
                name: part.name,
                part_number: part.part_number,
                article: part.part_number,
                category: part.category_name,
                manufacturer: part.manufacturer_name,
                quantity: 1,
                unit: 'шт',
                unit_price: 0,
                total_price: 0,
                location_name: part.location_name
              });
            });
            setShowPartsSelector(false);
          }}
        />
      )}

    </div>
  );
}

// Вспомогательные компоненты
const Card = ({ title, children }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
    <h3 style={{ margin: '0 0 15px', fontSize: '16px', fontWeight: '600' }}>{title}</h3>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required, style = {} }) => (
  <div>
    {label && <label style={labelStyle}>{label}{required && ' *'}</label>}
    <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, ...style }} required={required} />
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