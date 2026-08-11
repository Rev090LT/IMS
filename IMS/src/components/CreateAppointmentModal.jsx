// IMS/src/components/CreateAppointmentModal.jsx
import React, { useState } from 'react';

function CreateAppointmentModal({ onClose, token, selectedDate, onAppointmentCreated }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    car_model: '',
    car_vin: '',
    car_license_plate: '',
    appointment_date: selectedDate || new Date().toISOString().split('T')[0],
    appointment_time: '',
    reason: '',
    notes: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.appointment_date) {
      setError('Имя клиента и дата обязательны');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании записи');
      }

      if (onAppointmentCreated) {
        onAppointmentCreated(data.appointment);
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '15px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500',
    color: '#2c3e50',
    fontSize: '14px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>🔧 Новая запись в гараж</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>✕</button>
        </div>

        {error && (
          <div style={{ color: '#e74c3c', backgroundColor: '#fadbd8', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label style={labelStyle}>👤 Имя клиента *</label>
              <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Иванов Иван" style={inputStyle} required />
            </div>
            
            <div>
              <label style={labelStyle}>📞 Телефон</label>
              <input type="tel" name="customer_phone" value={formData.customer_phone} onChange={handleChange} placeholder="+7 (999) 000-00-00" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>📧 Email</label>
            <input type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} placeholder="email@example.com" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label style={labelStyle}>🚗 Автомобиль</label>
              <input type="text" name="car_model" value={formData.car_model} onChange={handleChange} placeholder="BMW X5" style={inputStyle} />
            </div>
            
            <div>
              <label style={labelStyle}>🔢 Номерной знак</label>
              <input type="text" name="car_license_plate" value={formData.car_license_plate} onChange={handleChange} placeholder="А000АА 72" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>VIN номер</label>
            <input type="text" name="car_vin" value={formData.car_vin} onChange={handleChange} placeholder="WBA..." style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label style={labelStyle}>📅 Дата записи *</label>
              <input type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} style={inputStyle} required />
            </div>
            
            <div>
              <label style={labelStyle}>🕐 Время</label>
              <input type="time" name="appointment_time" value={formData.appointment_time} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>📝 Причина обращения</label>
            <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Замена масла, диагностика..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>📌 Заметки</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Внутренние заметки..." style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ ...buttonStyle, backgroundColor: '#95a5a6', color: 'white' }}>Отмена</button>
            <button type="submit" disabled={loading} style={{ ...buttonStyle, backgroundColor: loading ? '#95a5a6' : '#27ae60', color: 'white' }}>
              {loading ? '⏳ Создание...' : '✅ Создать запись'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAppointmentModal;