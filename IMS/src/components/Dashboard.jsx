import { useState, useEffect } from 'react';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import ScanModal from './ScanModal';
import MoveModal from './MoveModal';
import DisposeModal from './DisposeModal';
import InventoryModal from './InventoryModal';
import AddItemModal from './AddItemModal';
import AddLocationModal from './AddLocationModal';
import MovementHistoryModal from './MovementHistoryModal'; // Новый компонент
import PrintLabelModal from './PrintLabelModal'; // Импортируем новый компонент


// Компонент для проверки аутентификации
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Компонент для редиректа, если уже залогинен
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" />;
};

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'scan', 'move', 'dispose', 'inventory', 'add', 'addLocation', 'history'
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

  if (!token) {
    return <div>Not authenticated. Redirecting...</div>; // На практике редирект должен быть раньше
  }

  return (
    <div className="dashboard-layout">
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
    </div>
  );
}


export default Dashboard;