// IMS/src/components/UserActivityLogs.jsx
import React, { useState, useEffect } from 'react';

function UserActivityLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filter,
      });

      const response = await fetch(`/api/logs/user-activity?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchLogs();
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE_ITEM': '#27ae60',
      'UPDATE_ITEM': '#3498db',
      'DELETE_ITEM': '#e74c3c',
      'CREATE_SALE': '#f39c12',
      'USER_LOGIN': '#1abc9c',
      'USER_LOGOUT': '#95a5a6',
    };
    return colors[action] || '#666';
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>📋 Журнал действий пользователей</h2>

      {/* Фильтры */}
      <div style={filterStyle}>
        <select name="action" value={filter.action} onChange={handleFilterChange} style={selectStyle}>
          <option value="">Все действия</option>
          <option value="CREATE_ITEM">Создание товара</option>
          <option value="UPDATE_ITEM">Изменение товара</option>
          <option value="DELETE_ITEM">Удаление товара</option>
          <option value="CREATE_SALE">Продажа</option>
          <option value="USER_LOGIN">Вход в систему</option>
        </select>

        <input
          type="date"
          name="date_from"
          value={filter.date_from}
          onChange={handleFilterChange}
          style={inputStyle}
          placeholder="С даты"
        />

        <input
          type="date"
          name="date_to"
          value={filter.date_to}
          onChange={handleFilterChange}
          style={inputStyle}
          placeholder="По дату"
        />

        <button onClick={handleSearch} style={buttonStyle}>🔍 Поиск</button>
      </div>

      {/* Таблица логов */}
      {loading ? (
        <div style={loadingStyle}>⏳ Загрузка...</div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Время</th>
                <th style={thStyle}>Пользователь</th>
                <th style={thStyle}>Действие</th>
                <th style={thStyle}>Сущность</th>
                <th style={thStyle}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={emptyStyle}>Нет записей</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={trStyle}>
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
      <div style={paginationStyle}>
        <button
          onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          disabled={pagination.page === 1}
          style={pageButtonStyle}
        >
          ← Назад
        </button>
        <span>Страница {pagination.page} из {Math.ceil(pagination.total / pagination.limit)}</span>
        <button
          onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
          style={pageButtonStyle}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}

// Стили
const containerStyle = {
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const titleStyle = {
  fontSize: '20px',
  fontWeight: '600',
  marginBottom: '20px',
  color: '#2c3e50',
};

const filterStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const selectStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#666',
};

const tableContainerStyle = {
  overflowX: 'auto',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  backgroundColor: '#f5f5f5',
  padding: '12px',
  textAlign: 'left',
  fontWeight: '600',
  borderBottom: '2px solid #ddd',
};

const trStyle = {
  borderBottom: '1px solid #eee',
};

const tdStyle = {
  padding: '12px',
  fontSize: '14px',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#999',
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

const pageButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default UserActivityLogs;