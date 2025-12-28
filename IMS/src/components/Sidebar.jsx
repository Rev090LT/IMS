import React from 'react';

function Sidebar({ isOpen, onClose, onOpenSQLConsole, onOpenAddUserModal }) { // <= Добавим пропс
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-250px',
          width: '250px',
          height: '100vh',
          backgroundColor: '#2c3e50',
          color: 'white',
          zIndex: 999,
          transition: 'left 0.3s ease',
          boxShadow: '2px 0 5px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ padding: '20px' }}>
          <h3>Меню</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ marginBottom: '20px' }}>
              <a href="#!" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
                О разработчике
              </a>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <a href="#!" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
                Настройки
              </a>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenSQLConsole) onOpenSQLConsole();
                  onClose(); // Закрываем боковую панель
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                SQL Консоль
              </a>
            </li>
            {/* <<<--- НОВАЯ КНОПКА --->>> */}
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenAddUserModal) onOpenAddUserModal();
                  onClose(); // Закрываем боковую панель
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                Добавить пользователя
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidebar;