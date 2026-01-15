import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPanelPage({ token, onOpenAddUserModal }) { // <<<--- Теперь принимаем onOpenAddUserModal
  const [activeSection, setActiveSection] = useState('sqlConsole');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef();

  // <<<--- Функция для выполнения SQL-запроса --->
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      executeQuery();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ marginBottom: '20px' }}>Администрирование</h2>

      {/* Кнопка возврата в Dashboard */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← Вернуться в Dashboard
        </button>
      </div>

      {/* Навигационные кнопки */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSection('sqlConsole')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeSection === 'sqlConsole' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeSection === 'sqlConsole' ? 'white' : 'black',
            fontWeight: 'bold',
          }}
        >
          SQL Консоль
        </button>
        <button
          onClick={() => setActiveSection('nodeLogConsole')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeSection === 'nodeLogConsole' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeSection === 'nodeLogConsole' ? 'white' : 'black',
            fontWeight: 'bold',
          }}
        >
          Node.js Log Console
        </button>
        <button
          onClick={() => setActiveSection('addUser')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeSection === 'addUser' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeSection === 'addUser' ? 'white' : 'black',
            fontWeight: 'bold',
          }}
        >
          Создать пользователя
        </button>
      </div>

      {/* Секция SQL Консоль */}
      {activeSection === 'sqlConsole' && (
        <div>
          <h3>SQL Консоль</h3>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '10px' }}>
            <p>Выполните SQL-запрос:</p>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="SELECT * FROM items WHERE status = 'warehouse';"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Нажмите Ctrl+Enter для выполнения
            </div>
            <button
              onClick={executeQuery}
              disabled={loading}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Выполняется...' : 'Выполнить (Ctrl+Enter)'}
            </button>
          </div>

          {error && (
            <div style={{
              color: 'red',
              padding: '10px',
              backgroundColor: '#ffe6e6',
              border: '1px solid red',
              borderRadius: '4px',
              marginBottom: '15px',
            }}>
              {error}
            </div>
          )}

          {results && (
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px', backgroundColor: '#fafafa' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Результаты:</h4>
              {results.rows && results.rows.length > 0 ? (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                      {Object.keys(results.rows[0]).map(key => (
                        <th key={key} style={{ padding: '6px', textAlign: 'left', border: '1px solid #ddd' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                        {Object.values(row).map((value, i) => (
                          <td key={i} style={{ padding: '6px', border: '1px solid #ddd' }}>
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
              <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Количество строк:</strong> {results.rowCount || 0}
              </p>
            </div>
          )}

          {!results && !error && !loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Результаты отобразятся здесь
            </div>
          )}
        </div>
      )}

      {/* Секция Node.js Log Console */}
      {activeSection === 'nodeLogConsole' && (
        <div>
          <h3>Node.js Log Console</h3>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '10px' }}>
            <p>Журнал событий Node.js:</p>
            <pre style={{ backgroundColor: '#000', color: '#00ff00', padding: '10px', borderRadius: '4px', overflowX: 'auto', minHeight: '200px' }}>
              [2026-01-16T10:00:00.000Z] INFO: Server started on port 3000
              [2026-01-16T10:05:00.000Z] INFO: New connection from 127.0.0.1
              [2026-01-16T10:10:00.000Z] ERROR: Database connection failed
            </pre>
            <button
              onClick={() => alert('Обновление логов')}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Обновить логи
            </button>
          </div>
        </div>
      )}

      {/* Секция Создание пользователя */}
      {activeSection === 'addUser' && (
        <div>
          <h3>Создать пользователя</h3>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p>Введите данные нового пользователя:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
              <label>
                Имя:
                <input
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </label>
              <label>
                Логин:
                <input
                  type="text"
                  placeholder="ivanov_ii"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </label>
              <label>
                Пароль:
                <input
                  type="password"
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </label>
              <label>
                Роль:
                <select
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </label>
              <button
                onClick={onOpenAddUserModal} // <<<--- Вот тут вызываем переданную функцию
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Создать пользователя
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanelPage;