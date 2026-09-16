// IMS/src/components/InDevelopment.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function InDevelopment({ title = 'Раздел', onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      margin: '20px'
    }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>
        🚧
      </div>
      
      <h1 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '28px', 
        color: '#2c3e50' 
      }}>
        {title}
      </h1>
      
      <div style={{
        display: 'inline-block',
        padding: '8px 20px',
        backgroundColor: '#f39c12',
        color: 'white',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '20px'
      }}>
        ⚙️ В РАЗРАБОТКЕ
      </div>
      
      <p style={{ 
        fontSize: '16px', 
        color: '#7f8c8d', 
        maxWidth: '500px',
        lineHeight: '1.6',
        marginBottom: '30px'
      }}>
        Этот раздел находится в активной разработке. 
        Мы работаем над его функциональностью и скоро он будет доступен.
      </p>
      
      <button 
        onClick={handleBack}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
      >
        ← Вернуться назад
      </button>
    </div>
  );
}

export default InDevelopment;