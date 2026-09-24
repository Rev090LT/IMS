// IMS/src/components/AdminPanelPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPanelPage({ token }) {
  const [activeSection, setActiveSection] = useState('sqlConsole');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logError, setLogError] = useState('');
  
  // Новые состояния для журнала действий пользователей
  const [userLogs, setUserLogs] = useState([]);
  const [userLogLoading, setUserLogLoading] = useState(false);
  const [userLogError, setUserLogError] = useState('');
  const [userLogFilter, setUserLogFilter] = useState({
    action: '',
    date_from: '',
    date_to: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  
  const navigate = useNavigate();
  const textareaRef = useRef();

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
        headers: {
          'Authorization': `Bearer ${token}`,
        }
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

  // Загрузка логов действий пользователей
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
        headers: {
          'Authorization': `Bearer ${token}`,
        }
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
    if (activeSection === 'nodeLogConsole') {
      fetchLogs();
    }
    if (activeSection === 'userActivityLogs') {
      fetchUserActivityLogs();
    }
  }, [activeSection, pagination.page]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      executeQuery();
    }
  };

  const createUser = async (userData) => {
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

      alert('Пользователь успешно создан');
    } catch (err) {
      console.error('Create User Error:', err);
      alert(`Ошибка при создании пользователя: ${err.message}`);
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

    await createUser(userData);
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
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        alert('Старые логи удалены');
        fetchUserActivityLogs();
      }
    } catch (err) {
      alert('Ошибка при очистке логов');
    }
  };

  return (
    <div style={pageStyle}>
      <h2 style={titleStyle}>⚙️ Администрирование</h2>

      <div style={backButtonStyle}>
        <button
          onClick={() => navigate('/dashboard')}
          style={buttonSecondaryStyle}
        >
          ← Вернуться в Dashboard
        </button>
      </div>

      {/* Вкладки */}
      <div style={tabsStyle}>
        <button
          onClick={() => setActiveSection('sqlConsole')}
          style={getTabStyle('sqlConsole')}
        >
          🗄️ SQL Консоль
        </button>
        <button
          onClick={() => setActiveSection('nodeLogConsole')}
          style={getTabStyle('nodeLogConsole')}
        >
          📜 Node.js Log Console
        </button>
        <button
          onClick={() => setActiveSection('userActivityLogs')}
          style={getTabStyle('userActivityLogs')}
        >
          📋 Журнал действий
        </button>
        <button
          onClick={() => setActiveSection('addUser')}
          style={getTabStyle('addUser')}
        >
          👤 Создать пользователя
        </button>
      </div>

      {/* SQL Консоль */}
      {activeSection === 'sqlConsole' && (
        <div>
          <h3>SQL Консоль</h3>
          <div style={panelStyle}>
            <p>Выполните SQL-запрос:</p>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="SELECT * FROM items WHERE status = 'warehouse';"
              style={textareaStyle}
            />
            <div style={hintStyle}>
              Нажмите Ctrl+Enter для выполнения
            </div>
            <button
              onClick={executeQuery}
              disabled={loading}
              style={getButtonStyle(loading, '#3498db')}
            >
              {loading ? 'Выполняется...' : 'Выполнить (Ctrl+Enter)'}
            </button>
          </div>

          {error && (
            <div style={errorBoxStyle}>
              {error}
            </div>
          )}

          {results && (
            <div style={resultBoxStyle}>
              <h4 style={{ margin: '0 0 10px 0' }}>Результаты:</h4>
              {results.rows && results.rows.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      {Object.keys(results.rows[0]).map(key => (
                        <th key={key} style={thStyle}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, index) => (
                      <tr key={index} style={index % 2 === 0 ? tableRowEvenStyle : tableRowOddStyle}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} style={tdStyle}>
                            {value !== null && value !== undefined ? String(value) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Запрос выполнен. Результатов нет.</p>
              )}
              <p style={resultInfoStyle}>
                <strong>Количество строк:</strong> {results.rowCount || 0}
              </p>
            </div>
          )}

          {!results && !error && !loading && (
            <div style={emptyStateStyle}>
              Результаты отобразятся здесь
            </div>
          )}
        </div>
      )}

      {/* Node.js Log Console */}
      {activeSection === 'nodeLogConsole' && (
        <div>
          <h3>Node.js Log Console</h3>
          <div style={panelStyle}>
            <p>Журнал событий Node.js:</p>
            {logLoading ? (
              <p>Загрузка логов...</p>
            ) : logError ? (
              <div style={errorBoxStyle}>{logError}</div>
            ) : (
              <pre style={logPreStyle}>
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </pre>
            )}
            <button
              onClick={fetchLogs}
              style={buttonPrimaryStyle}
            >
              🔄 Обновить логи
            </button>
          </div>
        </div>
      )}

      {/* Журнал действий пользователей */}
      {activeSection === 'userActivityLogs' && (
        <div>
          <h3>📋 Журнал действий пользователей</h3>
          
          {/* Фильтры */}
          <div style={panelStyle}>
            <div style={filterRowStyle}>
              <select 
                name="action" 
                value={userLogFilter.action} 
                onChange={handleUserLogFilterChange} 
                style={selectStyle}
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
                style={inputStyle}
              />

              <input
                type="date"
                name="date_to"
                value={userLogFilter.date_to}
                onChange={handleUserLogFilterChange}
                style={inputStyle}
              />

              <button onClick={handleUserLogSearch} style={buttonPrimaryStyle}>
                🔍 Поиск
              </button>

              <button onClick={handleCleanOldLogs} style={getButtonStyle(false, '#e74c3c')}>
                🗑️ Очистить старые
              </button>
            </div>
          </div>

          {/* Таблица логов */}
          {userLogLoading ? (
            <div style={loadingStyle}>⏳ Загрузка...</div>
          ) : userLogError ? (
            <div style={errorBoxStyle}>{userLogError}</div>
          ) : (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
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
                      <td colSpan="5" style={emptyStateStyle}>Нет записей</td>
                    </tr>
                  ) : (
                    userLogs.map(log => (
                      <tr key={log.id} style={tableRowStyle}>
                        <td style={tdStyle}>
                          {new Date(log.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td style={tdStyle}>{log.username}</td>
                        <td style={tdStyle}>
                          <span style={{
                            ...badgeStyle,
                            backgroundColor: getActionColor(log.action),
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
            <div style={paginationStyle}>
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
        <div>
          <h3>👤 Создать пользователя</h3>
          <div style={panelStyle}>
            <p>Введите данные нового пользователя:</p>
            <form onSubmit={handleCreateUser} style={formStyle}>
              <label style={labelStyle}>
                Имя пользователя:
                <input
                  type="text"
                  name="username"
                  placeholder="ivanov_ii"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Пароль:
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Роль:
                <select name="role" style={selectStyle}>
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </label>
              <button
                type="submit"
                style={getButtonStyle(false, '#27ae60')}
              >
                ✅ Создать пользователя
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Вспомогательная функция для стилей вкладок
  function getTabStyle(sectionName) {
    return {
      padding: '10px 20px',
      backgroundColor: activeSection === sectionName ? '#3498db' : '#f0f0f0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      color: activeSection === sectionName ? 'white' : 'black',
      fontWeight: 'bold',
      transition: 'all 0.2s',
    };
  }

  // Вспомогательная функция для стилей кнопок
  function getButtonStyle(disabled, color) {
    return {
      padding: '8px 16px',
      backgroundColor: disabled ? '#95a5a6' : color,
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    };
  }
}

// Стили
const pageStyle = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  maxWidth: '1400px',
  margin: '0 auto',
};

const titleStyle = {
  marginBottom: '20px',
  color: '#2c3e50',
};

const backButtonStyle = {
  marginBottom: '20px',
};

const tabsStyle = {
  marginBottom: '20px',
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const panelStyle = {
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  marginBottom: '10px',
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
};

const hintStyle = {
  fontSize: '12px',
  color: '#666',
  marginTop: '5px',
};

const errorBoxStyle = {
  color: 'red',
  padding: '10px',
  backgroundColor: '#ffe6e6',
  border: '1px solid red',
  borderRadius: '4px',
  marginBottom: '15px',
};

const resultBoxStyle = {
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '10px',
  backgroundColor: '#fafafa',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const tableHeaderStyle = {
  backgroundColor: '#ecf0f1',
  fontWeight: 'bold',
};

const thStyle = {
  padding: '8px',
  textAlign: 'left',
  border: '1px solid #ddd',
};

const tdStyle = {
  padding: '8px',
  border: '1px solid #ddd',
};

const tableRowEvenStyle = {
  backgroundColor: '#f9f9f9',
};

const tableRowOddStyle = {
  backgroundColor: 'white',
};

const tableRowStyle = {
  borderBottom: '1px solid #eee',
};

const tableContainerStyle = {
  border: '1px solid #ccc',
  borderRadius: '4px',
  overflow: 'hidden',
  backgroundColor: '#fafafa',
};

const resultInfoStyle = {
  marginTop: '10px',
  fontSize: '12px',
  color: '#666',
};

const emptyStateStyle = {
  padding: '20px',
  textAlign: 'center',
  color: '#999',
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#666',
};

const logPreStyle = {
  backgroundColor: '#000',
  color: '#00ff00',
  padding: '10px',
  borderRadius: '4px',
  overflowX: 'auto',
  maxHeight: '400px',
  fontSize: '12px',
  lineHeight: '1.4',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
};

const filterRowStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '10px',
};

const selectStyle = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxWidth: '400px',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  fontSize: '14px',
  color: '#555',
};

const buttonPrimaryStyle = {
  padding: '8px 16px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginTop: '10px',
};

const buttonSecondaryStyle = {
  padding: '8px 16px',
  backgroundColor: '#95a5a6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const badgeStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  color: 'white',
  fontSize: '12px',
  fontWeight: '500',
};

const paginationStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '15px',
  marginTop: '20px',
  padding: '15px',
};

export default AdminPanelPage;