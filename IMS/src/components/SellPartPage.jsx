// IMS/src/components/SellPartPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrintReceiptModal from './PrintReceiptModal';

function SellPartPage({ token }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [selectedCounterparty, setSelectedCounterparty] = useState('');
  const [newCounterparty, setNewCounterparty] = useState({ 
    type: 'physical', 
    fio: '', 
    phone: '', 
    email: '', 
    address: '',
    inn: '', kpp: '', ogrn: '', company_name: '', legal_address: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', inn: '', ogrn: '', kpp: '', legal_address: '', actual_address: '' 
  });
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [seller, setSeller] = useState('ИП Иванов И.И.');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response = await fetch('/api/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch items');
        let data = await response.json();
        let availableItems = data.filter(item => item.status === 'available' || item.status === 'warehouse');
        setItems(availableItems);

        response = await fetch('/api/items/counterparties', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch counterparties');
        setCounterparties(await response.json());

        response = await fetch('/api/items/suppliers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch suppliers');
        setSuppliers(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Восстановление данных из localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('sellPartPageData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSelectedItems(parsed.selectedItems || []);
        setSelectedCounterparty(parsed.selectedCounterparty || '');
        setNewCounterparty(parsed.newCounterparty || { type: 'physical', fio: '', phone: '', email: '', address: '', inn: '', kpp: '', ogrn: '', company_name: '', legal_address: '' });
        setSelectedSupplier(parsed.selectedSupplier || '');
        setNewSupplier(parsed.newSupplier || { name: '', inn: '', ogrn: '', kpp: '', legal_address: '', actual_address: '' });
        setSaleDate(parsed.saleDate || new Date().toISOString().split('T')[0]);
        setSeller(parsed.seller || 'ИП Иванов И.И.');
      } catch (e) { console.error('Error parsing saved data', e); }
    }
  }, []);

  // Сохранение данных при изменении
  useEffect(() => {
    localStorage.setItem('sellPartPageData', JSON.stringify({
      selectedItems, selectedCounterparty, newCounterparty, selectedSupplier, newSupplier, saleDate, seller
    }));
  }, [selectedItems, selectedCounterparty, newCounterparty, selectedSupplier, newSupplier, saleDate, seller]);

  const handleAddItem = (itemId) => {
    const item = items.find(i => i.id === parseInt(itemId));
    if (item && !selectedItems.some(si => si.id === item.id)) {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1, selling_price: 0 }]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handlePriceChange = (itemId, newPrice) => {
    setSelectedItems(prev => prev.map(item => item.id === itemId ? { ...item, selling_price: parseFloat(newPrice) || 0 } : item));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    setSelectedItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, parseInt(newQuantity) || 1) } : item));
  };

  const handleNewCounterpartyChange = (field, value) => {
    setNewCounterparty(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewCounterparty = async () => {
    if (newCounterparty.type === 'legal' && (!newCounterparty.company_name || !newCounterparty.inn || !newCounterparty.legal_address)) {
      setError('Название, ИНН и юр. адрес обязательны для юр. лиц'); return;
    }
    if (newCounterparty.type === 'physical' && !newCounterparty.fio) {
      setError('ФИО обязательно для физ. лиц'); return;
    }
    try {
      const response = await fetch('/api/items/counterparties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newCounterparty),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add counterparty');
      setCounterparties(prev => [data, ...prev]);
      setSelectedCounterparty(data.id.toString());
      setNewCounterparty({ type: 'physical', fio: '', phone: '', email: '', address: '', inn: '', kpp: '', ogrn: '', company_name: '', legal_address: '' });
    } catch (err) { setError(err.message); }
  };

  const handleNewSupplierChange = (field, value) => {
    setNewSupplier(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewSupplier = async () => {
    if (!newSupplier.name || !newSupplier.inn || !newSupplier.legal_address) {
      setError('Название, ИНН и юр. адрес обязательны'); return;
    }
    try {
      const response = await fetch('/api/items/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newSupplier),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add supplier');
      setSuppliers(prev => [data, ...prev]);
      setSelectedSupplier(data.id.toString());
      setNewSupplier({ name: '', inn: '', ogrn: '', kpp: '', legal_address: '', actual_address: '' });
    } catch (err) { setError(err.message); }
  };

  const handleCalculateTotal = () => {
    if (selectedItems.length === 0) { setError('Добавьте хотя бы один товар'); return; }
    const allPricesFilled = selectedItems.every(item => item.selling_price > 0);
    if (!allPricesFilled) { setError('Введите цену для всех товаров'); return; }
    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    setReceiptData({
      items: selectedItems.map(item => ({ item, quantity: item.quantity, selling_price: item.selling_price })),
      totalAmount, sale_date: saleDate,
      seller: suppliers.find(s => s.id === parseInt(selectedSupplier))?.name || seller,
      counterparty: counterparties.find(cp => cp.id === parseInt(selectedCounterparty)) || null
    });
    setSuccess(`Итого: ${totalAmount.toFixed(2)} руб`);
  };

  const handleSell = async () => {
    if (!receiptData) { setError('Подсчитайте итого'); return; }
    try {
      const response = await fetch('/api/items/sell-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: selectedItems.map(item => ({ item_id: item.id, quantity: item.quantity, selling_price: item.selling_price })),
          total_amount: receiptData.totalAmount,
          counterparty_id: selectedCounterparty ? parseInt(selectedCounterparty) : null,
          supplier_id: selectedSupplier ? parseInt(selectedSupplier) : null
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to sell items');
      setSuccess('✅ Запчасти успешно проданы!');
      setTimeout(() => {
        setSelectedItems([]); setSelectedCounterparty(''); setSelectedSupplier('');
        setReceiptData(null); setSuccess('');
        localStorage.removeItem('sellPartPageData');
      }, 1500);
    } catch (err) { setError(err.message); }
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.qr_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Стили
  const pageStyle = { minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' };
  const headerStyle = { backgroundColor: 'white', padding: '12px 15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, position: 'sticky', top: 0 };
  const titleStyle = { margin: 0, fontSize: '18px', color: '#2c3e50', fontWeight: '600' };
  const headerButtonStyle = { padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease' };
  const mainContentStyle = { flex: 1, display: 'flex', overflow: 'hidden', gap: '20px', padding: '20px' };
  const panelStyle = { flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '15px', marginBottom: '15px' };
  const cardTitleStyle = { fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #3498db' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', marginBottom: '8px', boxSizing: 'border-box' };
  const selectStyle = { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', width: '100%', boxSizing: 'border-box', marginBottom: '8px' };
  const buttonStyle = { padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease' };
  const badgeStyle = (color) => ({ padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px', fontWeight: '500', backgroundColor: color, display: 'inline-block' });
  const errorBoxStyle = { color: '#e74c3c', backgroundColor: '#fadbd8', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #e74c3c' };
  const successBoxStyle = { color: '#27ae60', backgroundColor: '#d5f5e3', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #27ae60' };
  const emptyStateStyle = { textAlign: 'center', padding: '40px 20px', color: '#666' };

  const responsiveStyles = `
    @media (max-width: 1024px) {
      .main-content { flex-direction: column !important; }
      .panel { max-width: 100% !important; }
    }
  `;

  if (loading) {
    return (
      <div style={pageStyle} className="page-transition">
        <style>{responsiveStyles}</style>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="pulse" style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h2 className="fade-in" style={{ color: '#2c3e50' }}>Загрузка...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle} className="page-transition">
      <style>{responsiveStyles}</style>
      
      {/* Шапка */}
      <header style={headerStyle} className="slide-in-down">
        <h1 style={titleStyle}>💰 Продажа запчастей</h1>
        <button onClick={() => navigate(-1)} style={headerButtonStyle} className="glow-hover">← Назад</button>
      </header>

      {/* Основное содержимое */}
      <div className="main-content" style={mainContentStyle}>
        
        {/* Левая панель - Товары */}
        <div className="panel" style={panelStyle}>
          <h2 style={cardTitleStyle}>📦 Выбор запчастей</h2>
          
          {/* Поиск */}
          <input type="text" placeholder="🔍 Поиск по наименованию, QR, Part Number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} className="fade-in" />
          
          {/* Список доступных товаров */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
            {filteredItems.length === 0 ? (
              <div style={emptyStateStyle}>Нет товаров</div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} className="card-hover" onClick={() => handleAddItem(item.id)}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>QR: {item.qr_code} | Остаток: {item.quantity}</div>
                  </div>
                  <button style={{ ...buttonStyle, backgroundColor: '#27ae60', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleAddItem(item.id); }}>+</button>
                </div>
              ))
            )}
          </div>

          {/* Выбранные товары */}
          <div style={{ borderTop: '2px solid #3498db', paddingTop: '15px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>🛒 В продаже ({selectedItems.length}):</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {selectedItems.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#999' }}>Товары не добавлены</div>
              ) : (
                selectedItems.map(item => (
                  <div key={item.id} style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <strong>{item.name}</strong>
                      <button onClick={() => handleRemoveItem(item.id)} style={{ ...buttonStyle, backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', fontSize: '11px' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label>Кол-во:</label>
                      <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, e.target.value)} min="1" max={item.quantity} style={{ width: '60px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <label>Цена:</label>
                      <input type="number" value={item.selling_price || ''} onChange={(e) => handlePriceChange(item.id, e.target.value)} min="0.01" step="0.01" placeholder="0.00" style={{ width: '80px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>Сумма: {(item.selling_price * item.quantity).toFixed(2)} ₽</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Дата и кнопки */}
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ddd' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '5px' }}>📅 Дата продажи:</label>
            <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} style={inputStyle} />
            
            <button onClick={handleCalculateTotal} style={{ ...buttonStyle, backgroundColor: '#f39c12', color: 'white', width: '100%', marginTop: '10px' }} className="glow-hover">🧮 Подсчитать итого</button>
            
            {success && <div style={successBoxStyle}>{success}</div>}
            {error && <div style={errorBoxStyle}>{error}</div>}
          </div>
        </div>

        {/* Правая панель - Контрагенты и Поставщики */}
        <div className="panel" style={panelStyle}>
          <h2 style={cardTitleStyle}>👥 Контрагенты и Поставщики</h2>
          
          {/* Поставщик */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>🏭 Поставщик</h3>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} style={selectStyle}>
              <option value="">Новый поставщик</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.inn})</option>)}
            </select>
            
            {selectedSupplier === '' && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <input type="text" placeholder="Название *" value={newSupplier.name} onChange={(e) => handleNewSupplierChange('name', e.target.value)} style={inputStyle} />
                <input type="text" placeholder="ИНН *" value={newSupplier.inn} onChange={(e) => handleNewSupplierChange('inn', e.target.value)} style={inputStyle} />
                <input type="text" placeholder="КПП" value={newSupplier.kpp} onChange={(e) => handleNewSupplierChange('kpp', e.target.value)} style={inputStyle} />
                <input type="text" placeholder="ОГРН" value={newSupplier.ogrn} onChange={(e) => handleNewSupplierChange('ogrn', e.target.value)} style={inputStyle} />
                <textarea placeholder="Юр. адрес *" value={newSupplier.legal_address} onChange={(e) => handleNewSupplierChange('legal_address', e.target.value)} style={{ ...inputStyle, minHeight: '60px' }} />
                <button onClick={handleAddNewSupplier} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', width: '100%' }}>➕ Добавить поставщика</button>
              </div>
            )}
          </div>

          {/* Контрагент */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>👤 Контрагент</h3>
            <select value={selectedCounterparty} onChange={(e) => setSelectedCounterparty(e.target.value)} style={selectStyle}>
              <option value="">Новый контрагент</option>
              {counterparties.map(cp => <option key={cp.id} value={cp.id}>{cp.type === 'legal' ? cp.company_name : cp.fio}</option>)}
            </select>
            
            {selectedCounterparty === '' && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <select value={newCounterparty.type} onChange={(e) => handleNewCounterpartyChange('type', e.target.value)} style={selectStyle}>
                  <option value="physical">Физ. лицо</option>
                  <option value="legal">Юр. лицо</option>
                </select>
                
                {newCounterparty.type === 'physical' ? (
                  <input type="text" placeholder="ФИО *" value={newCounterparty.fio} onChange={(e) => handleNewCounterpartyChange('fio', e.target.value)} style={inputStyle} />
                ) : (
                  <>
                    <input type="text" placeholder="Название компании *" value={newCounterparty.company_name} onChange={(e) => handleNewCounterpartyChange('company_name', e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="ИНН *" value={newCounterparty.inn} onChange={(e) => handleNewCounterpartyChange('inn', e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="КПП" value={newCounterparty.kpp} onChange={(e) => handleNewCounterpartyChange('kpp', e.target.value)} style={inputStyle} />
                    <textarea placeholder="Юр. адрес *" value={newCounterparty.legal_address} onChange={(e) => handleNewCounterpartyChange('legal_address', e.target.value)} style={{ ...inputStyle, minHeight: '60px' }} />
                  </>
                )}
                <input type="tel" placeholder="Телефон" value={newCounterparty.phone} onChange={(e) => handleNewCounterpartyChange('phone', e.target.value)} style={inputStyle} />
                <input type="email" placeholder="Email" value={newCounterparty.email} onChange={(e) => handleNewCounterpartyChange('email', e.target.value)} style={inputStyle} />
                <button onClick={handleAddNewCounterparty} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', width: '100%' }}>➕ Добавить контрагента</button>
              </div>
            )}
            
            {selectedCounterparty && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '13px' }}>
                <strong>Выбран:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.type === 'legal' ? counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.company_name : counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.fio}
              </div>
            )}
          </div>

          {/* Итого и действия */}
          <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '2px solid #3498db' }}>
            {receiptData && (
              <div style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>💰 Итого: {receiptData.totalAmount.toFixed(2)} ₽</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Товаров: {receiptData.items.length}</div>
              </div>
            )}
            
            <button onClick={handleSell} disabled={!receiptData} style={{ ...buttonStyle, backgroundColor: receiptData ? '#27ae60' : '#95a5a6', color: 'white', width: '100%', marginBottom: '10px' }} className="glow-hover">✅ Продать</button>
            
            {receiptData && (
              <button onClick={() => setShowReceiptModal(true)} style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', width: '100%' }} className="glow-hover">🖨️ Печать чека</button>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно печати */}
      {showReceiptModal && receiptData && (
        <div className="modal-overlay modal-animate">
          <PrintReceiptModal receipt={receiptData} onClose={() => setShowReceiptModal(false)} token={token} />
        </div>
      )}
    </div>
  );
}

export default SellPartPage;