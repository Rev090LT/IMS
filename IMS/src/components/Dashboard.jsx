// IMS/src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScanModal from './ScanModal';
import MoveModal from './MoveModal';
import DisposeModal from './DisposeModal';
import AddItemModal from './AddItemModal';
import AddLocationModal from './AddLocationModal';
import PrintLabelModal from './PrintLabelModal';
import SellPartModal from './SellPartModal';
import SQLConsole from './SQLConsole';
import AddUserModal from './AddUserModal';
import AboutDeveloper from './AboutDeveloper';
import AddManufacturerModal from './AddManufacturerModal';
import AddCategoryModal from './AddCategoryModal';
import AddCarModal from './AddCarModal';
import NodeLogConsole from './NodeLogConsole';
import MiniCalendar from './MiniCalendar';

function Dashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sqlConsoleOpen, setSqlConsoleOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [aboutDeveloperOpen, setAboutDeveloperOpen] = useState(false);
  const [addManufacturerModalOpen, setAddManufacturerModalOpen] = useState(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [addCarModalOpen, setAddCarModalOpen] = useState(false);
  const [sellPartModalOpen, setSellPartModalOpen] = useState(false);
  const [nodeLogConsoleOpen, setNodeLogConsoleOpen] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({ id: payload.id, username: payload.username, role: payload.role });
      } catch (e) {
        console.error('Invalid token', e);
        window.location.href = '/login';
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const openSQLConsole = () => setSqlConsoleOpen(true);
  const closeSQLConsole = () => setSqlConsoleOpen(false);
  const openAddUserModal = () => setAddUserModalOpen(true);
  const closeAddUserModal = () => setAddUserModalOpen(false);
  const openAboutDeveloper = () => setAboutDeveloperOpen(true);
  const closeAboutDeveloper = () => setAboutDeveloperOpen(false);
  const openAddManufacturerModal = () => setAddManufacturerModalOpen(true);
  const closeAddManufacturerModal = () => setAddManufacturerModalOpen(false);
  const openAddCategoryModal = () => setAddCategoryModalOpen(true);
  const closeAddCategoryModal = () => setAddCategoryModalOpen(false);
  const openAddCarModal = () => setAddCarModalOpen(true);
  const closeAddCarModal = () => setAddCarModalOpen(false);
  const openSellPartModal = () => setSellPartModalOpen(true);
  const closeSellPartModal = () => setSellPartModalOpen(false);
  const openNodeLogConsole = () => setNodeLogConsoleOpen(true);
  const closeNodeLogConsole = () => setNodeLogConsoleOpen(false);
  const handleItemAdded = () => console.log('Item added, refresh needed');

  if (!token) {
    return <div className="page-transition" style={{ textAlign: 'center', padding: '40px' }}>Not authenticated...</div>;
  }

  const isAdmin = userInfo?.role === 'admin';

  const responsiveStyles = `
    @media (max-width: 1200px) {
      .dashboard-main-content {
        flex-direction: column !important;
        align-items: stretch !important;
      }
      .right-column {
        display: none !important;
      }
      .left-column {
        order: 1 !important;
      }
    }
    
    @media (max-width: 768px) {
      .dashboard-buttons-grid {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      .dashboard-button {
        width: 100% !important;
        min-height: 100px !important;
      }
      .dashboard-button-content {
        padding: 15px 10px !important;
      }
      .dashboard-button-icon {
        font-size: 32px !important;
        margin-bottom: 8px !important;
      }
      .dashboard-button-label {
        font-size: 14px !important;
        line-height: 1.3 !important;
      }
      .dashboard-section-group {
        margin-bottom: 20px !important;
      }
      .dashboard-subsection-title {
        font-size: 16px !important;
      }
    }
    
    @media (max-width: 480px) {
      .dashboard-button {
        min-height: 90px !important;
      }
      .dashboard-button-icon {
        font-size: 28px !important;
      }
      .dashboard-button-label {
        font-size: 13px !important;
      }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      
      {/* === КНОПКА МЕНЮ === */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="glow-hover"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1200,
            padding: '12px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(52, 152, 219, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.4)';
          }}
        >
          <span className="icon-bounce">☰</span>
        </button>
      )}

      {/* === SIDEBAR === */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSQLConsole={openSQLConsole}
        onOpenAddUserModal={openAddUserModal}
        onOpenAboutDeveloper={openAboutDeveloper}
        onOpenAddManufacturerModal={openAddManufacturerModal}
        onOpenAddCategoryModal={openAddCategoryModal}
        onOpenNodeLogConsole={openNodeLogConsole}
        userRole={userInfo?.role}
        token={token}
      />

      {/* === ОСНОВНОЙ КОНТЕЙНЕР === */}
      <div className="page-transition" style={{
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f7fa',
      }}>
        
        <div className="dashboard-layout" style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          
          {/* === HEADER === */}
          <header className="dashboard-header slide-in-down" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '15px 30px 15px 80px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            <div className="dashboard-header-content" style={{
              maxWidth: '1400px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h1 className="dashboard-title fade-in" style={{
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0,
                letterSpacing: '0.5px',
              }}>
                IMS Dashboard
              </h1>
              
              {userInfo ? (
                <div className="user-info fade-in" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#666',
                    fontWeight: '500',
                    backgroundColor: '#f8f9fa',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #e0e0e0',
                  }}>
                    👤 {userInfo.username}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="glow-hover danger"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🚪 Выйти
                  </button>
                </div>
              ) : (
                <div style={{ padding: '8px 16px', color: '#999', fontSize: '14px' }}>
                  ⏳
                </div>
              )}
            </div>
          </header>

          {/* === MAIN CONTENT === */}
          <main 
            className="dashboard-main-content" 
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '20px',
              maxWidth: '1400px',
              margin: '0 auto',
              width: '100%',
              padding: '20px',
              boxSizing: 'border-box',
              alignItems: 'flex-start',
            }}
          >
            {/* Левая часть - кнопки */}
            <div className="left-column" style={{ flex: 1, minWidth: 0 }}>
              <h2 className="dashboard-section-title slide-in-left">Основное меню</h2>

              {/* Основные действия */}
              <div className="dashboard-section-group">
                <div className="dashboard-buttons-grid dashboard-grid-three-wide">
                  <button
                    onClick={() => setActiveModal('scan')}
                    className="dashboard-button dashboard-button-scan dashboard-button-wide card-hover"
                  >
                    <div className="dashboard-button-content">
                      <div className="dashboard-button-icon icon-bounce">🔍</div>
                      <h3 className="dashboard-button-label">Сканировать позицию</h3>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveModal('move')}
                    className="dashboard-button dashboard-button-move dashboard-button-wide card-hover"
                  >
                    <div className="dashboard-button-content">
                      <div className="dashboard-button-icon icon-bounce">🚚</div>
                      <h3 className="dashboard-button-label">Переместить позицию</h3>
                    </div>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setActiveModal('dispose')}
                      className="dashboard-button dashboard-button-dispose dashboard-button-wide card-hover"
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">🗑️</div>
                        <h3 className="dashboard-button-label">Удалить позицию</h3>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* История и печать */}
              <div className="dashboard-section-group">
                <h3 className="dashboard-subsection-title slide-in-left">История и печать</h3>
                <div className="dashboard-buttons-grid dashboard-grid-three">
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/inventory')}
                      className="dashboard-button dashboard-button-inventory card-hover"
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">📋</div>
                        <h3 className="dashboard-button-label">Номенклатура</h3>
                      </div>
                    </button>
                  </div>

                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/movement-history')}
                      className="dashboard-button dashboard-button-history card-hover"
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">📖</div>
                        <h3 className="dashboard-button-label">Журнал перемещений</h3>
                      </div>
                    </button>
                  </div>

                  <div className="dashboard-button-container">
                    <button
                      onClick={() => setActiveModal('printLabel')}
                      className="dashboard-button dashboard-button-print-label card-hover"
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">🖨️</div>
                        <h3 className="dashboard-button-label">Печать этикеток</h3>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Управление */}
              <div className="dashboard-section-group">
                <h3 className="dashboard-subsection-title slide-in-left">Управление складом</h3>
                <div className="dashboard-buttons-grid dashboard-grid-three">
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => setActiveModal('addLocation')}
                      className="dashboard-button dashboard-button-add-location card-hover"
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">🏪</div>
                        <h3 className="dashboard-button-label">Добавить склад</h3>
                      </div>
                    </button>
                  </div>

                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/add-item')}
                      className="dashboard-button dashboard-button-add card-hover"
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">➕</div>
                        <h3 className="dashboard-button-label">Добавить позицию</h3>
                      </div>
                    </button>
                  </div>

                  <div className="dashboard-button-container">
                    <button
                      onClick={openAddCarModal}
                      className="dashboard-button dashboard-button-add-car card-hover"
                      style={{ backgroundColor: '#9b59b6', color: 'white' }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">🚗</div>
                        <h3 className="dashboard-button-label">Добавить автомобиль</h3>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Продажа и Записи */}
              <div className="dashboard-section-group">
                <h3 className="dashboard-subsection-title slide-in-left">Продажа и Записи</h3>
                <div className="dashboard-buttons-grid dashboard-grid-two">
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/sell-part')}
                      className="dashboard-button dashboard-button-sell-part card-hover"
                      style={{ backgroundColor: '#e74c3c', color: 'white' }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">💰</div>
                        <h3 className="dashboard-button-label">Продажа запчасти</h3>
                      </div>
                    </button>
                  </div>
                  
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/garage-appointments')}
                      className="dashboard-button card-hover"
                      style={{ backgroundColor: '#16a085', color: 'white' }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">🔧</div>
                        <h3 className="dashboard-button-label">Записи в бокс</h3>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* === CRM АВТОСЕРВИС (НОВЫЙ РАЗДЕЛ) === */}
              <div className="dashboard-section-group" style={{
                backgroundColor: 'rgba(155, 89, 182, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px dashed rgba(155, 89, 182, 0.3)',
              }}>
                <h3 className="dashboard-subsection-title slide-in-left" style={{ color: '#9b59b6', marginBottom: '16px' }}>
                  🔧 Управление сервисом <span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>(CRM)</span>
                </h3>
                <div className="dashboard-buttons-grid dashboard-grid-two">
                  
                  {/* Заказ-наряды */}
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/crm/work-orders')}
                      className="dashboard-button card-hover"
                      style={{ 
                        backgroundColor: '#9b59b6', 
                        color: 'white',
                        border: '2px solid #8e44ad'
                      }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">📋</div>
                        <h3 className="dashboard-button-label">Заказ-наряды</h3>
                        <p style={{ fontSize: '11px', opacity: 0.9, margin: '4px 0 0' }}>
                          Создать • Редактировать • Статусы
                        </p>
                      </div>
                    </button>
                  </div>
                  
                  {/* Клиенты */}
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/crm/customers')}
                      className="dashboard-button card-hover"
                      style={{ 
                        backgroundColor: '#3498db', 
                        color: 'white',
                        border: '2px solid #2980b9'
                      }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">👥</div>
                        <h3 className="dashboard-button-label">Клиенты</h3>
                        <p style={{ fontSize: '11px', opacity: 0.9, margin: '4px 0 0' }}>
                          База • История • Лояльность
                        </p>
                      </div>
                    </button>
                  </div>
                  
                  {/* Платформы авто */}
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/platforms')}
                      className="dashboard-button card-hover"
                      style={{ 
                        backgroundColor: '#e74c3c', 
                        color: 'white',
                        border: '2px solid #c0392b'
                      }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">🏗️</div>
                        <h3 className="dashboard-button-label">Платформы авто</h3>
                        <p style={{ fontSize: '11px', opacity: 0.9, margin: '4px 0 0' }}>
                          Совместимость • Поиск по VIN
                        </p>
                      </div>
                    </button>
                  </div>
                  
                  {/* Дашборд CRM */}
                  <div className="dashboard-button-container">
                    <button
                      onClick={() => navigate('/crm')}
                      className="dashboard-button card-hover"
                      style={{ 
                        backgroundColor: '#27ae60', 
                        color: 'white',
                        border: '2px solid #219a52'
                      }}
                    >
                      <div className="dashboard-button-content">
                        <div className="dashboard-button-icon icon-bounce">📊</div>
                        <h3 className="dashboard-button-label">Дашборд CRM</h3>
                        <p style={{ fontSize: '11px', opacity: 0.9, margin: '4px 0 0' }}>
                          Статистика • Отчёты • Аналитика
                        </p>
                      </div>
                    </button>
                  </div>
                  
                </div>
                
                {/* Быстрая кнопка "Новый заказ-наряд" */}
                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => navigate('/crm/work-orders/new')}
                    className="glow-hover"
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: '#8e44ad',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(142, 68, 173, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(142, 68, 173, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(142, 68, 173, 0.3)';
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>➕</span>
                    Создать новый заказ-наряд
                  </button>
                </div>
              </div>
              {/* === КОНЕЦ РАЗДЕЛА CRM === */}

            </div>

            {/* Правая часть - календарь (только десктоп) */}
            <div className="right-column" style={{
              width: '320px',
              flexShrink: 0,
              position: 'sticky',
              top: '140px',
              alignSelf: 'flex-start',
            }}>
              <MiniCalendar token={token} />
            </div>
          </main>

        </div>
      </div>

      {/* === МОДАЛЬНЫЕ ОКНА === */}
      {activeModal === 'scan' && (
        <div className="modal-overlay">
          <ScanModal onClose={() => setActiveModal(null)} token={token} />
        </div>
      )}
      {activeModal === 'move' && (
        <div className="modal-overlay">
          <MoveModal onClose={() => setActiveModal(null)} token={token} />
        </div>
      )}
      {activeModal === 'dispose' && (
        <div className="modal-overlay">
          <DisposeModal onClose={() => setActiveModal(null)} token={token} />
        </div>
      )}
      {activeModal === 'addLocation' && (
        <div className="modal-overlay">
          <AddLocationModal onClose={() => setActiveModal(null)} token={token} />
        </div>
      )}
      {activeModal === 'printLabel' && (
        <div className="modal-overlay">
          <PrintLabelModal onClose={() => setActiveModal(null)} token={token} />
        </div>
      )}
      {addCarModalOpen && (
        <div className="modal-overlay">
          <AddCarModal onClose={closeAddCarModal} token={token} />
        </div>
      )}
      {sqlConsoleOpen && (
        <div className="modal-overlay">
          <SQLConsole onClose={closeSQLConsole} />
        </div>
      )}
      {addUserModalOpen && (
        <div className="modal-overlay">
          <AddUserModal onClose={closeAddUserModal} />
        </div>
      )}
      {aboutDeveloperOpen && (
        <div className="modal-overlay">
          <AboutDeveloper onClose={closeAboutDeveloper} />
        </div>
      )}
      {addManufacturerModalOpen && (
        <div className="modal-overlay">
          <AddManufacturerModal onClose={closeAddManufacturerModal} />
        </div>
      )}
      {addCategoryModalOpen && (
        <div className="modal-overlay">
          <AddCategoryModal onClose={closeAddCategoryModal} />
        </div>
      )}
      {nodeLogConsoleOpen && (
        <div className="modal-overlay">
          <NodeLogConsole onClose={closeNodeLogConsole} />
        </div>
      )}
    </>
  );
}

export default Dashboard;