// IMS/src/components/InventoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemCardModal from './ItemCard';
import EditItemModal from './EditItemModal';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';

function InventoryPage({ token }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPartNumber, setSearchPartNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  
  // Выбранный элемент и режим просмотра (для мобильных)
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Модальные окна
  const [editingItem, setEditingItem] = useState(null);
  const [viewCardItem, setViewCardItem] = useState(null);
  
  // Состояние для полей продажи (пустые по умолчанию)
  const [saleQuantity, setSaleQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');
  
  // Загрузка фильтров
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catsRes, mansRes] = await Promise.all([
          fetch('/api/lookup/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/lookup/manufacturers', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
        ]);

        if (catsRes.ok) setCategories(await catsRes.json());
        if (mansRes.ok) setManufacturers(await mansRes.json());
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, [token]);

  // Загрузка товаров
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [token]);

  // Сброс полей продажи при выборе нового товара
  useEffect(() => {
    if (selectedItem) {
      setSaleQuantity('');
      setSalePrice('');
    }
  }, [selectedItem]);

  // Фильтрация
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartNumber = item.part_number?.toLowerCase().includes(searchPartNumber.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_name === selectedCategory;
    const matchesManufacturer = !selectedManufacturer || item.manufacturer_name === selectedManufacturer;
    return matchesSearch && (matchesPartNumber || !searchPartNumber) && matchesCategory && matchesManufacturer;
  });

  const handleItemUpdated = (updatedItem) => {
    setItems(prev => {
      const updated = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
      if (selectedItem && selectedItem.id === updatedItem.id) {
        setSelectedItem(updatedItem);
      }
      return updated;
    });
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту позицию?')) return;

    try {
      const checkResponse = await fetch(`/api/items/${itemId}/is-sold`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${checkResponse.status}`);
      }

      const { isSold } = await checkResponse.json();

      if (isSold) {
        alert('Нельзя удалить позицию, которая уже продавалась');
        return;
      }

      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setItems(prev => {
        const updated = prev.filter(item => item.id !== itemId);
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(updated.length > 0 ? updated[0] : null);
          setShowDetails(false);
        }
        return updated;
      });
      alert('Позиция успешно удалена');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(`Ошибка при удалении: ${err.message}`);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSaleQuantity('');
    setSalePrice('');
    setShowDetails(true);
  };

  const handleBackToList = () => {
    setShowDetails(false);
  };

  // Обработчики для полей продажи
  const handleQuantityChange = (value) => {
    setSaleQuantity(value);
  };

  const handlePriceChange = (value) => {
    setSalePrice(value);
  };

  const handleSellItem = async () => {
    if (!saleQuantity || !salePrice) {
      alert('Пожалуйста, заполните количество и цену');
      return;
    }

    const qty = parseInt(saleQuantity);
    const price = parseFloat(salePrice);

    if (qty > selectedItem.quantity) {
      alert('Недостаточно товара на складе');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          quantity: qty,
          selling_price: price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при продаже');
      }

      // Обновить список товаров
      const updatedItems = items.map(item => 
        item.id === selectedItem.id 
          ? { ...item, quantity: item.quantity - qty }
          : item
      );
      setItems(updatedItems);
      setSelectedItem(prev => prev ? { ...prev, quantity: prev.quantity - qty } : null);
      
      // Сбросить поля
      setSaleQuantity('');
      setSalePrice('');
      
      alert('Продажа успешно оформлена!');
    } catch (err) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Стили
  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    backgroundColor: 'white',
    padding: '12px 15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    position: 'sticky',
    top: 0,
  };

  const titleStyle = {
    margin: 0,
    fontSize: '18px',
    color: '#2c3e50',
    fontWeight: '600',
  };

  const headerButtonStyle = {
    padding: '8px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  };

  const mainContentStyle = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  };

  const leftPanelStyle = {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const filtersStyle = {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '8px',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const selectStyle = {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  };

  const itemListStyle = {
    flex: 1,
    overflowY: 'auto',
  };

  const itemRowStyle = (isSelected, index) => ({
    padding: '12px 15px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#e3f2fd' : 'white',
    transition: 'all 0.2s',
    animation: `tableRowFadeIn 0.3s ease forwards`,
    animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
    opacity: 0,
  });

  const itemTitleStyle = {
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: '4px',
    fontSize: '14px',
  };

  const itemSubtitleStyle = {
    fontSize: '12px',
    color: '#666',
  };

  const statsStyle = {
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e0e0e0',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
  };

  const rightPanelStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#fafafa',
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '15px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #3498db',
  };

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  };

  const infoFieldStyle = {
    display: 'flex',
    flexDirection: 'column',
  };

  const infoLabelStyle = {
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const infoValueStyle = {
    fontSize: '14px',
    color: '#2c3e50',
    fontWeight: '400',
    padding: '8px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0',
    flexWrap: 'wrap',
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    flex: '1',
    minWidth: '120px',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
  };

  // Стили для полей продажи
  const saleFormStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px dashed #ddd',
  };

  const smallInputStyle = {
    width: '70px',
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '13px',
  };

  const sellButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
  };

  // CSS для адаптивности + анимации
  const responsiveStyles = `
    @keyframes tableRowFadeIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @media (max-width: 768px) {
      .left-panel {
        max-width: 100% !important;
        border-right: none !important;
      }
      .right-panel {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 200;
        padding: 60px 15px 15px 15px !important;
        overflow-y: auto;
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      .mobile-back-button {
        display: block !important;
        margin-bottom: 15px;
        animation: slideInDown 0.3s ease forwards;
      }
    }
    
    @media (min-width: 769px) {
      .mobile-back-button { display: none !important; }
      .right-panel {
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
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
        <h1 style={titleStyle}>Номенклатура</h1>
        <button 
          onClick={() => navigate(-1)} 
          style={headerButtonStyle}
          className="glow-hover"
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          ← Назад
        </button>
      </header>

      {/* Основное содержимое */}
      <div style={mainContentStyle}>
        {/* Левая панель - список */}
        <div className="left-panel" style={leftPanelStyle}>
          {/* Фильтры */}
          <div style={filtersStyle} className="slide-in-left">
            <input
              type="text"
              placeholder="🔍 Поиск по наименованию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={inputStyle}
              className="fade-in"
            />
            <input
              type="text"
              placeholder="Part Number"
              value={searchPartNumber}
              onChange={(e) => setSearchPartNumber(e.target.value)}
              style={inputStyle}
              className="fade-in delay-1"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={selectStyle}
              className="fade-in delay-2"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Список элементов */}
          <div style={itemListStyle}>
            {filteredItems.length === 0 ? (
              <div style={emptyStateStyle} className="fade-in">
                <div className="bounce" style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
                <p>Нет позиций</p>
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  style={itemRowStyle(selectedItem && selectedItem.id === item.id, index)}
                  className="card-hover"
                >
                  <div style={itemTitleStyle}>{item.name}</div>
                  <div style={itemSubtitleStyle}>
                    {item.part_number && <span>PN: {item.part_number} | </span>}
                    <span>QR: {item.qr_code}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Статистика */}
          <div style={statsStyle} className="fade-in">
            Найдено: <strong>{filteredItems.length}</strong> из <strong>{items.length}</strong>
          </div>
        </div>

        {/* Правая панель - детали */}
        <div className="right-panel" style={{
          ...rightPanelStyle,
          display: showDetails || window.innerWidth > 768 ? 'block' : 'none'
        }}>
          {selectedItem ? (
            <>
              {/* Кнопка назад (только для мобильных) */}
              <button
                className="mobile-back-button glow-hover"
                onClick={handleBackToList}
                style={{
                  ...headerButtonStyle,
                  display: 'none',
                  marginBottom: '15px',
                  width: '100%',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                ← Назад к списку
              </button>

              {/* Основная информация */}
              <div style={cardStyle} className="inventory-card card-hover">
                <h2 style={cardTitleStyle}>📦 Основная информация</h2>
                <div style={infoGridStyle}>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>QR-код</span>
                    <span style={infoValueStyle} className="fade-in">{selectedItem.qr_code}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Part Number</span>
                    <span style={infoValueStyle} className="fade-in delay-1">{selectedItem.part_number || 'N/A'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Наименование</span>
                    <span style={{ ...infoValueStyle, fontWeight: '600' }} className="fade-in delay-2">{selectedItem.name}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Описание</span>
                    <span style={{ ...infoValueStyle, minHeight: '60px' }} className="fade-in delay-3">
                      {selectedItem.description || 'Нет описания'}
                    </span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Количество на складе</span>
                    <span style={{ ...infoValueStyle, fontWeight: '600', color: selectedItem.quantity > 0 ? '#27ae60' : '#e74c3c' }} className="fade-in delay-4">
                      {selectedItem.quantity} шт.
                    </span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Статус</span>
                    <span style={{ 
                      ...infoValueStyle, 
                      backgroundColor: selectedItem.status === 'warehouse' ? '#d4edda' : '#fff3cd',
                      color: selectedItem.status === 'warehouse' ? '#155724' : '#856404'
                    }} className="fade-in delay-5">
                      {selectedItem.status === 'warehouse' ? '📍 На складе' : selectedItem.status}
                    </span>
                  </div>
                </div>

                {/* Форма продажи с ПУСТЫМИ полями */}
                <div style={saleFormStyle}>
                  <label style={{ fontSize: '13px', fontWeight: '500' }}>
                    Продажа:
                  </label>
                  <input
                    type="number"
                    placeholder="Кол-во"
                    value={saleQuantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    min="1"
                    max={selectedItem.quantity}
                    style={smallInputStyle}
                  />
                  <input
                    type="number"
                    placeholder="Цена"
                    value={salePrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    min="0.01"
                    step="0.01"
                    style={{ ...smallInputStyle, width: '90px' }}
                  />
                  <button
                    onClick={handleSellItem}
                    style={sellButtonStyle}
                    className="glow-hover success"
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    💰 Продать
                  </button>
                </div>

                {/* Кнопки действий */}
                <div style={actionButtonsStyle}>
                  <button
                    onClick={() => setViewCardItem(selectedItem)}
                    style={{ ...buttonStyle, backgroundColor: '#9b59b6', color: 'white' }}
                    className="glow-hover"
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    👁️ Карточка
                  </button>
                  <button
                    onClick={() => setEditingItem(selectedItem)}
                    style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white' }}
                    className="glow-hover"
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    style={{ ...buttonStyle, backgroundColor: '#e74c3c', color: 'white' }}
                    className="glow-hover danger"
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Дополнительная информация */}
              <div style={cardStyle} className="inventory-card card-hover">
                <h2 style={cardTitleStyle}>🔧 Дополнительно</h2>
                <div style={infoGridStyle}>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Автомобиль</span>
                    <span style={infoValueStyle} className="fade-in">{selectedItem.car_model || 'Не указано'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>VIN номер</span>
                    <span style={infoValueStyle} className="fade-in delay-1">{selectedItem.vin_number || 'Не указано'}</span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Создано</span>
                    <span style={infoValueStyle} className="fade-in delay-2">
                      {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString('ru-RU') : 'N/A'}
                    </span>
                  </div>
                  <div style={infoFieldStyle}>
                    <span style={infoLabelStyle}>Обновлено</span>
                    <span style={infoValueStyle} className="fade-in delay-3">
                      {selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleString('ru-RU') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Фотографии - ИНТЕГРАЦИЯ КОМПОНЕНТОВ */}
              <div style={cardStyle} className="inventory-card card-hover">
                <h2 style={cardTitleStyle}>📷 Фотографии</h2>
                
                {/* Загрузка фото */}
                <PhotoUpload
                  itemId={selectedItem.id}
                  token={token}
                  onPhotoUploaded={() => {
                    // Можно добавить обновление галереи если нужно
                  }}
                />
                
                {/* Галерея фото */}
                <PhotoGallery
                  itemId={selectedItem.id}
                  token={token}
                />
              </div>
            </>
          ) : (
            <div style={cardStyle} className="scale-in">
              <div style={emptyStateStyle}>
                <div className="bounce" style={{ fontSize: '64px', marginBottom: '15px' }}>👈</div>
                <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Выберите запчасть</h3>
                <p style={{ color: '#666' }}>Кликните на элемент в списке</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна с анимацией */}
      {editingItem && (
        <div className="modal-overlay modal-animate">
          <EditItemModal
            item={editingItem}
            onClose={() => {
              setEditingItem(null);
              if (window.innerWidth <= 768) setShowDetails(false);
            }}
            token={token}
            onItemUpdated={handleItemUpdated}
          />
        </div>
      )}

      {viewCardItem && (
        <div className="modal-overlay modal-animate">
          <ItemCardModal
            item={viewCardItem}
            onClose={() => {
              setViewCardItem(null);
              if (window.innerWidth <= 768) setShowDetails(false);
            }}
            token={token}
          />
        </div>
      )}
    </div>
  );
}

export default InventoryPage;