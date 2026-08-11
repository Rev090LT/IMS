import React, { useState, useEffect } from 'react';

function ServiceSelectorModal({ isOpen, onClose, onSelect }) {
  const [services, setServices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/services')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setServices(data.data);
            setGroups(data.groups || []);
          }
        })
        .catch(err => console.error('Error loading services:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = selectedGroup === 'all' || s.category === selectedGroup;
    return matchSearch && matchGroup;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>📚 Справочник услуг</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <input 
          type="text" 
          placeholder="🔍 Поиск услуги..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
        
        <select 
          value={selectedGroup} 
          onChange={e => setSelectedGroup(e.target.value)}
          style={{ padding: '8px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">Все категории</option>
          {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <p>Загрузка...</p>
          ) : filtered.length === 0 ? (
            <p>Ничего не найдено</p>
          ) : (
            filtered.map(service => (
              <div 
                key={service.id} 
                onClick={() => { onSelect(service); onClose(); }}
                style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #eee', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <strong>{service.name}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>{service.category}</div>
                </div>
                {service.laborHours && (
                  <span style={{ background: '#e3f2fd', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                    {service.laborHours} ч
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          Найдено: {filtered.length} из {services.length}
        </div>
      </div>
    </div>
  );
}

export default ServiceSelectorModal;