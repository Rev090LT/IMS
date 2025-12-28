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
import Sidebar from './Sidebar';
import SQLConsole from './SQLConsole';
import AddUserModal from './AddUserModal'; // <= Импортируем новый модал
import AboutDeveloper from './AboutDeveloper'; // <= Импортируем компонент "О разработчике"


function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sqlConsoleOpen, setSqlConsoleOpen] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false); // <= Новое состояние
  const [aboutDeveloperOpen, setAboutDeveloperOpen] = useState(false); // <= Новое состояние для "О разработчике"
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({ id: payload.id, username: payload.username });
      } catch (e) {
        console.error('Invalid token', e);
        window.location.href = '/login';
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; // Или используйте navigate('/login') если настроена навигация
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

  // <<<--- Функции для добавления пользователя --->>>
  const openAddUserModal = () => {
    setAddUserModalOpen(true);
  };

  const closeAddUserModal = () => {
    setAddUserModalOpen(false);
  };

  // <<<--- Функции для "О разработчике" --->>>
  const openAboutDeveloper = () => {
    setAboutDeveloperOpen(true);
  };

  const closeAboutDeveloper = () => {
    setAboutDeveloperOpen(false);
  };

  if (!token) {
    return <div>Not authenticated. Redirecting...</div>; // На практике редирект должен быть раньше
  }

  return (
    // <<<--- Вот тут добавим фон --->>>
    <div style={{
      backgroundImage: 'url(/tracktime.jpg) ', // Замените на реальный URL
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh',
    }}>
      <div className="dashboard-layout">
        {/* Кнопка для открытия боковой панели */}
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

        {/* Боковая панель */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSQLConsole={openSQLConsole}
          onOpenAddUserModal={openAddUserModal}
          onOpenAboutDeveloper={openAboutDeveloper} // <= Передаём функцию
        />

        {/* Шапка */}
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <h1 className="dashboard-title">IMS Dashboard</h1>
          </div>
        </header>

        {/* Основной контент */}
        <main className="dashboard-main-content dashboard-main-content-flex">
          {/* Информация о пользователе */}
          <div className="dashboard-user-info-bar">
            {userInfo && <span className="user-info-text">Welcome, {userInfo.username}!</span>}
          </div>

          <h2 className="dashboard-section-title">Основное меню</h2>

          {/* Группа: Управление инвентарём */}
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

              <button
                onClick={() => setActiveModal('dispose')}
                className="dashboard-button dashboard-button-dispose dashboard-button-wide"
              >
                <div className="dashboard-button-content">
                  <div className="dashboard-button-icon">🗑️</div>
                  <h3 className="dashboard-button-label">Удалить позицию</h3>
                </div>
              </button>
            </div>
          </div>

          {/* Группа: Просмотр и история */}
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

              {/* НОВАЯ КНОПКА "PRINT LABEL" В ГРУППЕ View & History */}
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

          {/* Группа: Управление (дополнительно) */}
          <div className="dashboard-section-group">
            <h3 className="dashboard-subsection-title">Управление</h3>
            <div className="dashboard-buttons-grid dashboard-grid-two">
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
            </div>
          </div>

          {/* Кнопка Logout внизу */}
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
        {activeModal === 'add' && <AddItemModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'addLocation' && <AddLocationModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'history' && <MovementHistoryModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'printLabel' && <PrintLabelModal onClose={() => setActiveModal(null)} />}
        {sqlConsoleOpen && <SQLConsole onClose={closeSQLConsole} />}
        {addUserModalOpen && <AddUserModal onClose={closeAddUserModal} />}
        {/* <<<--- Вот тут добавим модал "О разработчике" --->>> */}
        {aboutDeveloperOpen && <AboutDeveloper onClose={closeAboutDeveloper} />}
      </div>
    </div>
  );
}

export default Dashboard;