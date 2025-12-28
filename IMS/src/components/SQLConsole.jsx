import React, { useState } from 'react';

function SQLConsole({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // <<<--- Вот тут определим шаблоны --->>>
  const queryTemplates = {
    'Показать все пользователи': 'SELECT id, username, role, created_at FROM users;',
    'Показать все позиции': 'SELECT id, qr_code, name, description, quantity, status, location_id FROM items;',
    'Показать все локации': 'SELECT id, name, description FROM locations;',
    'Показать все перемещения': 'SELECT id, item_id, from_location_id, to_location_id, moved_by_user_id, moved_at FROM movements;',
    'Показать все ожидающие регистрации': 'SELECT id, username, created_at FROM pending_registrations;',
    'Добавить нового пользователя (шаблон)': `
-- ВНИМАНИЕ: Этот запрос не будет выполнен через SQL Консоль из-за ограничений
-- INSERT INTO users (username, password_hash, role) VALUES ('new_user', 'hash', 'user');
`,
    'Показать все позиции с локациями': `
SELECT 
  i.id,
  i.qr_code,
  i.name,
  i.description,
  i.quantity,
  i.status,
  l.name AS location_name
FROM items i
LEFT JOIN locations l ON i.location_id = l.id;
`,
    // Можно добавить больше шаблонов...
  };

  const handleTemplateSelect = (templateQuery) => {
    setQuery(templateQuery);
    setResults(null); // Очистим предыдущие результаты
    setError('');
  };

  const handleRunQuery = async () => {
    if (!query.trim()) {
      setError('Пожалуйста, введите SQL-запрос');
      return;
    }

    setError('');
    setResults(null);
    setLoading(true);

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`, // Если нужна авторизация
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка выполнения запроса');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sql-console-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div className="sql-console-modal-content" style={{
        width: '90%',
        maxWidth: '1200px', // Увеличим ширину для шаблонов
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div className="sql-console-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>SQL Консоль</h3>
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

        {/* Выбор шаблона */}
        <div className="sql-console-templates" style={{ marginBottom: '20px' }}>
          <label>Шаблоны запросов:</label>
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            value=""
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginTop: '5px',
            }}
          >
            <option value="" disabled>Выберите шаблон</option>
            {Object.entries(queryTemplates).map(([name, templateQuery]) => (
              <option key={name} value={templateQuery}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="sql-console-input" style={{ marginBottom: '20px' }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите SQL-запрос здесь..."
            rows={8}
            style={{
              width: '100%',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical',
            }}
          />
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRunQuery}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Выполняется...' : 'Выполнить'}
            </button>
          </div>
        </div>

        {error && (
          <div className="sql-console-error" style={{
            color: 'red',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            border: '1px solid red',
            borderRadius: '4px',
          }}>
            {error}
          </div>
        )}

        {results && (
          <div className="sql-console-results" style={{
            overflowY: 'auto',
            flex: 1,
          }}>
            <h4>Результаты:</h4>
            {results.rows && results.rows.length > 0 ? (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #ccc',
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    {results.fields.map((field, index) => (
                      <th key={index} style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {field.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} style={{ border: '1px solid #ccc', padding: '8px' }}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет результатов</p>
            )}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Row count: {results.rowCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SQLConsole;