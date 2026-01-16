import React, { useState, useEffect } from 'react';
import EditItemModal from './EditItemModal';

function InventoryModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // <<<--- Поиск по наименованию
  const [searchPartNumber, setSearchPartNumber] = useState(''); // <<<--- Новое состояние для поиска по part_number
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catsRes, mansRes] = await Promise.all([
          fetch('/api/lookup/categories', {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }),
          fetch('/api/lookup/manufacturers', {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }),
        ]);

        if (!catsRes.ok || !mansRes.ok) {
          throw new Error('Failed to load filters');
        }

        const catsData = await catsRes.json();
        const mansData = await mansRes.json();

        setCategories(catsData);
        setManufacturers(mansData);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };

    fetchFilters();
  }, [token]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
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

  // <<<--- Обновленная фильтрация с учётом part_number --->
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartNumber = item.part_number && item.part_number.toLowerCase().includes(searchPartNumber.toLowerCase()); // <<<--- Вот тут
    const matchesCategory = !selectedCategory || item.category_name === selectedCategory;
    const matchesManufacturer = !selectedManufacturer || item.manufacturer_name === selectedManufacturer;
    return matchesSearch && (matchesPartNumber || !searchPartNumber) && matchesCategory && matchesManufacturer; // <<<--- Вот тут
  });

  const handleItemUpdated = (updatedItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  // <<<--- Функция для удаления позиции --->
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setItems(prev => prev.filter(item => item.id !== itemId));
      alert('Позиция успешно удалена');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(`Ошибка при удалении: ${err.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (error) {
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
          width: '600px',
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
            <h3>Журнал склада</h3>
            <button
              onClick={onClose}
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
          <div style={{ color: 'red' }}>
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

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
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>Журнал склада</h3>
          <button
            onClick={onClose}
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

        {/* Фильтры */}
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Поиск по наименованию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <input
              type="text"
              placeholder="Поиск по Part Number..."
              value={searchPartNumber}
              onChange={(e) => setSearchPartNumber(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '150px',
              }}
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <select
              value={selectedManufacturer}
              onChange={(e) => setSelectedManufacturer(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '150px',
              }}
            >
              <option value="">Все производители</option>
              {manufacturers.map(man => (
                <option key={man.id} value={man.name}>{man.name}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Найдено: {filteredItems.length} позиций
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
        }}>
          {filteredItems.length === 0 ? (
            <p>Нет позиций, соответствующих фильтрам.</p>
          ) : (
            <div style={{
              overflowX: 'auto',
              minWidth: '100%',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>QR-код</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Наименование</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Описание</th>
                    <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>Количество</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Статус</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Локация</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Категория</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Производитель</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Part Number</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Модель машины</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>VIN номер</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Создано</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Дата создания</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Дата обновления</th>
                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} style={{ backgroundColor: item.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.qr_code}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.description}</td>
                      <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.status}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.location_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.category_name || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.manufacturer_name || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.part_number || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.car_model || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.vin_number || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.created_by_username || 'N/A'}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.created_at}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{item.updated_at}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7', display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => setEditingItem(item)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          token={token}
          onItemUpdated={handleItemUpdated}
        />
      )}
    </div>
  );
}

export default InventoryModal;