// IMS/src/pages/CustomersPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CustomersPage({ token }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Состояния для модального окна
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' или 'edit'
  const [editingClient, setEditingClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  
  // 🔥 Новое состояние для заказ-нарядов клиента
  const [clientOrders, setClientOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [formData, setFormData] = useState({
    fio: '',
    company_name: '',
    phone: '',
    email: '',
    inn: '',
    kpp: '',
    ogrn: '',
    address: '',
    legal_address: '',
    bank_name: '',
    bank_account: '',
    correspondent_account: '',
    bik: '',
    type: 'individual',
    loyalty_level: 'bronze'
  });

  useEffect(() => {
    fetchClients();
  }, [token]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/crm/counterparties?limit=500', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const clientsArray = Array.isArray(data) ? data : (data.counterparties || data.customers || []);
        setClients(clientsArray);
      }
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Загрузка заказ-нарядов клиента
  const fetchClientOrders = async (customerId) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`/api/crm/work-orders?customer_id=${customerId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const ordersArray = Array.isArray(data) ? data : (data.work_orders || data.orders || []);
        setClientOrders(ordersArray);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказ-нарядов:', error);
      setClientOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (client.fio && client.fio.toLowerCase().includes(searchLower)) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.includes(searchLower)) ||
      (client.inn && client.inn.includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower));
    
    const matchesType = filterType === 'all' || client.type === filterType;

    return matchesSearch && matchesType;
  });

  // Открытие модалки в режиме ПРОСМОТРА
  const openViewModal = (client) => {
    setEditingClient(client);
    setModalMode('view');
    setActiveTab('main');
    setShowModal(true);
    // 🔥 Загружаем заказ-наряды
    fetchClientOrders(client.id);
  };

  // Открытие модалки в режиме РЕДАКТИРОВАНИЯ
  const openEditModal = (client) => {
    setEditingClient(client);
    setModalMode('edit');
    setFormData({
      fio: client.fio || '',
      company_name: client.company_name || '',
      phone: client.phone || '',
      email: client.email || '',
      inn: client.inn || '',
      kpp: client.kpp || '',
      ogrn: client.ogrn || '',
      address: client.address || '',
      legal_address: client.legal_address || '',
      bank_name: client.bank_name || '',
      bank_account: client.bank_account || '',
      correspondent_account: client.correspondent_account || '',
      bik: client.bik || '',
      type: client.type || 'individual',
      loyalty_level: client.loyalty_level || 'bronze'
    });
    setActiveTab('main');
    setShowModal(true);
  };

  // Открытие модалки для НОВОГО клиента
  const openNewModal = () => {
    setEditingClient(null);
    setModalMode('edit');
    setFormData({
      fio: '', company_name: '', phone: '', email: '',
      inn: '', kpp: '', ogrn: '',
      address: '', legal_address: '',
      bank_name: '', bank_account: '', correspondent_account: '', bik: '',
      type: 'individual', loyalty_level: 'bronze'
    });
    setActiveTab('main');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { ...formData };
      if (payload.type === 'individual') payload.company_name = null;
      if (payload.type === 'legal') payload.fio = null;

      const url = editingClient 
        ? `/api/crm/counterparties/${editingClient.id}` 
        : '/api/crm/counterparties';
      
      const method = editingClient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        fetchClients();
      } else {
        const err = await response.json();
        alert(`Ошибка: ${err.error || 'Не удалось сохранить'}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого клиента?')) return;
    
    try {
      const response = await fetch(`/api/crm/counterparties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setShowModal(false);
        fetchClients();
      } else {
        const err = await response.json();
        alert(err.error || 'Не удалось удалить клиента');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      individual: '👤 Физ. лицо',
      legal: '🏢 Юр. лицо',
      vip: '⭐ VIP',
      partner: '🤝 Партнер',
      supplier: '📦 Поставщик'
    };
    return types[type] || type;
  };

  const getLoyaltyLabel = (level) => {
    const levels = {
      bronze: '🥉 Бронза',
      silver: '🥈 Серебро',
      gold: '🥇 Золото',
      platinum: '💎 Платина'
    };
    return levels[level] || level;
  };

  // 🔥 Хелпер для статуса заказ-наряда
  const getStatusLabel = (status) => {
    const statuses = {
      draft: '📄 Черновик',
      in_progress: '🔧 В работе',
      waiting_parts: '📦 Ждём запчасти',
      ready: '✅ Готов',
      closed: '🔒 Закрыт',
      completed: '✔️ Выполнен',
      cancelled: '❌ Отменён'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#95a5a6',
      in_progress: '#3498db',
      waiting_parts: '#f39c12',
      ready: '#27ae60',
      closed: '#7f8c8d',
      completed: '#2ecc71',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        Загрузка клиентов...
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px', fontWeight: '500' };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>👥 Клиенты (Контрагенты)</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            Всего в базе: {clients.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            ← Назад
          </button>
          <button onClick={openNewModal} style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            ➕ Добавить клиента
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={labelStyle}>🔍 Поиск</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Имя, компания, телефон, ИНН, email..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>🏷️ Тип клиента</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={inputStyle}
            >
              <option value="all">Все типы</option>
              <option value="individual">Физ. лицо</option>
              <option value="legal">Юр. лицо / ИП</option>
              <option value="vip">VIP</option>
              <option value="partner">Партнер</option>
              <option value="supplier">Поставщик</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {filteredClients.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <p>Клиенты не найдены</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Имя / Компания</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Телефон</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Email</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Тип</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>ИНН</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#555' }}>Лояльность</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#555', width: '120px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => {
                  const displayName = client.company_name || client.fio || 'Без имени';
                  return (
                    <tr key={client.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => openViewModal(client)}>
                      <td style={{ padding: '12px 8px', fontWeight: '500' }}>{displayName}</td>
                      <td style={{ padding: '12px 8px', color: '#666' }}>{client.phone || '—'}</td>
                      <td style={{ padding: '12px 8px', color: '#666' }}>{client.email || '—'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                          backgroundColor: client.type === 'vip' ? '#fff3cd' : '#e8f4f8',
                          color: client.type === 'vip' ? '#856404' : '#0c5460'
                        }}>
                          {getTypeLabel(client.type)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#666', fontFamily: 'monospace', fontSize: '12px' }}>{client.inn || '—'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontSize: '12px' }}>
                          {getLoyaltyLabel(client.loyalty_level)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEditModal(client)} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '18px', marginRight: '10px' }} title="Редактировать">✏️</button>
                        <button onClick={() => handleDelete(client.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '18px' }} title="Удалить">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно: ПРОСМОТР */}
      {showModal && modalMode === 'view' && editingClient && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            zIndex: 10000, padding: '20px' 
          }} 
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{ 
              backgroundColor: 'white', borderRadius: '12px', width: '100%', 
              maxWidth: '800px', maxHeight: '90vh', display: 'flex', 
              flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' 
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>👤 {editingClient.company_name || editingClient.fio || 'Без имени'}</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                  {getTypeLabel(editingClient.type)} • {getLoyaltyLabel(editingClient.loyalty_level)}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>

            {/* Вкладки */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 25px', backgroundColor: '#f8f9fa' }}>
              {['main', 'requisites', 'contacts', 'orders'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? '3px solid #3498db' : '3px solid transparent',
                    color: activeTab === tab ? '#3498db' : '#666',
                    fontWeight: activeTab === tab ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {tab === 'main' && '📋 Основные'}
                  {tab === 'requisites' && '🏛️ Реквизиты'}
                  {tab === 'contacts' && '📞 Контакты'}
                  {tab === 'orders' && `📄 Заказ-наряды (${clientOrders.length})`}
                </button>
              ))}
            </div>

            {/* Содержимое */}
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
              
              {activeTab === 'main' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Тип клиента</div>
                    <div style={{ fontSize: '15px', fontWeight: '500' }}>{getTypeLabel(editingClient.type)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Уровень лояльности</div>
                    <div style={{ fontSize: '15px', fontWeight: '500' }}>{getLoyaltyLabel(editingClient.loyalty_level)}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      {editingClient.type === 'individual' || editingClient.type === 'vip' ? 'ФИО' : 'Название компании'}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{editingClient.company_name || editingClient.fio || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Дата создания</div>
                    <div style={{ fontSize: '14px' }}>{editingClient.created_at ? new Date(editingClient.created_at).toLocaleDateString('ru-RU') : '—'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'requisites' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>ИНН</div>
                    <div style={{ fontSize: '15px', fontFamily: 'monospace' }}>{editingClient.inn || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>КПП</div>
                    <div style={{ fontSize: '15px', fontFamily: 'monospace' }}>{editingClient.kpp || '—'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>ОГРН</div>
                    <div style={{ fontSize: '15px', fontFamily: 'monospace' }}>{editingClient.ogrn || '—'}</div>
                  </div>
                  <hr style={{ gridColumn: 'span 2', border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Банк</div>
                    <div style={{ fontSize: '15px' }}>{editingClient.bank_name || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Расчётный счёт</div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{editingClient.bank_account || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>БИК</div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{editingClient.bik || '—'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Корр. счёт</div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>{editingClient.correspondent_account || '—'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Телефон</div>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>{editingClient.phone || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Email</div>
                    <div style={{ fontSize: '15px' }}>{editingClient.email || '—'}</div>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Фактический адрес</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{editingClient.address || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Юридический адрес</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{editingClient.legal_address || '—'}</div>
                  </div>
                </div>
              )}

              {/* 🔥 Вкладка: Заказ-наряды */}
              {activeTab === 'orders' && (
                <div>
                  {loadingOrders ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                      Загрузка заказ-нарядов...
                    </div>
                  ) : clientOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
                      <p>У этого клиента пока нет заказ-нарядов</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {clientOrders.map(order => (
                        <div 
                          key={order.id} 
                          style={{ 
                            padding: '15px', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '8px',
                            backgroundColor: '#fafafa',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => {
                            setShowModal(false);
                            navigate(`/crm/work-orders/${order.id}`);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3498db';
                            e.currentTarget.style.backgroundColor = '#f0f8ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.backgroundColor = '#fafafa';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                                №{order.order_number}
                              </div>
                              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                {new Date(order.created_at).toLocaleDateString('ru-RU')} в {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <span style={{ 
                              padding: '4px 12px', 
                              borderRadius: '12px', 
                              fontSize: '12px', 
                              fontWeight: '500',
                              backgroundColor: getStatusColor(order.status) + '20',
                              color: getStatusColor(order.status),
                              border: `1px solid ${getStatusColor(order.status)}40`
                            }}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                            <strong>Авто:</strong> {order.brand} {order.model} {order.year && `(${order.year})`}
                          </div>

                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                            <strong>Жалоба:</strong> {order.complaint || '—'}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e0e0e0' }}>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              {order.assigned_master_name && <span>👨‍🔧 {order.assigned_master_name}</span>}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#27ae60' }}>
                              {(order.final_total || 0).toLocaleString('ru-RU')} ₽
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div style={{ padding: '15px 25px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: '#f8f9fa' }}>
              <button 
                onClick={() => openEditModal(editingClient)}
                style={{ flex: 1, padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
              >
                ✏️ Редактировать
              </button>
              <button 
                onClick={() => handleDelete(editingClient.id)}
                style={{ padding: '12px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: РЕДАКТИРОВАНИЕ (без изменений) */}
      {showModal && modalMode === 'edit' && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            zIndex: 10000, padding: '20px' 
          }} 
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{ 
              backgroundColor: 'white', borderRadius: '12px', width: '100%', 
              maxWidth: '650px', maxHeight: '90vh', display: 'flex', 
              flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' 
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>
                {editingClient ? '✏️ Редактировать клиента' : '➕ Новый клиент'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 25px', backgroundColor: '#f8f9fa' }}>
              {['main', 'requisites', 'contacts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 20px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? '3px solid #3498db' : '3px solid transparent',
                    color: activeTab === tab ? '#3498db' : '#666',
                    fontWeight: activeTab === tab ? '600' : '400',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {tab === 'main' && '📋 Основные'}
                  {tab === 'requisites' && '🏛️ Реквизиты'}
                  {tab === 'contacts' && '📞 Контакты'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
              
              {activeTab === 'main' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Тип клиента</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="individual">👤 Физическое лицо</option>
                      <option value="legal">🏢 Юридическое лицо / ИП</option>
                      <option value="vip">⭐ VIP клиент</option>
                      <option value="partner">🤝 Партнер</option>
                      <option value="supplier">📦 Поставщик</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      {formData.type === 'individual' || formData.type === 'vip' ? 'ФИО *' : 'Название компании *'}
                    </label>
                    <input 
                      type="text" 
                      value={formData.type === 'individual' || formData.type === 'vip' ? formData.fio : formData.company_name}
                      onChange={(e) => {
                        const field = formData.type === 'individual' || formData.type === 'vip' ? 'fio' : 'company_name';
                        setFormData({ ...formData, [field]: e.target.value });
                      }}
                      placeholder={formData.type === 'individual' || formData.type === 'vip' ? 'Иванов Иван Иванович' : 'ООО "Ромашка"'}
                      style={inputStyle}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Уровень лояльности</label>
                    <select 
                      value={formData.loyalty_level} 
                      onChange={(e) => setFormData({ ...formData, loyalty_level: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="bronze">🥉 Бронза (0%)</option>
                      <option value="silver">🥈 Серебро (5%)</option>
                      <option value="gold">🥇 Золото (10%)</option>
                      <option value="platinum">💎 Платина (15%)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'requisites' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={labelStyle}>ИНН</label>
                      <input type="text" value={formData.inn} onChange={(e) => setFormData({ ...formData, inn: e.target.value })} placeholder="123456789012" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>КПП</label>
                      <input type="text" value={formData.kpp} onChange={(e) => setFormData({ ...formData, kpp: e.target.value })} placeholder="123456789" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>ОГРН</label>
                    <input type="text" value={formData.ogrn} onChange={(e) => setFormData({ ...formData, ogrn: e.target.value })} placeholder="1234567890123" style={inputStyle} />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

                  <div>
                    <label style={labelStyle}>Название банка</label>
                    <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} placeholder="ПАО Сбербанк" style={inputStyle} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={labelStyle}>Расчётный счёт</label>
                      <input type="text" value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} placeholder="40702810000000000000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>БИК</label>
                      <input type="text" value={formData.bik} onChange={(e) => setFormData({ ...formData, bik: e.target.value })} placeholder="044525225" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Корр. счёт</label>
                    <input type="text" value={formData.correspondent_account} onChange={(e) => setFormData({ ...formData, correspondent_account: e.target.value })} placeholder="30101810400000000225" style={inputStyle} />
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Телефон *</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+7 (999) 123-45-67" style={inputStyle} required />
                  </div>

                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="client@example.com" style={inputStyle} />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />

                  <div>
                    <label style={labelStyle}>Фактический адрес</label>
                    <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="г. Москва, ул. Ленина, д. 1" style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
                  </div>

                  <div>
                    <label style={labelStyle}>Юридический адрес</label>
                    <textarea value={formData.legal_address} onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })} placeholder="г. Москва, ул. Советская, д. 5" style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} disabled={saving}>
                  Отмена
                </button>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }} disabled={saving}>
                  {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomersPage;