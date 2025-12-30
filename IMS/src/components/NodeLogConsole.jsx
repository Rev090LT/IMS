import React, { useState, useEffect, useRef } from 'react';

function NodeLogConsole({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const logsEndRef = useRef(null);

  // <<<--- Имитация получения логов через WebSocket или SSE (пока заглушка) --->>>
  useEffect(() => {
    // <<<--- В реальности можно использовать WebSocket или SSE для получения логов --->>>
    // <<<--- Пока просто добавим несколько примеров логов --->>>

    const exampleLogs = [
      { id: 1, timestamp: new Date().toISOString(), level: 'INFO', message: 'Server started on port 3000' },
      { id: 2, timestamp: new Date().toISOString(), level: 'INFO', message: 'Database connected' },
      { id: 3, timestamp: new Date().toISOString(), level: 'WARN', message: 'User login attempt failed for user: invalid_user' },
      { id: 4, timestamp: new Date().toISOString(), level: 'INFO', message: 'New item added: Engine Oil' },
      { id: 5, timestamp: new Date().toISOString(), level: 'ERROR', message: 'Error fetching items: connection timeout' },
    ];

    setLogs(exampleLogs);
    setIsConnected(true);

    // <<<--- Имитация обновления логов каждые 5 секунд --->>>
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: Math.random() > 0.7 ? 'ERROR' : Math.random() > 0.5 ? 'WARN' : 'INFO',
        message: `Log message #${Date.now()}`
      };
      setLogs(prev => [...prev, newLog].slice(-50)); // Оставим последние 50 сообщений
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // <<<--- Прокрутка вниз при добавлении новых логов --->>>
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="node-log-console-modal-overlay" style={{
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
      <div className="node-log-console-modal-content" style={{
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '80vh',
        backgroundColor: 'black',
        color: 'white',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div className="node-log-console-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>Node.js Log Console</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="node-log-console-error" style={{
            color: 'red',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#330000',
            border: '1px solid red',
            borderRadius: '4px',
          }}>
            {error}
          </div>
        )}

        <div className="node-log-console-status" style={{
          marginBottom: '10px',
          padding: '5px 10px',
          borderRadius: '4px',
          backgroundColor: isConnected ? '#003300' : '#330000',
          color: 'white',
          fontSize: '12px',
        }}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        <div className="node-log-console-logs" style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#111',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: 1.4,
        }}>
          {logs.map(log => (
            <div key={log.id} style={{
              marginBottom: '5px',
              color: log.level === 'ERROR' ? '#ff6666' : log.level === 'WARN' ? '#ffff66' : '#66ff66',
            }}>
              <span style={{ fontSize: '10px', color: '#888' }}>[{log.timestamp}]</span> {log.level} - {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        <div className="node-log-console-actions" style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={() => setLogs([])}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeLogConsole;