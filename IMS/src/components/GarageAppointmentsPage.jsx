// IMS/src/components/GarageAppointmentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateAppointmentModal from './CreateAppointmentModal';
import EditAppointmentModal from './EditAppointmentModal';

function GarageAppointmentsPage({ token }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState(null);
  useEffect(() => {
    fetchAppointments();
  }, [token, selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await fetch(`/api/appointments?date_from=${startDate.toISOString().split('T')[0]}&date_to=${endDate.toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      
      // Логируем для отладки
      console.log('📅 Загружено записей:', data.length);
      data.forEach(apt => {
        const originalDate = apt.appointment_date;
        const dateObj = new Date(originalDate);
        const localDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        console.log(`Запись #${apt.id}: ${originalDate} → ${localDate}`);
      });
      
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = (newAppointment) => {
    console.log('✅ Запись создана:', newAppointment);
    setShowCreateModal(false);
    // Добавляем новую запись в список
    setAppointments(prev => {
        const updated = [...prev, newAppointment];
        console.log('📋 Обновлённый список:', updated);
        return updated;
    });
    
    // Закрываем модалку
    setShowCreateModal(false);
    
    // Принудительно обновляем данные с сервера
    setTimeout(() => {
        fetchAppointments();
    }, 100);
  };
  
  const handleUpdateAppointment = (updatedAppointment) => {
    console.log('🔄 Запись обновлена:', updatedAppointment);
    
    // Обновляем запись в списке
    setAppointments(prev => 
      prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
    );
    
    // Закрываем модалку
    setEditingAppointment(null);
    
    // Принудительно обновляем данные
    setTimeout(() => {
      fetchAppointments();
    }, 100);
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Удалить эту запись?')) return;
    
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': '#3498db',
      'completed': '#27ae60',
      'cancelled': '#e74c3c',
      'no-show': '#95a5a6',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': '📅 Запланирована',
      'completed': '✅ Выполнена',
      'cancelled': '❌ Отменена',
      'no-show': '⚠️ Не явился',
    };
    return labels[status] || status;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getAppointmentsForDate = (targetDateStr) => {
    // targetDateStr это "YYYY-MM-DD" (например "2026-04-07")
    
    return appointments.filter(apt => {
      // Извлекаем дату из appointment_date БЕЗ учёта часового пояса
      const aptDate = new Date(apt.appointment_date);
      
      // Получаем компоненты даты в локальном часовом поясе
      const year = aptDate.getFullYear();
      const month = String(aptDate.getMonth() + 1).padStart(2, '0');
      const day = String(aptDate.getDate()).padStart(2, '0');
      
      // Формируем строку "YYYY-MM-DD" в локальном времени
      const aptDateStr = `${year}-${month}-${day}`;
      
      return aptDateStr === targetDateStr;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Стили
  const pageStyle = { minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column' };
  const headerStyle = { backgroundColor: 'white', padding: '12px 15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, position: 'sticky', top: 0 };
  const titleStyle = { margin: 0, fontSize: '18px', color: '#2c3e50', fontWeight: '600' };
  const headerButtonStyle = { padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease' };
  const mainContentStyle = { flex: 1, padding: '20px', overflowY: 'auto' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '15px' };
  const cardTitleStyle = { fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #3498db' };
  const buttonStyle = { padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s ease' };
  const badgeStyle = (color) => ({ padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px', fontWeight: '500', backgroundColor: color, display: 'inline-block' });
  const errorBoxStyle = { color: '#e74c3c', backgroundColor: '#fadbd8', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #e74c3c' };

  const calendarStyle = { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(7, 1fr)', 
    gap: '3px', 
    marginBottom: '20px',
    width: '100%',
  };

  const calendarHeaderStyle = { 
    textAlign: 'center', 
    fontWeight: 'bold', 
    padding: '8px 2px', 
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
  };

  const calendarDayStyle = (isToday, hasAppointments) => ({
    padding: '8px 4px',
    minHeight: '80px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: isToday ? '#e3f2fd' : hasAppointments ? '#f0f7ff' : 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '13px',
  });

  const responsiveStyles = `
    @media (max-width: 768px) {
      .calendar-grid { 
        grid-template-columns: repeat(7, 1fr) !important; 
        gap: 2px !important;
      }
      .calendar-day { 
        min-height: 60px !important; 
        padding: 4px 2px !important;
        font-size: 11px !important;
      }
      .calendar-header {
        padding: 6px 2px !important;
        font-size: 10px !important;
      }
      .calendar-day-number {
        font-size: 12px !important;
        font-weight: bold !important;
      }
      .calendar-day-appointments {
        font-size: 9px !important;
        line-height: 1.2 !important;
      }
    }
    
    @media (max-width: 480px) {
      .calendar-day { 
        min-height: 50px !important; 
      }
    }
  `;

  if (loading) {
    return (
      <div style={pageStyle} className="page-transition">
        <style>{responsiveStyles}</style>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="pulse" style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h2 className="fade-in" style={{ color: '#2c3e50' }}>Загрузка...</h2>
        </div>
      </div>
    );
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div style={pageStyle} className="page-transition">
      <style>{responsiveStyles}</style>
      
      {/* Шапка */}
      <header style={headerStyle} className="slide-in-down">
        <h1 style={titleStyle}>🔧 Записи в бокс</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCreateModal(true)} style={{ ...buttonStyle, backgroundColor: '#27ae60', color: 'white' }} className="glow-hover">
            ➕ Создать запись
          </button>
          <button onClick={() => navigate(-1)} style={headerButtonStyle} className="glow-hover">← Назад</button>
        </div>
      </header>

      {/* Основное содержимое */}
      <div style={mainContentStyle}>
        {error && <div style={errorBoxStyle}>{error}</div>}
        
        {/* Календарь */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button onClick={prevMonth} style={{ ...buttonStyle, backgroundColor: '#f5f5f5' }}>← Пред.</button>
            <h2 style={{ margin: 0, fontSize: '20px' }}>{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} style={{ ...buttonStyle, backgroundColor: '#f5f5f5' }}>След. →</button>
          </div>

          <div className="calendar-grid" style={calendarStyle}>
            {dayNames.map(day => (
              <div key={day} style={calendarHeaderStyle}>{day}</div>
            ))}
            
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ padding: '10px' }}></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              // Создаём дату с явным указанием времени чтобы избежать сдвига по часовому поясу
              const date = new Date(year, month, day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const dayAppointments = getAppointmentsForDate(dateStr); // ← Передаём строку, не Date объект
              return (
                  <div
                    key={day}
                    className="calendar-day"
                    style={calendarDayStyle(isToday, dayAppointments.length > 0)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDate(dateStr); // ← Сохраняем как строку "YYYY-MM-DD"
                    }}
                  >              
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{day}</div>
                  {dayAppointments.length > 0 && (
                    <div style={{ fontSize: '11px' }}>
                      {dayAppointments.slice(0, 3).map(apt => (
                        <div key={apt.id} style={{ 
                          padding: '2px 4px', 
                          marginBottom: '2px', 
                          backgroundColor: getStatusColor(apt.status), 
                          color: 'white', 
                          borderRadius: '3px',
                          fontSize: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {apt.appointment_time ? apt.appointment_time.substring(0, 5) : ''} {apt.customer_name}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div style={{ fontSize: '10px', color: '#666' }}>+{dayAppointments.length - 3} ещё</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Записи на выбранный день */}
        <div style={cardStyle}>
            <h3 style={cardTitleStyle}>
              📅 Записи на {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>          
          {getAppointmentsForDate(selectedDate).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
              <p>Нет записей на этот день</p>
              <button onClick={() => setShowCreateModal(true)} style={{ ...buttonStyle, backgroundColor: '#27ae60', color: 'white', marginTop: '10px' }}>
                ➕ Создать запись
              </button>
            </div>
          ) : (
            <div>
              {getAppointmentsForDate(selectedDate).map(apt => (
                <div key={apt.id} style={{ 
                  padding: '15px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  marginBottom: '10px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={badgeStyle(getStatusColor(apt.status))}>{getStatusLabel(apt.status)}</span>
                      {apt.appointment_time && (
                        <span style={{ fontWeight: '600', fontSize: '16px' }}>🕐 {apt.appointment_time.substring(0, 5)}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAppointment(apt);
                        }} 
                        style={{ ...buttonStyle, backgroundColor: '#3498db', color: 'white', padding: '4px 8px', fontSize: '11px' }}
                      >
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteAppointment(apt.id)} style={{ ...buttonStyle, backgroundColor: '#e74c3c', color: 'white', padding: '4px 8px', fontSize: '11px' }}>🗑️</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>👤 Клиент</div>
                      <div style={{ fontWeight: '500' }}>{apt.customer_name}</div>
                    </div>
                    {apt.customer_phone && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>📞 Телефон</div>
                        <div>{apt.customer_phone}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>🚗 Автомобиль</div>
                      <div>{apt.car_model || 'Не указан'}</div>
                    </div>
                    {apt.car_vin && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>VIN</div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{apt.car_vin}</div>
                      </div>
                    )}
                    {apt.car_license_plate && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>🔢 Номер</div>
                        <div>{apt.car_license_plate}</div>
                      </div>
                    )}
                  </div>
                  
                  {apt.reason && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ddd' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>📝 Причина обращения</div>
                      <div>{apt.reason}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно создания записи */}
      {showCreateModal && (
        <div className="modal-overlay modal-animate">
          <CreateAppointmentModal
            onClose={() => setShowCreateModal(false)}
            token={token}
            selectedDate={selectedDate}
            onAppointmentCreated={handleCreateAppointment}
          />
        </div>
      )}
      {editingAppointment && (
        <div className="modal-overlay modal-animate">
          <EditAppointmentModal
            appointment={editingAppointment}
            onClose={() => setEditingAppointment(null)}
            token={token}
            onAppointmentUpdated={handleUpdateAppointment}
          />
        </div>
      )}
    </div>
  );
}

export default GarageAppointmentsPage;