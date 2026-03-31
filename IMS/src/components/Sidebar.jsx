// IMS/src/components/Sidebar.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Sidebar({ isOpen, onClose, onOpenSQLConsole, onOpenNodeLogConsole, onOpenAddUserModal, onOpenAboutDeveloper, onOpenAddManufacturerModal, onOpenAddCategoryModal, userRole }) {
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  // Отладка
  useEffect(() => {
    console.log('Sidebar isOpen:', isOpen);
  }, [isOpen]);

  const goToAdminPanel = () => {
    navigate('/admin-panel');
    onClose();
  };

  const goToDocumentFlow = () => {
    navigate('/document-flow');
    onClose();
  };

  // === СТИЛИ ===
  
  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isOpen ? 0 : '-300px',
    width: '280px',
    height: '100vh',
    background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    zIndex: isOpen ? 1100 : -1,
    transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isOpen ? '4px 0 15px rgba(0,0,0,0.3)' : 'none',
    overflowY: 'auto',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
    zIndex: isOpen ? 1050 : -1,
    opacity: isOpen ? 1 : 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: isOpen ? 'auto' : 'none',
  };

  const headerStyle = {
    padding: '25px 20px',
    background: 'rgba(255,255,255,0.1)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  };

  const titleStyle = {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  };

  const menuStyle = {
    listStyle: 'none',
    padding: '15px 0',
    margin: 0,
  };

  const menuItemStyle = {
    margin: '5px 10px',
  };

  const menuLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    fontSize: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid transparent',
  };

  const iconStyle = {
    marginRight: '12px',
    fontSize: '18px',
    width: '24px',
    textAlign: 'center',
  };

  const closeIconStyle = {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  };

  const sectionTitleStyle = {
    padding: '15px 20px 10px 20px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginTop: '10px',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="sidebar-overlay"
        onClick={onClose}
        style={overlayStyle}
      />

      {/* Sidebar */}
      <div 
        className={`sidebar ${isOpen ? 'open' : ''}`} 
        style={sidebarStyle}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          style={closeIconStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'rotate(0deg)';
          }}
        >
          ✕
        </button>

        {/* Заголовок */}
        <div style={headerStyle}>
          <h3 style={titleStyle}>📋 Меню</h3>
        </div>

        {/* Меню */}
        <ul style={menuStyle}>
          <div style={sectionTitleStyle}>Управление</div>
          
          <li style={menuItemStyle}>
            <a
              onClick={(e) => {
                e.preventDefault();
                if (onOpenAddCategoryModal) onOpenAddCategoryModal();
                onClose();
              }}
              style={menuLinkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span style={iconStyle}>📦</span>
              <span>Добавить категорию</span>
            </a>
          </li>

          <li style={menuItemStyle}>
            <a
              onClick={(e) => {
                e.preventDefault();
                if (onOpenAddManufacturerModal) onOpenAddManufacturerModal();
                onClose();
              }}
              style={menuLinkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span style={iconStyle}>🏭</span>
              <span>Добавить производителя</span>
            </a>
          </li>

          <li style={menuItemStyle}>
            <a
              onClick={(e) => {
                e.preventDefault();
                if (onOpenAboutDeveloper) onOpenAboutDeveloper();
                onClose();
              }}
              style={menuLinkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.border = '1px solid transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span style={iconStyle}>👨‍💻</span>
              <span>О разработчике</span>
            </a>
          </li>

          {isAdmin && (
            <>
              <div style={sectionTitleStyle}>Администрирование</div>
              
              <li style={menuItemStyle}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    goToAdminPanel();
                  }}
                  style={menuLinkStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={iconStyle}>⚙️</span>
                  <span>Администрирование</span>
                </a>
              </li>

              <li style={menuItemStyle}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    goToDocumentFlow();
                  }}
                  style={menuLinkStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={iconStyle}>📄</span>
                  <span>Документооборот</span>
                </a>
              </li>
            </>
          )}
        </ul>

        {/* Футер */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '15px 20px',
          background: 'rgba(0,0,0,0.2)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
        }}>
          IMS v1.0
        </div>
      </div>
    </>
  );
}

export default Sidebar;