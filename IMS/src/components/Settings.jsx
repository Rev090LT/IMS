// IMS/src/pages/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Settings({ token }) {
  const navigate = useNavigate();
  const textareaRef = useRef();
  
  // === ГЛАВНЫЕ РАЗДЕЛЫ ===
  const [mainSection, setMainSection] = useState('system'); // 'system' или 'admin'
  
  // === НАСТРОЙКИ ===
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // === АДМИН-ПАНЕЛЬ ===
  const [activeSection, setActiveSection] = useState('sqlConsole');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logError, setLogError] = useState('');
  
  // Журнал действий пользователей
  const [userLogs, setUserLogs] = useState([]);
  const [userLogLoading, setUserLogLoading] = useState(false);
  const [userLogError, setUserLogError] = useState('');
  const [userLogFilter, setUserLogFilter] = useState({
    action: '',
    date_from: '',
    date_to: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  // ==================== НАСТРОЙКИ: ФУНКЦИИ ====================
  
  useEffect(() => {
    if (mainSection === 'system') {
      fetchSettings();
    }
  }, [mainSection]);

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    setSettingsSaving(true);
    setSettingsMessage('');
    
    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      });
      
      if (response.ok) {
        setSettingsMessage(`✅ Настройка "${key}" обновлена`);
        fetchSettings();
      } else {
        const err = await response.json();
        setSettingsMessage(`❌ Ошибка: ${err.error}`);
      }
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      setSettingsMessage('❌ Ошибка сети');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ==================== АДМИНКА: ФУНКЦИИ ====================

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Введите SQL-запрос');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('SQL Query Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogLoading(true);
    setLogError('');

    try {
      const response = await fetch('/api/node-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('Node Logs Error:', err);
      setLogError(err.message);
    } finally {
      setLogLoading(false);
    }
  };

  const fetchUserActivityLogs = async () => {
    setUserLogLoading(true);
    setUserLogError('');

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...userLogFilter,
      });

      const response = await fetch(`/api/logs/user-activity?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('User Activity Logs Error:', err);
      setUserLogError(err.message);
    } finally {
      setUserLogLoading(false);
    }
  };

  useEffect(() => {
    if (mainSection === 'admin') {
      if (activeSection === 'nodeLogConsole') {
        fetchLogs();
      }
      if (activeSection === 'userActivityLogs') {
        fetchUserActivityLogs();
      }
    }
  }, [mainSection, activeSection, pagination.page]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      executeQuery();
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());

    if (!userData.username || !userData.password || !userData.role) {
      alert('Заполните все поля');
      return;
    }

    try {
      const response = await fetch('/api/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      alert('✅ Пользователь успешно создан');
    } catch (err) {
      console.error('Create User Error:', err);
      alert(`❌ Ошибка: ${err.message}`);
    }
  };

  const handleUserLogFilterChange = (e) => {
    setUserLogFilter({ ...userLogFilter, [e.target.name]: e.target.value });
  };

  const handleUserLogSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchUserActivityLogs();
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE_ITEM': '#27ae60',
      'UPDATE_ITEM': '#3498db',
      'DELETE_ITEM': '#e74c3c',
      'CREATE_SALE': '#f39c12',
      'USER_LOGIN': '#1abc9c',
      'USER_LOGOUT': '#95a5a6',
      'CREATE_USER': '#9b59b6',
      'UPDATE_USER': '#3498db',
      'DELETE_USER': '#e74c3c',
    };
    return colors[action] || '#666';
  };

  const handleCleanOldLogs = async () => {
    const days = prompt('Удалить логи старше скольких дней?', '30');
    if (!days || isNaN(days)) return;

    try {
      const response = await fetch(`/api/logs/user-activity?days=${days}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Старые логи удалены');
        fetchUserActivityLogs();
      }
    } catch (err) {
      alert('❌ Ошибка при очистке логов');
    }
  };

  // ==================== РЕНДЕР ПОЛЯ НАСТРОЙКИ ====================
  
  const renderInput = (key, setting) => {
    const currentValue = setting.value;
    
    if (setting.type === 'boolean') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={currentValue}
            onChange={(e) => updateSetting(key, e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
          <span>{currentValue ? 'Включено' : 'Выключено'}</span>
        </label>
      );
    }
    
    if (setting.type === 'number') {
      return (
        <input
          type="number"
          defaultValue={currentValue}
          onBlur={(e) => {
            if (e.target.value !== String(currentValue)) {
              updateSetting(key, e.target.value);
            }
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            width: '150px'
          }}
        />
      );
    }
    
    return (
      <input
        type="text"
        defaultValue={currentValue}
        onBlur={(e) => {
          if (e.target.value !== String(currentValue)) {
            updateSetting(key, e.target.value);
          }
        }}
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          width: '300px'
        }}
      />
    );
  };

  // ==================== ГРУППИРОВКА НАСТРОЕК ====================
  
  const groupedSettings = Object.entries(settings).reduce((acc, [key, setting]) => {
    const category = setting.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, ...setting });
    return acc;
  }, {});

  const categoryNames = {
    billing: '💰 Биллинг и цены',
    general: '🏢 Общие настройки',
    system: '⚙️ Системные настройки',
    notifications: '🔔 Уведомления'
  };

  // ==================== RENDER ====================
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      
      {/* === БОКОВОЕ МЕНЮ РАЗДЕЛОВ === */}
      <div style={{
        width: '260px',
        background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        padding: '20px 0',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>⚙️ Настройки</h2>
          <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.7 }}>
            Управление системой
          </p>
        </div>

        {/* Основные разделы */}
        <div style={{ padding: '20px 15px', flex: 1 }}>
          <div style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            opacity: 0.6,
            marginBottom: '10px',
            paddingLeft: '10px'
          }}>
            Основные
          </div>

          <button
            onClick={() => setMainSection('system')}
            style={{
              ...sidebarMenuItemStyle,
              backgroundColor: mainSection === 'system' ? 'rgba(255,255,255,0.2)' : 'transparent',
              borderLeft: mainSection === 'system' ? '3px solid #fff' : '3px solid transparent',
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🔧</span>
            Настройки системы
          </button>

          <button
            onClick={() => setMainSection('admin')}
            style={{
              ...sidebarMenuItemStyle,
              backgroundColor: mainSection === 'admin' ? 'rgba(255,255,255,0.2)' : 'transparent',
              borderLeft: mainSection === 'admin' ? '3px solid #fff' : '3px solid transparent',
            }}
          >
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🛠️</span>
            Администрирование
          </button>
        </div>

        {/* Кнопка назад */}
        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          >
            ← Назад в Dashboard
          </button>
        </div>
      </div>

      {/* === ОСНОВНОЙ КОНТЕНТ === */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* ===== РАЗДЕЛ: НАСТРОЙКИ СИСТЕМЫ ===== */}
        {mainSection === 'system' && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>
                🔧 Настройки системы
              </h1>
              <p style={{ margin: '8px 0 0', color: '#7f8c8d' }}>
                Централизованное управление параметрами IMS
              </p>
            </div>

            {/* Сообщение */}
            {settingsMessage && (
              <div style={{
                padding: '12px 20px',
                backgroundColor: settingsMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                color: settingsMessage.includes('✅') ? '#155724' : '#721c24',
                borderRadius: '6px',
                marginBottom: '20px',
                border: `1px solid ${settingsMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {settingsMessage}
              </div>
            )}

            {settingsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                Загрузка настроек...
              </div>
            ) : (
              Object.entries(groupedSettings).map(([category, items]) => (
                <div key={category} style={{
                  backgroundColor: 'white',
                  padding: '25px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#2c3e50' }}>
                    {categoryNames[category] || category}
                  </h2>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {items.map(item => (
                      <div key={item.key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#3498db';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '4px' }}>
                            {item.description || item.key}
                          </div>
                          <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                            Ключ: <code style={{ backgroundColor: '#ecf0f1', padding: '2px 6px', borderRadius: '3px' }}>{item.key}</code>
                            {' • '}Тип: <span style={{ color: '#3498db' }}>{item.type}</span>
                          </div>
                        </div>
                        <div style={{ marginLeft: '20px' }}>
                          {renderInput(item.key, item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {settingsSaving && (
              <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '12px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontSize: '14px'
              }}>
                💾 Сохранение...
              </div>
            )}
          </div>
        )}

        {/* ===== РАЗДЕЛ: АДМИНИСТРИРОВАНИЕ ===== */}
        {mainSection === 'admin' && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>
                🛠️ Администрирование
              </h1>
              <p style={{ margin: '8px 0 0', color: '#7f8c8d' }}>
                Управление базой данных, логами и пользователями
              </p>
            </div>

            {/* Вкладки админки */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '25px' }}>
              <button
                onClick={() => setActiveSection('sqlConsole')}
                style={getTabStyle(activeSection, 'sqlConsole')}
              >
                🗄️ SQL Консоль
              </button>
              <button
                onClick={() => setActiveSection('nodeLogConsole')}
                style={getTabStyle(activeSection, 'nodeLogConsole')}
              >
                📜 Node.js Log Console
              </button>
              <button
                onClick={() => setActiveSection('userActivityLogs')}
                style={getTabStyle(activeSection, 'userActivityLogs')}
              >
                📋 Журнал действий
              </button>
              <button
                onClick={() => setActiveSection('addUser')}
                style={getTabStyle(activeSection, 'addUser')}
              >
                👤 Создать пользователя
              </button>
            </div>

            {/* SQL Консоль */}
            {activeSection === 'sqlConsole' && (
              <div style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>SQL Консоль</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Выполните SQL-запрос:</p>
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="SELECT * FROM items WHERE status = 'warehouse';"
                  style={textareaStyle}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  💡 Нажмите Ctrl+Enter для выполнения
                </div>
                <button
                  onClick={executeQuery}
                  disabled={loading}
                  style={getButtonStyle(loading, '#3498db')}
                >
                  {loading ? '⏳ Выполняется...' : '▶️ Выполнить (Ctrl+Enter)'}
                </button>

                {error && (
                  <div style={errorBoxStyle}>{error}</div>
                )}

                {results && (
                  <div style={{ 
                    border: '1px solid #ccc', 
                    borderRadius: '4px', 
                    padding: '15px', 
                    backgroundColor: '#fafafa',
                    marginTop: '15px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>📊 Результаты:</h4>
                    {results.rows && results.rows.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                          <thead>
                            <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                              {Object.keys(results.rows[0]).map(key => (
                                <th key={key} style={thStyle}>{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.rows.map((row, index) => (
                              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                {Object.values(row).map((value, i) => (
                                  <td key={i} style={tdStyle}>
                                    {value !== null && value !== undefined ? String(value) : 'NULL'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>Запрос выполнен. Результатов нет.</p>
                    )}
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                      <strong>Количество строк:</strong> {results.rowCount || 0}
                    </p>
                  </div>
                )}

                {!results && !error && !loading && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    Результаты отобразятся здесь
                  </div>
                )}
              </div>
            )}

            {/* Node.js Log Console */}
            {activeSection === 'nodeLogConsole' && (
              <div style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>Node.js Log Console</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Журнал событий Node.js:</p>
                {logLoading ? (
                  <p>⏳ Загрузка логов...</p>
                ) : logError ? (
                  <div style={errorBoxStyle}>{logError}</div>
                ) : (
                  <pre style={{
                    backgroundColor: '#000',
                    color: '#00ff00',
                    padding: '15px',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    maxHeight: '400px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}>
                    {logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                  </pre>
                )}
                <button
                  onClick={fetchLogs}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#3498db', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  🔄 Обновить логи
                </button>
              </div>
            )}

            {/* Журнал действий пользователей */}
            {activeSection === 'userActivityLogs' && (
              <div>
                <div style={panelStyle}>
                  <h3 style={{ marginTop: 0 }}>📋 Журнал действий пользователей</h3>
                  
                  {/* Фильтры */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    <select 
                      name="action" 
                      value={userLogFilter.action} 
                      onChange={handleUserLogFilterChange} 
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="">Все действия</option>
                      <option value="CREATE_ITEM">Создание товара</option>
                      <option value="UPDATE_ITEM">Изменение товара</option>
                      <option value="DELETE_ITEM">Удаление товара</option>
                      <option value="CREATE_SALE">Продажа</option>
                      <option value="USER_LOGIN">Вход в систему</option>
                      <option value="USER_LOGOUT">Выход из системы</option>
                      <option value="CREATE_USER">Создание пользователя</option>
                    </select>

                    <input
                      type="date"
                      name="date_from"
                      value={userLogFilter.date_from}
                      onChange={handleUserLogFilterChange}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />

                    <input
                      type="date"
                      name="date_to"
                      value={userLogFilter.date_to}
                      onChange={handleUserLogFilterChange}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />

                    <button onClick={handleUserLogSearch} style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#3498db', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}>
                      🔍 Поиск
                    </button>

                    <button onClick={handleCleanOldLogs} style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer'
                    }}>
                      🗑️ Очистить старые
                    </button>
                  </div>
                </div>

                {/* Таблица логов */}
                {userLogLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>⏳ Загрузка...</div>
                ) : userLogError ? (
                  <div style={errorBoxStyle}>{userLogError}</div>
                ) : (
                  <div style={{ 
                    border: '1px solid #ccc', 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    backgroundColor: '#fafafa' 
                  }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                          <th style={thStyle}>Время</th>
                          <th style={thStyle}>Пользователь</th>
                          <th style={thStyle}>Действие</th>
                          <th style={thStyle}>Сущность</th>
                          <th style={thStyle}>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userLogs.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                              Нет записей
                            </td>
                          </tr>
                        ) : (
                          userLogs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={tdStyle}>
                                {new Date(log.created_at).toLocaleString('ru-RU')}
                              </td>
                              <td style={tdStyle}>{log.username}</td>
                              <td style={tdStyle}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: getActionColor(log.action),
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                }}>
                                  {log.action}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                {log.entity_type} #{log.entity_id || '-'}
                              </td>
                              <td style={tdStyle}>{log.ip_address || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Пагинация */}
                {userLogs.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '15px', 
                    marginTop: '20px', 
                    padding: '15px' 
                  }}>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      style={getButtonStyle(pagination.page === 1, '#3498db')}
                    >
                      ← Назад
                    </button>
                    <span>Страница {pagination.page} из {Math.ceil(pagination.total / pagination.limit)}</span>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                      style={getButtonStyle(pagination.page >= Math.ceil(pagination.total / pagination.limit), '#3498db')}
                    >
                      Вперёд →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Создать пользователя */}
            {activeSection === 'addUser' && (
              <div style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>👤 Создать пользователя</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Введите данные нового пользователя:</p>
                <form onSubmit={handleCreateUser} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxWidth: '400px' 
                }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', color: '#555' }}>
                    Имя пользователя:
                    <input
                      type="text"
                      name="username"
                      placeholder="ivanov_ii"
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', color: '#555' }}>
                    Пароль:
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px', color: '#555' }}>
                    Роль:
                    <select name="role" style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}>
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    style={{ 
                      padding: '10px 16px', 
                      backgroundColor: '#27ae60', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      marginTop: '10px',
                      fontSize: '14px'
                    }}
                  >
                    ✅ Создать пользователя
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// === СТИЛИ ===

const sidebarMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '12px 15px',
  color: 'white',
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  textAlign: 'left',
  marginBottom: '5px',
  transition: 'all 0.2s',
};

const panelStyle = {
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: '20px',
};

const textareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontFamily: 'monospace',
  fontSize: '14px',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const errorBoxStyle = {
  color: '#721c24',
  padding: '10px',
  backgroundColor: '#f8d7da',
  border: '1px solid #f5c6cb',
  borderRadius: '4px',
  marginTop: '15px',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const thStyle = {
  padding: '10px',
  textAlign: 'left',
  border: '1px solid #ddd',
};

const tdStyle = {
  padding: '10px',
  border: '1px solid #ddd',
};

function getTabStyle(activeSection, sectionName) {
  return {
    padding: '10px 20px',
    backgroundColor: activeSection === sectionName ? '#3498db' : '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: activeSection === sectionName ? 'white' : 'black',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    fontSize: '14px',
  };
}

function getButtonStyle(disabled, color) {
  return {
    padding: '8px 16px',
    backgroundColor: disabled ? '#95a5a6' : color,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    marginTop: '10px',
  };
}

export default Settings;