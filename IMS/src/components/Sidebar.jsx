import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <<<--- Импортируем для навигации

function Sidebar({ isOpen, onClose, onOpenSQLConsole, onOpenNodeLogConsole, onOpenAddUserModal, onOpenAboutDeveloper, onOpenAddManufacturerModal, onOpenAddCategoryModal, userRole }) {
  const [showCarListModal, setShowCarListModal] = useState(false);
  const [showSoldPartsModal, setShowSoldPartsModal] = useState(false);
  const navigate = useNavigate(); // <<<--- Хук для навигации
  const isAdmin = userRole === 'admin';

  const openCarListModal = () => {
    setShowCarListModal(true);
  };

  const closeCarListModal = () => {
    setShowCarListModal(false);
  };

  const openSoldPartsModal = () => {
    setShowSoldPartsModal(true);
  };

  const closeSoldPartsModal = () => {
    setShowSoldPartsModal(false);
  };

  // <<<--- Функция для перехода на страницу администрирования --->
  const goToAdminPanel = () => {
    navigate('/admin-panel');
    onClose();
  };

  // <<<--- Функция для перехода на страницу документооборота --->
  const goToDocumentFlow = () => {
    navigate('/document-flow');
    onClose();
  };

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
        <div style={{ padding: '20px', paddingTop: '60px' }}>
          <h3>Меню подсистем</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenAddCategoryModal) onOpenAddCategoryModal();
                  onClose();
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                Добавить категорию запчасти
              </a>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenAddManufacturerModal) onOpenAddManufacturerModal();
                  onClose();
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                Добавить производителя
              </a>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  openCarListModal();
                  onClose();
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                Автомобили в разборе
              </a>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  openSoldPartsModal();
                  onClose();
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                Проданные запчасти
              </a>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <a
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenAboutDeveloper) onOpenAboutDeveloper();
                  onClose();
                }}
                style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
              >
                О разработчике
              </a>
            </li>
            {isAdmin && (
              <>
                <li style={{ marginBottom: '20px' }}>
                  <a
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      goToAdminPanel(); // <<<--- Переход на /admin-panel
                    }}
                    style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
                  >
                    Администрирование
                  </a>
                </li>
                <li style={{ marginBottom: '20px' }}>
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    goToDocumentFlow(); // <<<--- Переход на /document-flow
                  }}
                  style={{ color: 'white', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}
                >
                  Документооборот
                </a>
            </li>
              </>
            )}
          </ul>
        </div>
      </div>
      {showSoldPartsModal && (
        <SoldPartsModal onClose={closeSoldPartsModal} token={localStorage.getItem('token')} />
      )}
      {showCarListModal && (
        <CarListModal onClose={closeCarListModal} token={localStorage.getItem('token')} />
      )}
    </>
  );
}

export default Sidebar;