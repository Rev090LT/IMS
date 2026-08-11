// IMS/src/components/ServiceSelectorModal.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';

function ServiceSelectorModal({ token, services = [], servicesByCategory = {}, onClose, onSelect, multiple = true }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedServices, setSelectedServices] = useState([]);
  const [visibleCount, setVisibleCount] = useState(50); // 🔥 Пагинация для производительности

  // 🔧 Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 🔧 Сброс при изменении фильтров
  useEffect(() => {
    setVisibleCount(50);
  }, [search, selectedCategory]);

  // 🔧 Фильтрация услуг с мемоизацией
  const filteredServices = useMemo(() => {
    let list = Array.isArray(services) ? services : [];
    
    if (selectedCategory !== 'all') {
      list = list.filter(s => s.category === selectedCategory);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => 
        s.name?.toLowerCase().includes(q) || 
        s.full_name?.toLowerCase().includes(q) ||
        s.service_code?.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [services, selectedCategory, search]);

  // 🔧 Видимая часть списка (пагинация)
  const visibleServices = useMemo(() => {
    return filteredServices.slice(0, visibleCount);
  }, [filteredServices, visibleCount]);

  // 🔧 Категории для фильтра
  const categories = useMemo(() => {
    const cats = Array.isArray(services) 
      ? [...new Set(services.map(s => s.category).filter(Boolean))]
      : [];
    return ['all', ...cats.sort()];
  }, [services]);

  // 🔧 Переключение выбора услуги
  const toggleService = useCallback((service) => {
    if (!multiple) {
      onSelect(service);
      onClose();
      return;
    }
    
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  }, [multiple, onSelect, onClose]);

  // 🔧 Выбор всех видимых услуг
  const selectAllVisible = () => {
    if (!multiple) return;
    const newSelected = visibleServices.filter(
      s => !selectedServices.some(sel => sel.id === s.id)
    );
    setSelectedServices(prev => [...prev, ...newSelected]);
  };

  // 🔧 Очистить выбор
  const clearSelection = () => {
    setSelectedServices([]);
  };

  // 🔧 Подтверждение выбора
  const handleConfirm = () => {
    if (selectedServices.length === 0) {
      onClose();
      return;
    }
    onSelect(multiple ? selectedServices : selectedServices[0]);
    onClose();
  };

  // 🔧 Закрытие по клику вне модалки
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // 🔧 Загрузка ещё (пагинация)
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 50, filteredServices.length));
  };

  // 🔧 Форматирование цены
  const formatPrice = (price) => {
    if (!price || price <= 0) return null;
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '15px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        animation: 'slideIn 0.2s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* 🔹 Header */}
        <div style={{ 
          padding: '15px 20px', 
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <h3 id="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>📚 Выбор услуг</h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              Найдено: <strong>{filteredServices.length}</strong> из {services.length}
              {selectedCategory !== 'all' && ` • Категория: ${selectedCategory}`}
              {search && ` • Поиск: "${search}"`}
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', fontSize: '28px', 
              cursor: 'pointer', color: '#666', lineHeight: 1,
              padding: '4px 8px', borderRadius: '4px',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* 🔹 Filters */}
        <div style={{ 
          padding: '12px 20px', 
          borderBottom: '1px solid #eee', 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>🔍</span>
            <input
              type="text"
              placeholder="Поиск по названию, коду..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', paddingLeft: '32px', paddingRight: '12px',
                padding: '10px 12px', border: '1px solid #ddd',
                borderRadius: '6px', fontSize: '14px',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              aria-label="Поиск услуг"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ 
              padding: '10px 12px', border: '1px solid #ddd',
              borderRadius: '6px', fontSize: '14px', minWidth: '180px',
              backgroundColor: 'white', cursor: 'pointer'
            }}
            aria-label="Фильтр по категории"
          >
            <option value="all">📁 Все категории</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {multiple && filteredServices.length > 0 && (
            <button
              onClick={selectAllVisible}
              style={{ 
                padding: '10px 14px', backgroundColor: '#3498db',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
            >
              Выбрать все ({visibleServices.length})
            </button>
          )}
          
          {selectedServices.length > 0 && (
            <button
              onClick={clearSelection}
              style={{ 
                padding: '10px 14px', backgroundColor: '#e74c3c',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
              }}
            >
              Очистить ({selectedServices.length})
            </button>
          )}
        </div>

        {/* 🔹 Services List */}
        <div style={{ 
          flex: 1, overflowY: 'auto', padding: '10px 20px',
          minHeight: '150px', maxHeight: '45vh'
        }}>
          {filteredServices.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                {search || selectedCategory !== 'all' ? '🔍' : '📭'}
              </div>
              <p style={{ margin: 0, fontWeight: '500' }}>
                {search || selectedCategory !== 'all' 
                  ? 'Услуги не найдены' 
                  : 'Справочник пуст'}
              </p>
              {(search || selectedCategory !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                  style={{ 
                    marginTop: '10px', padding: '8px 16px',
                    backgroundColor: '#3498db', color: 'white',
                    border: 'none', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {visibleServices.map(service => {
                  const isSelected = selectedServices.some(s => s.id === service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleService(service)}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isSelected}
                      style={{
                        padding: '12px 15px',
                        border: `2px solid ${isSelected ? '#27ae60' : '#e0e0e0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#f0fdf4' : 'white',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#bdc3c7';
                          e.currentTarget.style.backgroundColor = '#fafafa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                      onFocus={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#3498db';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: '500', marginBottom: '4px', 
                          display: 'flex', alignItems: 'center', gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span>{service.name}</span>
                          {service.service_code && (
                            <span style={{ 
                              fontSize: '11px', color: '#999', 
                              backgroundColor: '#f5f5f5', padding: '2px 6px',
                              borderRadius: '4px', fontWeight: 'normal'
                            }}>
                              {service.service_code}
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '13px', color: '#666', 
                          display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center'
                        }}>
                          {service.category && (
                            <span style={{ 
                              backgroundColor: '#ebf5fb', color: '#2980b9',
                              padding: '2px 8px', borderRadius: '4px', fontSize: '12px'
                            }}>
                              📁 {service.category}
                            </span>
                          )}
                          <span>⏱ {service.labor_hours || 0} ч</span>
                          {service.base_price > 0 && (
                            <span>💰 {formatPrice(service.base_price)}</span>
                          )}
                        </div>
                        {service.full_name && (
                          <p style={{ 
                            margin: '6px 0 0', fontSize: '12px', color: '#999',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', maxWidth: '100%'
                          }}>
                            {service.full_name}
                          </p>
                        )}
                      </div>
                      
                      {/* ✅ Индикатор выбора */}
                      <div style={{ 
                        display: 'flex', alignItems: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected ? (
                          <span style={{ 
                            color: '#27ae60', fontWeight: 'bold', fontSize: '20px',
                            animation: 'popIn 0.2s ease'
                          }}>
                            ✓
                          </span>
                        ) : (
                          <span style={{ 
                            width: '20px', height: '20px',
                            border: '2px solid #ccc', borderRadius: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', color: 'transparent',
                            transition: 'all 0.15s'
                          }}>
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 🔽 Кнопка "Загрузить ещё" */}
              {visibleCount < filteredServices.length && (
                <div style={{ textAlign: 'center', padding: '15px 0' }}>
                  <button
                    onClick={loadMore}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#f8f9fa',
                      color: '#3498db',
                      border: '2px solid #3498db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3498db';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.color = '#3498db';
                    }}
                  >
                    Загрузить ещё ({filteredServices.length - visibleCount})
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 🔹 Footer */}
        <div style={{ 
          padding: '15px 20px', 
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {multiple && selectedServices.length > 0 && (
              <span>
                ✅ Выбрано: <strong style={{ color: '#27ae60' }}>{selectedServices.length}</strong>
              </span>
            )}
            {!multiple && filteredServices.length > 0 && (
              <span style={{ color: '#999' }}>
                💡 Нажмите на услугу для выбора • Enter — подтвердить • Esc — закрыть
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ 
                padding: '10px 20px', backgroundColor: '#95a5a6',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7f8c8d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#95a5a6'}
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              disabled={multiple && selectedServices.length === 0}
              style={{ 
                padding: '10px 24px', 
                backgroundColor: multiple && selectedServices.length === 0 ? '#bdc3c7' : '#27ae60',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: (multiple && selectedServices.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: '600',
                transition: 'background 0.15s',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                if (!(multiple && selectedServices.length === 0)) {
                  e.currentTarget.style.backgroundColor = '#219a52';
                }
              }}
              onMouseLeave={(e) => {
                if (!(multiple && selectedServices.length === 0)) {
                  e.currentTarget.style.backgroundColor = multiple && selectedServices.length === 0 ? '#bdc3c7' : '#27ae60';
                }
              }}
            >
              {multiple 
                ? `Добавить (${selectedServices.length})` 
                : 'Добавить'}
            </button>
          </div>
        </div>

      </div>
      
      {/* 🔹 Анимации */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default ServiceSelectorModal;