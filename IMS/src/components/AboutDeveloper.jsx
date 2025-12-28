import React from 'react';

function AboutDeveloper({ onClose }) {
  return (
    <div className="about-developer-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div className="about-developer-modal-content" style={{
        width: '600px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div className="about-developer-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>О разработчике</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>

        <div className="about-developer-body">
          <p>Разработчик: <strong>Ваше Имя</strong></p>
          <p>Контакт: <a href="mailto:your.email@example.com">your.email@example.com</a></p>
          <p>Проект: <strong>IMS (Inventory Management System)</strong></p>
          <p>Дата создания: <strong>Декабрь 2025</strong></p>
          <p>Технологии:</p>
          <ul>
            <li>Frontend: React, Vite</li>
            <li>Backend: Node.js, Express</li>
            <li>Database: PostgreSQL</li>
            <li>Authentication: JWT</li>
          </ul>
          <p>Этот проект создан для управления складским учётом и инвентарём.</p>
        </div>
      </div>
    </div>
  );
}

export default AboutDeveloper;