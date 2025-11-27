import { useState, useEffect } from 'react';
import ScanModal from './ScanModal';
import MoveModal from './MoveModal';
import DisposeModal from './DisposeModal';
import InventoryModal from './InventoryModal';
import AddItemModal from './AddItemModal';
function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
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
    window.location.href = '/login';
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="text-center">
          <p className="login-error">Not authenticated. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Шапка */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">IMS Dashboard</h1>
      </header>

      {/* Основной контент */}
      <main className="dashboard-main">
        <div className="user-info-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {userInfo && <span className="user-info">Здравствуйте, {userInfo.username}!</span>}
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            Выйти из системы
          </button>
        </div>
        <h2 className="dashboard-actions-title">Главное меню</h2>

        {/* Кнопки действий */}
        <div className="dashboard-actions-grid">
          <button
            onClick={() => setActiveModal('scan')}
            className="action-btn"
          >
            🔍 Сканировать позицию
          </button>

          <button
            onClick={() => setActiveModal('move')}
            className="action-btn move"
          >
            🚚 Переместить позицию
          </button>

          <button
            onClick={() => setActiveModal('dispose')}
            className="action-btn dispose"
          >
            🗑️ Удалить позицию
          </button>

          <button
            onClick={() => setActiveModal('inventory')}
            className="action-btn inventory"
          >
            📋 Посмотреть товары
          </button>

            <button
            onClick={() => setActiveModal('add')}
            className="action-btn"
            style={{ backgroundColor: '#f39c12' }} // Оранжевый цвет
            >
            ➕ Добавить позицию в базу
        </button>
        </div>

        {/* Модальные окна */}
        {activeModal === 'scan' && <ScanModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'move' && <MoveModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'dispose' && <DisposeModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'inventory' && <InventoryModal onClose={() => setActiveModal(null)} token={token} />}
        {activeModal === 'add' && <AddItemModal onClose={() => setActiveModal(null)} token={token} />}
      </main>
    </div>
  );
}

export default Dashboard;