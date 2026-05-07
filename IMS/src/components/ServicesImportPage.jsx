// IMS/src/pages/ServicesImportPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ServicesImportPage({ token }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/crm/services/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Ошибка импорта');
      }
    } catch (err) {
      setError('Ошибка: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📥 Импорт услуг из 1С: Альфа-Авто</h1>
          <button 
            onClick={() => navigate('/crm')}
            style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ← Назад
          </button>
        </div>

        {/* Upload Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px' }}>📄 Загрузите Excel файл</h3>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Файл должен содержать колонки: Код, Наименование, Родитель, Время выполнения
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ 
              padding: '12px', 
              border: '2px dashed #ddd', 
              borderRadius: '8px', 
              width: '100%',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          />

          {uploading && (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              <p>Импорт услуг... Пожалуйста, подождите</p>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#fadbd8', 
              color: '#e74c3c', 
              borderRadius: '6px',
              border: '1px solid #e74c3c'
            }}>
              ❌ {error}
            </div>
          )}

          {result && (
            <div style={{ 
              marginTop: '20px', 
              padding: '20px', 
              backgroundColor: '#d5f5e3', 
              color: '#27ae60', 
              borderRadius: '6px',
              border: '1px solid #27ae60'
            }}>
              <h3 style={{ margin: '0 0 15px' }}>✅ Импорт завершён!</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <strong>Импортировано:</strong> {result.stats?.imported || 0}
                </div>
                <div>
                  <strong>Обновлено:</strong> {result.stats?.updated || 0}
                </div>
                <div>
                  <strong>Пропущено:</strong> {result.stats?.skipped || 0}
                </div>
                <div>
                  <strong>Сообщение:</strong> {result.message}
                </div>
              </div>
              <button
                onClick={() => navigate('/crm/work-orders/new')}
                style={{ 
                  marginTop: '20px', 
                  padding: '10px 20px', 
                  backgroundColor: '#27ae60', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer'
                }}
              >
                ➕ Создать заказ-наряд
              </button>
            </div>
          )}

        </div>

        {/* Instructions */}
        <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px' }}>📋 Инструкция</h3>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#666' }}>
            <li>Экспортируйте услуги из 1С: Альфа-Авто в Excel</li>
            <li>Убедитесь что есть колонки: <strong>Код</strong>, <strong>Наименование</strong>, <strong>Родитель</strong>, <strong>Время выполнения</strong></li>
            <li>Загрузите файл через форму выше</li>
            <li>Дождитесь завершения импорта</li>
            <li>Перейдите к созданию заказ-наряда и выберите услуги из справочника</li>
          </ol>
        </div>

      </div>
    </div>
  );
}

export default ServicesImportPage;