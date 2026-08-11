// IMS/src/components/PartsSelectorModal.jsx
import React, { useState, useMemo } from 'react';

function PartsSelectorModal({ parts = [], onClose, onSelect, multiple = true }) {
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
    if (!multiple) {
      onSelect([part]);
      onClose();
      return;
    }
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
            disabled={multiple && selected.length === 0}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: multiple && selected.length === 0 ? '#bdc3c7' : '#e67e22', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: (multiple && selected.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {multiple ? `Добавить (${selected.length})` : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PartsSelectorModal;