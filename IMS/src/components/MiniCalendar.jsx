// IMS/src/components/MiniCalendar.jsx
import React, { useState, useEffect } from 'react';

function MiniCalendar({ token }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Обновляем время каждую минуту
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const response = await fetch(`/api/appointments?date_from=${startDate.toISOString().split('T')[0]}&date_to=${endDate.toISOString().split('T')[0]}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const getAppointmentsCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
      return aptDate === dateStr;
    }).length;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Стили
  const containerStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #3498db',
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: 0,
  };

  const navButtonStyle = {
    padding: '4px 8px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const calendarGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '15px',
  };

  const dayHeaderStyle = {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '11px',
    padding: '6px 2px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '4px',
  };

  const dayCellStyle = (isTodayDay, isSelectedDay, count) => ({
    padding: '8px 4px',
    textAlign: 'center',
    border: isSelectedDay ? '2px solid #3498db' : '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: isTodayDay ? '#e3f2fd' : count > 0 ? '#f0f7ff' : 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '12px',
    fontWeight: isTodayDay ? 'bold' : 'normal',
    color: isTodayDay ? '#2c3e50' : '#666',
  });

  const dayCountStyle = {
    fontSize: '9px',
    marginTop: '2px',
    color: '#3498db',
    fontWeight: 'bold',
  };

  const selectedDateInfoStyle = {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '10px',
  };

  const timeStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '10px',
    fontFamily: 'monospace',
  };

  const dateStyle = {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '10px',
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '15px',
  };

  const statBoxStyle = {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e0e0e0',
  };

  const statNumberStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3498db',
  };

  const statLabelStyle = {
    fontSize: '11px',
    color: '#666',
    marginTop: '4px',
  };

  return (
    <div style={containerStyle} className="fade-in">
      {/* Время и дата */}
      <div style={selectedDateInfoStyle}>
        <div style={timeStyle}>
          {currentDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={dateStyle}>
          {currentDate.toLocaleDateString('ru-RU', { 
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Календарь */}
      <div style={headerStyle}>
        <button onClick={prevMonth} style={navButtonStyle}>←</button>
        <h3 style={titleStyle}>{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} style={navButtonStyle}>→</button>
      </div>

      <div style={calendarGridStyle}>
        {dayNames.map(day => (
          <div key={day} style={dayHeaderStyle}>{day}</div>
        ))}
        
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`}></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const count = getAppointmentsCount(date);
          const today = isToday(day);
          const selected = isSelected(day);
          
          return (
            <div
              key={day}
              style={dayCellStyle(today, selected, count)}
              onClick={() => setSelectedDate(date)}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div>{day}</div>
              {count > 0 && (
                <div style={dayCountStyle}>{count}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Статистика */}
      <div style={statsStyle}>
        <div style={statBoxStyle}>
          <div style={statNumberStyle}>
            {appointments.filter(apt => apt.status === 'scheduled').length}
          </div>
          <div style={statLabelStyle}>📅 Запланировано</div>
        </div>
        <div style={statBoxStyle}>
          <div style={statNumberStyle}>
            {appointments.filter(apt => apt.status === 'completed').length}
          </div>
          <div style={statLabelStyle}>✅ Выполнено</div>
        </div>
      </div>

      {/* Информация о выбранном дне */}
      <div style={{
        marginTop: '15px',
        padding: '12px',
        backgroundColor: isSelected(selectedDate.getDate()) && 
                        currentDate.getMonth() === selectedDate.getMonth() ? 
                        '#e3f2fd' : '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
          Выбрано: {selectedDate.toLocaleDateString('ru-RU')}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
          {getAppointmentsCount(selectedDate)} записей
        </div>
      </div>
    </div>
  );
}

export default MiniCalendar;