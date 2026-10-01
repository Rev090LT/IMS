// IMS/src/pages/RootRedirect.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RootRedirect() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
useEffect(() => {
  const checkSetup = async () => {
    try {
      const response = await fetch(`/api/settings/check?t=${Date.now()}`);
      const data = await response.json();
      
      if (data.isConfigured === true) {
        const token = localStorage.getItem('token');
        navigate(token ? '/dashboard' : '/login', { replace: true });
      } else {
        // 🔥 Система сброшена — чистим токен и идём на setup
        localStorage.removeItem('token');
        navigate('/setup', { replace: true });
      }
    } catch (error) {
      console.error('Ошибка проверки настройки:', error);
      navigate('/login', { replace: true });
    } finally {
      setChecking(false);
    }
  };

  checkSetup();
}, [navigate]);

  if (checking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#f5f7fa',
        fontSize: '18px',
        color: '#666'
      }}>
         Загрузка системы...
      </div>
    );
  }

  return null;
}

export default RootRedirect;