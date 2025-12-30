import React, { useState, useEffect } from 'react';

function InventoryModal({ onClose, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Для поиска по имени
  const [selectedCategory, setSelectedCategory] = useState(''); // Для фильтрации по категории
  const [selectedManufacturer, setSelectedManufacturer] = useState(''); // Для фильтрации по производителю
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);

  // <<<--- Загрузим категории и производителей для фильтров --->>>
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
        // setError(err.message); // Не будем показывать ошибку, если фильтры не загрузились
      }
    };

    fetchFilters();
  }, [token]);

  // <<<--- Загрузим список товаров --->>>
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

  // <<<--- Функция для фильтрации и поиска --->>>
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_name === selectedCategory;
    const matchesManufacturer = !selectedManufacturer || item.manufacturer_name === selectedManufacturer;
    return matchesSearch && matchesCategory && matchesManufacturer;
  });

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

        {/* <<<--- Вот тут добавим панель фильтров и поиска --->>> */}
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Поиск по наименованию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
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
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>QR-код</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Наименование</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Описание</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Количество</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Статус</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Локация</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Категория</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Производитель</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Кем создано</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Когда создано</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Когда обновлено</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.qr_code}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.description}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.status}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.location_name}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.category_name || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.manufacturer_name || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.created_by_username || 'N/A'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.created_at}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.updated_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryModal;