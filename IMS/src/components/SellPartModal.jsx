import { useState, useEffect } from 'react';
import PrintReceiptModal from './PrintReceiptModal';

function SellPartModal({ onClose, token }) {
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
    inn: '',
    kpp: '',
    ogrn: '',
    company_name: '',
    legal_address: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', 
    inn: '', 
    ogrn: '', 
    kpp: '', 
    legal_address: '', 
    actual_address: '' 
  });
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [seller, setSeller] = useState('ИП Иванов И.И.');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // <<<--- Загрузим товары --->
        let response = await fetch('/api/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        let data = await response.json();
        let availableItems = data.filter(item => item.status === 'available' || item.status === 'warehouse');
        setItems(availableItems);

        // <<<--- Загрузим контрагентов --->
        response = await fetch('/api/items/counterparties', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch counterparties');
        }

        data = await response.json();
        setCounterparties(data);

        // <<<--- Загрузим поставщиков --->
        response = await fetch('/api/items/suppliers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }

        data = await response.json();
        setSuppliers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // <<<--- Добавить товар в список --->
  const handleAddItem = (itemId) => {
    const item = items.find(i => i.id === parseInt(itemId));
    if (item) { // <<<--- Убрали проверку !selectedItems.some(si => si.id === item.id)
      // <<<--- Добавим товар с количеством 1 и ценой 0 --->
      setSelectedItems(prev => [...prev, { ...item, quantity: 1, selling_price: 0 }]);
    }
  };

  // <<<--- Удалить товар из списка --->
  const handleRemoveItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // <<<--- Изменить количество --->
  const handlePriceChange = (itemId, newPrice) => {
    setSelectedItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, selling_price: parseFloat(newPrice) || 0 } : item)
    );
  };

  // <<<--- Изменить количество --->
  const handleQuantityChange = (itemId, newQuantity) => {
    setSelectedItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, parseInt(newQuantity) || 1) } : item)
    );
  };

  // <<<--- Обновить данные нового контрагента --->
  const handleNewCounterpartyChange = (field, value) => {
    setNewCounterparty(prev => ({ ...prev, [field]: value }));
  };

  // <<<--- Добавить нового контрагента --->
  const handleAddNewCounterparty = async () => {
    if (newCounterparty.type === 'legal' && (!newCounterparty.company_name || !newCounterparty.inn || !newCounterparty.legal_address)) {
      setError('Company name, INN, and legal address are required for legal entities');
      return;
    }

    if (newCounterparty.type === 'physical' && !newCounterparty.fio) {
      setError('FIO is required for physical persons');
      return;
    }

    try {
      const response = await fetch('/api/items/counterparties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCounterparty),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add counterparty');
      }

      // <<<--- Обновим список контрагентов --->
      setCounterparties(prev => [data, ...prev]);
      setSelectedCounterparty(data.id.toString());

      // <<<--- Очистим форму --->
      setNewCounterparty({ 
        type: 'physical', 
        fio: '', 
        phone: '', 
        email: '', 
        address: '',
        inn: '',
        kpp: '',
        ogrn: '',
        company_name: '',
        legal_address: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // <<<--- Обновить данные нового поставщика --->
  const handleNewSupplierChange = (field, value) => {
    setNewSupplier(prev => ({ ...prev, [field]: value }));
  };

  // <<<--- Добавить нового поставщика --->
  const handleAddNewSupplier = async () => {
    if (!newSupplier.name || !newSupplier.inn || !newSupplier.legal_address) {
      setError('Name, INN, and legal address are required for supplier');
      return;
    }

    try {
      const response = await fetch('/api/items/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSupplier),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add supplier');
      }

      // <<<--- Обновим список поставщиков --->
      setSuppliers(prev => [data, ...prev]);
      setSelectedSupplier(data.id.toString());

      // <<<--- Очистим форму --->
      setNewSupplier({ 
        name: '', 
        inn: '', 
        ogrn: '', 
        kpp: '', 
        legal_address: '', 
        actual_address: '' 
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // <<<--- Подсчитать итого --->
  const handleCalculateTotal = () => {
    if (selectedItems.length === 0) {
      setError('Добавьте хотя бы один товар');
      return;
    }

    const allPricesFilled = selectedItems.every(item => item.selling_price > 0);
    if (!allPricesFilled) {
      setError('Введите цену для всех товаров');
      return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    
    const receipt = {
      items: selectedItems.map(item => ({
        item: item,
        quantity: item.quantity,
        selling_price: item.selling_price
      })),
      totalAmount: totalAmount,
      sale_date: saleDate,
      seller: suppliers.find(s => s.id === parseInt(selectedSupplier))?.name || seller,
      counterparty: counterparties.find(cp => cp.id === parseInt(selectedCounterparty)) || null
    };

    setReceiptData(receipt);
    setSuccess('Итого: ' + totalAmount.toFixed(2) + ' руб');
  };

  const handleSell = async () => {
    if (!receiptData) {
      setError('Подсчитайте итого');
      return;
    }

    try {
      const response = await fetch('/api/items/sell-part', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: selectedItems.map(item => ({
            item_id: item.id,
            quantity: item.quantity,
            selling_price: item.selling_price
          })),
          total_amount: receiptData.totalAmount,
          counterparty_id: selectedCounterparty ? parseInt(selectedCounterparty) : null,
          supplier_id: selectedSupplier ? parseInt(selectedSupplier) : null
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sell items');
      }

      setSuccess('Запчасти успешно проданы!');

      // <<<--- Очистим все данные после успешной продажи --->
      setTimeout(() => {
        setSelectedItems([]);
        setSelectedCounterparty('');
        setNewCounterparty({ 
          type: 'physical', 
          fio: '', 
          phone: '', 
          email: '', 
          address: '',
          inn: '',
          kpp: '',
          ogrn: '',
          company_name: '',
          legal_address: ''
        });
        setSelectedSupplier('');
        setNewSupplier({ 
          name: '', 
          inn: '', 
          ogrn: '', 
          kpp: '', 
          legal_address: '', 
          actual_address: '' 
        });
        setSaleDate(new Date().toISOString().split('T')[0]);
        setSeller('ИП Иванов И.И.');
        setReceiptData(null);
        
        // <<<--- Удалим сохранённые данные из localStorage --->
        localStorage.removeItem('sellPartModalData');
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePrintReceipt = () => {
    if (receiptData) {
      setShowReceiptModal(true);
    }
  };

  // <<<--- Сохранить данные при закрытии --->
  const handleClose = () => {
    // <<<--- Сохраняем все введённые данные в localStorage --->
    localStorage.setItem('sellPartModalData', JSON.stringify({
      selectedItems,
      selectedCounterparty,
      newCounterparty,
      selectedSupplier,
      newSupplier,
      saleDate,
      seller
    }));
    onClose();
  };

  // <<<--- Восстановить данные при открытии --->
  useEffect(() => {
    const savedData = localStorage.getItem('sellPartModalData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSelectedItems(parsed.selectedItems || []);
        setSelectedCounterparty(parsed.selectedCounterparty || '');
        setNewCounterparty(parsed.newCounterparty || { 
          type: 'physical', 
          fio: '', 
          phone: '', 
          email: '', 
          address: '',
          inn: '',
          kpp: '',
          ogrn: '',
          company_name: '',
          legal_address: ''
        });
        setSelectedSupplier(parsed.selectedSupplier || '');
        setNewSupplier(parsed.newSupplier || { 
          name: '', 
          inn: '', 
          ogrn: '', 
          kpp: '', 
          legal_address: '', 
          actual_address: '' 
        });
        setSaleDate(parsed.saleDate || new Date().toISOString().split('T')[0]);
        setSeller(parsed.seller || 'ИП Иванов И.И.');
      } catch (e) {
        console.error('Error parsing saved ', e);
      }
    }
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div className="modal-content" style={{
        width: '1200px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>Продажа запчастей</h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div style={{
            color: 'red',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            border: '1px solid red',
            borderRadius: '4px',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            color: 'green',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#e6ffe6',
            border: '1px solid green',
            borderRadius: '4px',
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '15px' }}>
              <label>Выберите запчасть:</label>
              <select
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">Выберите запчасть</option>
                {items.map(item => ( // <<<--- Убрали .filter(item => !selectedItems.some(si => si.id === item.id))
                  <option key={item.id} value={item.id}>
                    {item.name} (Кол-во: {item.quantity}, VIN: {item.vin_number})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const selectElement = document.querySelector('select');
                  if (selectElement.value) {
                    handleAddItem(parseInt(selectElement.value));
                    selectElement.value = '';
                  }
                }}
                style={{
                  marginTop: '5px',
                  padding: '5px 10px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Добавить
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h4>Выбранные запчасти:</h4>
              <ul style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
                {selectedItems.map(item => (
                  <li key={item.id} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p><strong>{item.name}</strong> (VIN: {item.vin_number})</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>Кол-во:</span>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        min=""
                        max={item.quantity}
                        style={{
                          width: '60px',
                          padding: '2px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                      <span>Цена:</span>
                      <input
                        type="number"
                        value={item.selling_price || ''}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        min="0.01"
                        step="0.01"
                        style={{
                          width: '80px',
                          padding: '2px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        style={{
                          padding: '2px 5px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Дата продажи:</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>

            <button
              onClick={handleCalculateTotal}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Подсчитать итого
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '15px' }}>
              <label>Выберите поставщика:</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">Новый поставщик</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.inn})
                  </option>
                ))}
              </select>
            </div>

            {selectedSupplier === '' && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Новый поставщик:</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label>Название:</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => handleNewSupplierChange('name', e.target.value)}
                    placeholder="Введите название"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>ИНН:</label>
                  <input
                    type="text"
                    value={newSupplier.inn}
                    onChange={(e) => handleNewSupplierChange('inn', e.target.value)}
                    placeholder="Введите ИНН"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>КПП:</label>
                  <input
                    type="text"
                    value={newSupplier.kpp}
                    onChange={(e) => handleNewSupplierChange('kpp', e.target.value)}
                    placeholder="Введите КПП"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>ОГРН:</label>
                  <input
                    type="text"
                    value={newSupplier.ogrn}
                    onChange={(e) => handleNewSupplierChange('ogrn', e.target.value)}
                    placeholder="Введите ОГРН"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Юридический адрес:</label>
                  <textarea
                    value={newSupplier.legal_address}
                    onChange={(e) => handleNewSupplierChange('legal_address', e.target.value)}
                    placeholder="Введите юридический адрес"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Фактический адрес:</label>
                  <textarea
                    value={newSupplier.actual_address}
                    onChange={(e) => handleNewSupplierChange('actual_address', e.target.value)}
                    placeholder="Введите фактический адрес"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddNewSupplier}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Добавить поставщика
                </button>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label>Выберите контрагента:</label>
              <select
                value={selectedCounterparty}
                onChange={(e) => setSelectedCounterparty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">Новый контрагент</option>
                {counterparties.map(cp => (
                  <option key={cp.id} value={cp.id}>
                    {cp.type === 'legal' ? cp.company_name : cp.fio} ({cp.phone || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            {selectedCounterparty === '' && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Новый контрагент:</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label>Тип:</label>
                  <select
                    value={newCounterparty.type}
                    onChange={(e) => handleNewCounterpartyChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="physical">Физическое лицо</option>
                    <option value="legal">Юридическое лицо</option>
                  </select>
                </div>

                {newCounterparty.type === 'physical' && (
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      <label>ФИО:</label>
                      <input
                        type="text"
                        value={newCounterparty.fio}
                        onChange={(e) => handleNewCounterpartyChange('fio', e.target.value)}
                        placeholder="Введите ФИО"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {newCounterparty.type === 'legal' && (
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      <label>Название компании:</label>
                      <input
                        type="text"
                        value={newCounterparty.company_name}
                        onChange={(e) => handleNewCounterpartyChange('company_name', e.target.value)}
                        placeholder="Введите название компании"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label>ИНН:</label>
                      <input
                        type="text"
                        value={newCounterparty.inn}
                        onChange={(e) => handleNewCounterpartyChange('inn', e.target.value)}
                        placeholder="Введите ИНН"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label>КПП:</label>
                      <input
                        type="text"
                        value={newCounterparty.kpp}
                        onChange={(e) => handleNewCounterpartyChange('kpp', e.target.value)}
                        placeholder="Введите КПП"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label>ОГРН:</label>
                      <input
                        type="text"
                        value={newCounterparty.ogrn}
                        onChange={(e) => handleNewCounterpartyChange('ogrn', e.target.value)}
                        placeholder="Введите ОГРН"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label>Юридический адрес:</label>
                      <textarea
                        value={newCounterparty.legal_address}
                        onChange={(e) => handleNewCounterpartyChange('legal_address', e.target.value)}
                        placeholder="Введите юридический адрес"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '10px' }}>
                  <label>Телефон:</label>
                  <input
                    type="tel"
                    value={newCounterparty.phone}
                    onChange={(e) => handleNewCounterpartyChange('phone', e.target.value)}
                    placeholder="Введите телефон"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Email:</label>
                  <input
                    type="email"
                    value={newCounterparty.email}
                    onChange={(e) => handleNewCounterpartyChange('email', e.target.value)}
                    placeholder="Введите email"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label>Адрес:</label>
                  <textarea
                    value={newCounterparty.address}
                    onChange={(e) => handleNewCounterpartyChange('address', e.target.value)}
                    placeholder="Введите адрес"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddNewCounterparty}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Добавить контрагента
                </button>
              </div>
            )}

            {selectedCounterparty && (
              <div style={{ marginBottom: '15px' }}>
                <h4>Выбранный контрагент:</h4>
                {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.type === 'legal' ? (
                  <>
                    <p><strong>Название компании:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.company_name}</p>
                    <p><strong>ИНН:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.inn || 'N/A'}</p>
                    <p><strong>КПП:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.kpp || 'N/A'}</p>
                    <p><strong>ОГРН:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.ogrn || 'N/A'}</p>
                    <p><strong>Юридический адрес:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.legal_address || 'N/A'}</p>
                  </>
                ) : (
                  <p><strong>ФИО:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.fio}</p>
                )}
                <p><strong>Телефон:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.email || 'N/A'}</p>
                <p><strong>Адрес:</strong> {counterparties.find(cp => cp.id === parseInt(selectedCounterparty))?.address || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSell}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Продать
          </button>
          {receiptData && (
            <button
              onClick={handlePrintReceipt}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Печать чека
            </button>
          )}
        </div>
      </div>

      {showReceiptModal && receiptData && (
        <PrintReceiptModal
          receipt={receiptData}
          onClose={() => setShowReceiptModal(false)}
          token={token}
        />
      )}
    </div>
  );
}

export default SellPartModal;