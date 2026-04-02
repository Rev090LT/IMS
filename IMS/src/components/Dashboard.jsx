// IMS/src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ScanModal from './ScanModal';
import MoveModal from './MoveModal';
import DisposeModal from './DisposeModal';
import AddItemModal from './AddItemModal';
import AddLocationModal from './AddLocationModal';
// ❌ УБРАЛ: MovementHistoryModal — больше не нужен как модальное окно
import PrintLabelModal from './PrintLabelModal';
import SellPartModal from './SellPartModal';
import SQLConsole from './SQLConsole';
import AddUserModal from './AddUserModal';
import AboutDeveloper from './AboutDeveloper';
import AddManufacturerModal from './AddManufacturerModal';
import AddCategoryModal from './AddCategoryModal';
import AddCarModal from './AddCarModal';
import NodeLogConsole from './NodeLogConsole';
import backgroundImage from './tracktime.jpg';

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

  return (
    <>
      {/* === КНОПКА МЕНЮ - показывается ТОЛЬКО когда sidebar закрыт === */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="glow-hover"
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
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
            animation: sidebarOpen ? 'none' : 'fadeIn 0.3s ease',
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
      />

      {/* === ОСНОВНОЙ КОНТЕЙНЕР С ФОНОМ === */}
      <div className="page-transition" style={{
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100%',
        margin: 0,
        padding: 0,
      }}>
        
        <div className="dashboard-layout" style={{
          minHeight: '100vh',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
        }}>
          
          <header className="dashboard-header slide-in-down">
            <div className="dashboard-header-content">
              <h1 className="dashboard-title fade-in">IMS Dashboard</h1>
            </div>
          </header>

          <main className="dashboard-main-content dashboard-main-content-flex">
            <div className="dashboard-user-info-bar fade-in">
              {userInfo && <span className="user-info-text">Добро пожаловать, {userInfo.username}!</span>}
            </div>

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
                  {/* ✅ ИЗМЕНЕНО: Журнал номенклатуры — переход на страницу */}
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
                  {/* ✅ ИЗМЕНЕНО: Журнал перемещений — переход на страницу */}
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
              <h3 className="dashboard-subsection-title slide-in-left">Управление</h3>
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
                    onClick={() => setActiveModal('add')}
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

            {/* Продажа */}
            <div className="dashboard-section-group">
              <h3 className="dashboard-subsection-title slide-in-left">Продажа</h3>
              <div className="dashboard-buttons-grid dashboard-grid-one">
                <div className="dashboard-button-container">
                  <button
                    onClick={openSellPartModal}
                    className="dashboard-button dashboard-button-sell-part card-hover"
                    style={{ backgroundColor: '#e74c3c', color: 'white' }}
                  >
                    <div className="dashboard-button-content">
                      <div className="dashboard-button-icon icon-bounce">💰</div>
                      <h3 className="dashboard-button-label">Продажа запчасти</h3>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="dashboard-logout-container fade-in">
              <button 
                onClick={handleLogout} 
                className="logout-btn glow-hover danger"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Выйти из системы
              </button>
            </div>
          </main>

        </div>
      </div>

      {/* === МОДАЛЬНЫЕ ОКНА - ВЫНЕСЕНЫ ВНЕ ВСЕХ КОНТЕЙНЕРОВ === */}
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
      {activeModal === 'add' && (
        <div className="modal-overlay">
          <AddItemModal onClose={() => setActiveModal(null)} token={token} onItemAdded={handleItemAdded} />
        </div>
      )}
      {activeModal === 'addLocation' && (
        <div className="modal-overlay">
          <AddLocationModal onClose={() => setActiveModal(null)} token={token} />
        </div>
      )}
      {/* ❌ УБРАЛ: Модальное окно журнала перемещений — теперь это отдельная страница */}
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
      {sellPartModalOpen && (
        <div className="modal-overlay">
          <SellPartModal onClose={closeSellPartModal} token={token} />
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