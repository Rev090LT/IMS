// IMS/src/components/EditAppointmentModal.jsx
import React, { useState, useEffect } from 'react';

function EditAppointmentModal({ onClose, token, appointment, onAppointmentUpdated }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    car_model: '',
    car_vin: '',
    car_license_plate: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    notes: '',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Заполняем форму данными из appointment
  useEffect(() => {
    if (appointment) {
      setFormData({
        customer_name: appointment.customer_name || '',
        customer_phone: appointment.customer_phone || '',
        customer_email: appointment.customer_email || '',
        car_model: appointment.car_model || '',
        car_vin: appointment.car_vin || '',
        car_license_plate: appointment.car_license_plate || '',
        appointment_date: appointment.appointment_date ? new Date(appointment.appointment_date).toISOString().split('T')[0] : '',
        appointment_time: appointment.appointment_time ? appointment.appointment_time.substring(0, 5) : '',
        reason: appointment.reason || '',
        notes: appointment.notes || '',
        status: appointment.status || 'scheduled'
      });
    }
  }, [appointment]);

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
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при обновлении записи');
      }

      console.log('✅ Запись обновлена:', data.appointment);

      if (onAppointmentUpdated) {
        onAppointmentUpdated(data.appointment);
      }
      
      onClose();
    } catch (err) {
      console.error('❌ Ошибка при обновлении:', err);
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
          <h2 style={{ margin: 0, fontSize: '20px' }}>✏️ Редактировать запись</h2>
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
              <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} style={inputStyle} required />
            </div>
            
            <div>
              <label style={labelStyle}>📞 Телефон</label>
              <input type="tel" name="customer_phone" value={formData.customer_phone} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>📧 Email</label>
            <input type="email" name="customer_email" value={formData.customer_email} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label style={labelStyle}>🚗 Автомобиль</label>
              <input type="text" name="car_model" value={formData.car_model} onChange={handleChange} style={inputStyle} />
            </div>
            
            <div>
              <label style={labelStyle}>🔢 Номерной знак</label>
              <input type="text" name="car_license_plate" value={formData.car_license_plate} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>VIN номер</label>
            <input type="text" name="car_vin" value={formData.car_vin} onChange={handleChange} style={inputStyle} />
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
            <textarea name="reason" value={formData.reason} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>📌 Заметки</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
          </div>

          <div>
            <label style={labelStyle}>📊 Статус</label>
            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
              <option value="scheduled">📅 Запланирована</option>
              <option value="completed">✅ Выполнена</option>
              <option value="cancelled">❌ Отменена</option>
              <option value="no-show">⚠️ Не явился</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ ...buttonStyle, backgroundColor: '#95a5a6', color: 'white' }}>Отмена</button>
            <button type="submit" disabled={loading} style={{ ...buttonStyle, backgroundColor: loading ? '#95a5a6' : '#3498db', color: 'white' }}>
              {loading ? '⏳ Сохранение...' : '💾 Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAppointmentModal;