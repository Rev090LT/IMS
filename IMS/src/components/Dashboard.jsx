import { useState, useEffect } from 'react';
import Login from './Login';
import { useNavigate, Navigate } from 'react-router-dom';
import ScanModal from './ScanModal';
import MoveModal from './MoveModal';
import DisposeModal from './DisposeModal';
import InventoryModal from './InventoryModal';
import AddItemModal from './AddItemModal';
import AddLocationModal from './AddLocationModal';
import MovementHistoryModal from './MovementHistoryModal';
import PrintLabelModal from './PrintLabelModal';
import SellPartModal from './SellPartModal';
import Sidebar from './Sidebar';
import SQLConsole from './SQLConsole';
import AddUserModal from './AddUserModal';
import AboutDeveloper from './AboutDeveloper';
import AddManufacturerModal from './AddManufacturerModal';
import AddCategoryModal from './AddCategoryModal';
import AddCarModal from './AddCarModal';
import NodeLogConsole from './NodeLogConsole';
import backgroundImage from './tracktime.jpg'; // <<<--- Импортируем картинку

function Dashboard() {
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
        console.log('User Info from token:', { id: payload.id, username: payload.username, role: payload.role });
        console.log('Dashboard token:', token);
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openSQLConsole = () => {
    setSqlConsoleOpen(true);
  };

  const closeSQLConsole = () => {
    setSqlConsoleOpen(false);
  };

  const openAddUserModal = () => {
    setAddUserModalOpen(true);
  };

  const closeAddUserModal = () => {
    setAddUserModalOpen(false);
  };

  const openAboutDeveloper = () => {
    setAboutDeveloperOpen(true);
  };

  const closeAboutDeveloper = () => {
    setAboutDeveloperOpen(false);
  };

  const openAddManufacturerModal = () => {
    setAddManufacturerModalOpen(true);
  };

  const closeAddManufacturerModal = () => {
    setAddManufacturerModalOpen(false);
  };

  const openAddCategoryModal = () => {
    setAddCategoryModalOpen(true);
  };

  const closeAddCategoryModal = () => {
    setAddCategoryModalOpen(false);
  };

  const openAddCarModal = () => {
    setAddCarModalOpen(true);
  };

  const closeAddCarModal = () => {
    setAddCarModalOpen(false);
  };

  const openSellPartModal = () => {
    setSellPartModalOpen(true);
  };

  const closeSellPartModal = () => {
    setSellPartModalOpen(false);
  };

  const openNodeLogConsole = () => {
    setNodeLogConsoleOpen(true);
  };

  const closeNodeLogConsole = () => {
    setNodeLogConsoleOpen(false);
  };

  const handleItemAdded = () => {
    console.log('Item added, refresh needed');
  };

  if (!token) {
    return <div>Not authenticated. Redirecting...</div>;
  }

  const isAdmin = userInfo?.role === 'admin';

  return (
    <div style={{
      backgroundImage: `url(${backgroundImage})`, // <<<--- Вот тут исправили
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      position: 'relative',
      zIndex: 0,
    }}>
      <div className="dashboard-layout">
        <button
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            padding: '10px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ☰ 
        </button>

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

        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <h1 className="dashboard-title">IMS Dashboard</h1>
          </div>
        </header>

        <main className="dashboard-main-content dashboard-main-content-flex">
          <div className="dashboard-user-info-bar">
            {userInfo && <span className="user-info-text">Добро пожаловать, {userInfo.username}!</span>}
          </div>

          <h2 className="dashboard-section-title">Основное меню</h2>

          <div className="dashboard-section-group">
            <div className="dashboard-buttons-grid dashboard-grid-three-wide">
              <button
                onClick={() => setActiveModal('scan')}
                className="dashboard-button dashboard-button-scan dashboard-button-wide"
              >
                <div className="dashboard-button-content">
                  <div className="dashboard-button-icon">🔍</div>
                  <h3 className="dashboard-button-label">Сканировать позицию</h3>
                </div>
              </button>

              <button
                onClick={() => setActiveModal('move')}
                className="dashboard-button dashboard-button-move dashboard-button-wide"
              >
                <div className="dashboard-button-content">
                  <div className="dashboard-button-icon">🚚</div>
                  <h3 className="dashboard-button-label">Переместить позицию</h3>
                </div>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveModal('dispose')}
                  className="dashboard-button dashboard-button-dispose dashboard-button-wide"
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">🗑️</div>
                    <h3 className="dashboard-button-label">Удалить позицию</h3>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-section-group">
            <h3 className="dashboard-subsection-title">История и печать</h3>
            <div className="dashboard-buttons-grid dashboard-grid-three">
              <div className="dashboard-button-container">
                <button
                  onClick={() => setActiveModal('inventory')}
                  className="dashboard-button dashboard-button-inventory"
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">📋</div>
                    <h3 className="dashboard-button-label">Журнал склада</h3>
                  </div>
                </button>
              </div>

              <div className="dashboard-button-container">
                <button
                  onClick={() => setActiveModal('history')}
                  className="dashboard-button dashboard-button-history"
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">📖</div>
                    <h3 className="dashboard-button-label">Журнал перемещений</h3>
                  </div>
                </button>
              </div>

              <div className="dashboard-button-container">
                <button
                  onClick={() => setActiveModal('printLabel')}
                  className="dashboard-button dashboard-button-print-label"
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">🖨️</div>
                    <h3 className="dashboard-button-label">Печать этикеток</h3>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-section-group">
            <h3 className="dashboard-subsection-title">Управление</h3>
            <div className="dashboard-buttons-grid dashboard-grid-three">
              <div className="dashboard-button-container">
                <button
                  onClick={() => setActiveModal('addLocation')}
                  className="dashboard-button dashboard-button-add-location"
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">🏪</div>
                    <h3 className="dashboard-button-label">Добавить склад</h3>
                  </div>
                </button>
              </div>

              <div className="dashboard-button-container">
                <button
                  onClick={() => setActiveModal('add')}
                  className="dashboard-button dashboard-button-add"
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">➕</div>
                    <h3 className="dashboard-button-label">Добавить позицию</h3>
                  </div>
                </button>
              </div>

              <div className="dashboard-button-container">
                <button
                  onClick={openAddCarModal}
                  className="dashboard-button dashboard-button-add-car"
                  style={{
                    backgroundColor: '#9b59b6',
                    color: 'white',
                  }}
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">🚗</div>
                    <h3 className="dashboard-button-label">Добавить автомобиль</h3>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-section-group">
            <h3 className="dashboard-subsection-title">Продажа</h3>
            <div className="dashboard-buttons-grid dashboard-grid-one">
              <div className="dashboard-button-container">
                <button
                  onClick={openSellPartModal}
                  className="dashboard-button dashboard-button-sell-part"
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                  }}
                >
                  <div className="dashboard-button-content">
                    <div className="dashboard-button-icon">💰</div>
                    <h3 className="dashboard-button-label">Продажа запчасти</h3>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-logout-container">
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Выйти из системы
            </button>
          </div>
        </main>
        {/* Модальные окна */}
        {activeModal === 'scan' && <ScanModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'move' && <MoveModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'dispose' && <DisposeModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'inventory' && <InventoryModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'add' && <AddItemModal onClose={() => setActiveModal(null)} token={token} onItemAdded={handleItemAdded} />}
        {activeModal === 'addLocation' && <AddLocationModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'history' && <MovementHistoryModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'printLabel' && <PrintLabelModal onClose={() => setActiveModal(null)} token={token} />}
        {addCarModalOpen && <AddCarModal onClose={closeAddCarModal} token={token} />}
        {sellPartModalOpen && <SellPartModal onClose={closeSellPartModal} token={token} />}
        {sqlConsoleOpen && <SQLConsole onClose={closeSQLConsole} />}
        {addUserModalOpen && <AddUserModal onClose={closeAddUserModal} />}
        {aboutDeveloperOpen && <AboutDeveloper onClose={closeAboutDeveloper} />}
        {addManufacturerModalOpen && <AddManufacturerModal onClose={closeAddManufacturerModal} />}
        {addCategoryModalOpen && <AddCategoryModal onClose={closeAddCategoryModal} />}
        {nodeLogConsoleOpen && <NodeLogConsole onClose={closeNodeLogConsole} />}
      </div>
    </div>
  );
}

export default Dashboard;