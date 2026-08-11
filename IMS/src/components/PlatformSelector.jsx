// IMS/src/components/PlatformSelector.jsx
import React, { useState, useEffect } from 'react';

function PlatformSelector({ token, onSelect, selectedPlatform, disabled = false }) {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredPlatforms, setFilteredPlatforms] = useState([]);

  useEffect(() => {
    fetchPlatforms();
  }, [token]);

  useEffect(() => {
    if (search) {
      const filtered = platforms.filter(p => 
        p.platform_name.toLowerCase().includes(search.toLowerCase()) ||
        p.platform_code.toLowerCase().includes(search.toLowerCase()) ||
        p.manufacturer.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredPlatforms(filtered);
    } else {
      setFilteredPlatforms(platforms);
    }
  }, [search, platforms]);

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/platforms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlatforms(data);
        setFilteredPlatforms(data);
      }
    } catch (err) {
      console.error('Error fetching platforms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (platform) => {
    if (onSelect) onSelect(platform);
    setShowDropdown(false);
    setSearch('');
  };

  const containerStyle = {
    position: 'relative',
    width: '100%',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: disabled ? '#f5f5f5' : 'white',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    marginTop: '5px',
  };

  const itemStyle = (isSelected) => ({
    padding: '10px 12px',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#e3f2fd' : 'white',
    borderBottom: '1px solid #f0f0f0',
    transition: 'all 0.2s',
  });

  const badgeStyle = (manufacturer) => {
    const colors = {
      'Nissan': '#e74c3c',
      'Toyota': '#3498db',
      'Honda': '#27ae60',
      'BMW': '#9b59b6',
      'Mercedes-Benz': '#f39c12',
      'Volkswagen': '#34495e',
    };
    return {
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '600',
      color: 'white',
      backgroundColor: colors[manufacturer] || '#95a5a6',
      marginLeft: '8px',
    };
  };

  return (
    <div style={containerStyle}>
      <input
        type="text"
        placeholder={selectedPlatform ? `${selectedPlatform.platform_name} (${selectedPlatform.platform_code})` : 'Выберите платформу...'}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onClick={() => setShowDropdown(true)}
        style={inputStyle}
        disabled={disabled}
        readOnly
      />
      
      {showDropdown && (
        <div style={dropdownStyle}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>⏳ Загрузка...</div>
          ) : filteredPlatforms.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Платформы не найдены</div>
          ) : (
            filteredPlatforms.map(platform => (
              <div
                key={platform.platform_code}
                style={itemStyle(selectedPlatform?.platform_code === platform.platform_code)}
                onClick={() => handleSelect(platform)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedPlatform?.platform_code === platform.platform_code ? '#e3f2fd' : 'white';
                }}
              >
                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                  {platform.platform_name}
                  <span style={badgeStyle(platform.manufacturer)}>{platform.manufacturer}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {platform.platform_code} • {platform.years_active?.[0] || '?'}-{platform.years_active?.[1] || '?'}
                </div>
                {platform.description && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    {platform.description.slice(0, 100)}{platform.description.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Закрытие dropdown при клике вне */}
      {showDropdown && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

export default PlatformSelector;