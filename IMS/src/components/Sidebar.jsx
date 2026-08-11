// IMS/src/components/Sidebar.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniCalendar from './MiniCalendar';

function Sidebar({ 
  isOpen, 
  onClose, 
  onOpenSQLConsole, 
  onOpenNodeLogConsole, 
  onOpenAddUserModal, 
  onOpenAboutDeveloper, 
  onOpenAddManufacturerModal, 
  onOpenAddCategoryModal, 
  userRole,
  token 
}) {
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

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

  const goToSettings = () => {
    navigate('/settings');
    onClose();
  };

  // === СТИЛИ ===
  
  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isOpen ? 0 : '-100%',
    width: '100%',
    maxWidth: '400px',
    height: '100vh',
    background: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    zIndex: isOpen ? 1100 : -1,
    transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isOpen ? '4px 0 15px rgba(0,0,0,0.3)' : 'none',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
  };

  const menuItemStyle = {
    margin: '5px 10px',
  };

  const menuLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    color: 'rgba(255,255,255,0.9)',
    textDecoration: 'none',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid transparent',
  };

  const iconStyle = {
    marginRight: '15px',
    fontSize: '20px',
    width: '24px',
    textAlign: 'center',
  };

  const closeIconStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '22px',
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

  const calendarSectionStyle = {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '15px 20px 20px',
    background: 'rgba(0,0,0,0.1)',
  };

  const calendarTitleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
        {/* Заголовок с кнопкой закрытия */}
        <div style={headerStyle}>
          <h3 style={titleStyle}>📋 Меню</h3>
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

              <li style={menuItemStyle}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/cars');
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
                  <span style={iconStyle}>🚗</span>
                  <span>Автомобили в разборе</span>
                </a>
              </li>

              {/* 🔥 НОВЫЙ ПУНКТ: Настройки системы */}
              <li style={menuItemStyle}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    goToSettings();
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
                  <span style={iconStyle}>🔧</span>
                  <span>Настройки системы</span>
                </a>
              </li>
            </>
          )}
        </ul>

        {/* === КАЛЕНДАРЬ - ТОЛЬКО ДЛЯ МОБИЛЬНЫХ === */}
        <div className="mobile-calendar" style={calendarSectionStyle}>
          <h4 style={calendarTitleStyle}>📅 Записи на сегодня</h4>
          <MiniCalendar token={token} />
        </div>

        {/* Футер */}
        <div style={{
          padding: '15px 20px 25px',
          background: 'rgba(0,0,0,0.2)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
        }}>
          IMS v1.0
        </div>
      </div>

      {/* CSS для адаптивности */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            width: 100% !important;
            max-width: 100% !important;
            left: -100% !important;
          }
          .sidebar.open {
            left: 0 !important;
          }
          .menu-link {
            padding: 16px 25px !important;
            font-size: 17px !important;
          }
          .menu-icon {
            font-size: 22px !important;
            margin-right: 18px !important;
          }
          .close-btn {
            width: 44px !important;
            height: 44px !important;
            font-size: 24px !important;
          }
          .mobile-calendar {
            padding: 20px !important;
          }
          .mobile-calendar .mini-calendar {
            transform: scale(0.95);
            transform-origin: top center;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1200px) {
          .sidebar {
            width: 85% !important;
            max-width: 350px !important;
          }
        }
        
        @media (min-width: 1201px) {
          .sidebar {
            width: 280px !important;
            max-width: 280px !important;
          }
          .mobile-calendar {
            display: none !important;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .sidebar.open .menu-item {
          animation: slideIn 0.3s ease forwards;
        }
        
        .sidebar.open .menu-item:nth-child(1) { animation-delay: 0.05s; }
        .sidebar.open .menu-item:nth-child(2) { animation-delay: 0.1s; }
        .sidebar.open .menu-item:nth-child(3) { animation-delay: 0.15s; }
        .sidebar.open .menu-item:nth-child(4) { animation-delay: 0.2s; }
        .sidebar.open .menu-item:nth-child(5) { animation-delay: 0.25s; }
        .sidebar.open .menu-item:nth-child(6) { animation-delay: 0.3s; }
      `}</style>
    </>
  );
}

export default Sidebar;