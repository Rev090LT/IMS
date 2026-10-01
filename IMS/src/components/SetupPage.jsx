// IMS/src/pages/SetupPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [formData, setFormData] = useState({
    // Настройки компании
    company_name: 'TrackTime Performance',
    company_phone: '+7 (999) 123-45-67',
    hourly_rate: '1500',
    currency_symbol: '₽',
    nds_rate: '20',
    // Данные администратора
    admin_username: 'admin',
    admin_email: 'admin@ims.local',
    admin_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);
    const [alreadyConfigured, setAlreadyConfigured] = useState(false);

    const checkSetupStatus = async () => {
    try {
        const response = await fetch('/api/settings/check');
        const data = await response.json();
        
        if (data.isConfigured) {
        setAlreadyConfigured(true); // Показываем сообщение вместо редиректа
        }
    } catch (error) {
        console.error('Error checking setup:', error);
    } finally {
        setLoading(false);
    }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка паролей
    if (formData.admin_password !== formData.confirm_password) {
      setPasswordError('Пароли не совпадают!');
      return;
    }
    if (formData.admin_password.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов!');
      return;
    }
    setPasswordError('');
    setSaving(true);

    try {
      const response = await fetch('/api/settings/initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✅ Система успешно настроена! Теперь вы можете войти под своим логином.');
        navigate('/login');
      } else {
        const err = await response.json();
        alert('Ошибка: ' + (err.error || 'Не удалось сохранить'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: '600',
    color: '#2c3e50', marginBottom: '6px'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7fa' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>⏳ Проверка системы...</div>
      </div>
    );
  }
  if (alreadyConfigured) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>Система уже настроена</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Первоначальная настройка уже была завершена. Войдите в систему, чтобы продолжить работу.</p>
        <button 
          onClick={() => navigate('/login')}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '15px', 
            fontWeight: '600', 
            cursor: 'pointer' 
          }}
        >
          Перейти ко входу →
        </button>
      </div>
    </div>
  );
}
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', width: '100%', maxWidth: '550px', overflow: 'hidden' }}>
        
        {/* Шапка */}
        <div style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', padding: '30px', textAlign: 'center', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>🚀 Добро пожаловать в IMS</h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            Первоначальная настройка системы. Это займет всего минуту.
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* Блок 1: Администратор */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👤 Главный администратор
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Логин (Username) *</label>
                  <input type="text" required value={formData.admin_username} onChange={(e) => setFormData({...formData, admin_username: e.target.value})} style={inputStyle} placeholder="admin" />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" required value={formData.admin_email} onChange={(e) => setFormData({...formData, admin_email: e.target.value})} style={inputStyle} placeholder="admin@ims.local" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Пароль *</label>
                    <input type="password" required value={formData.admin_password} onChange={(e) => setFormData({...formData, admin_password: e.target.value})} style={inputStyle} placeholder="Мин. 6 символов" />
                  </div>
                  <div>
                    <label style={labelStyle}>Подтверждение *</label>
                    <input type="password" required value={formData.confirm_password} onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} style={{...inputStyle, borderColor: passwordError ? '#e74c3c' : '#ddd'}} placeholder="Повторите пароль" />
                  </div>
                </div>
                {passwordError && <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '-5px' }}>⚠️ {passwordError}</div>}
              </div>
            </div>

            {/* Блок 2: Компания */}
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🏢 Настройки компании
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={labelStyle}>Название компании *</label>
                  <input type="text" required value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} style={inputStyle} placeholder="TrackTime Performance" />
                </div>
                <div>
                  <label style={labelStyle}>Контактный телефон *</label>
                  <input type="tel" required value={formData.company_phone} onChange={(e) => setFormData({...formData, company_phone: e.target.value})} style={inputStyle} placeholder="+7 (999) 123-45-67" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Ставка/час (₽)</label>
                    <input type="number" required value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} style={inputStyle} placeholder="1500" />
                  </div>
                  <div>
                    <label style={labelStyle}>Валюта</label>
                    <input type="text" required value={formData.currency_symbol} onChange={(e) => setFormData({...formData, currency_symbol: e.target.value})} style={inputStyle} placeholder="₽" />
                  </div>
                  <div>
                    <label style={labelStyle}>НДС (%)</label>
                    <input type="number" value={formData.nds_rate} onChange={(e) => setFormData({...formData, nds_rate: e.target.value})} style={inputStyle} placeholder="20" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', backgroundColor: saving ? '#95a5a6' : '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '30px', transition: 'background 0.2s' }}>
            {saving ? '⏳ Сохранение и настройка...' : '💾 Завершить настройку системы'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetupPage;