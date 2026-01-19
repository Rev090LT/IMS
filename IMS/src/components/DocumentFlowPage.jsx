import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function DocumentFlowPage({ token }) {
  const [activeTab, setActiveTab] = useState('soldParts');
  const [soldParts, setSoldParts] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cars, setCars] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState({ total: 0, count: 0, daily: [] });
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCar, setEditingCar] = useState(null); // <<<--- Новое состояние для редактируемого автомобиля
  const navigate = useNavigate();
  const componentRef = useRef();

  // <<<--- Загружаем все данные при монтировании компонента --->
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // <<<--- Загружаем все данные параллельно --->
        const [soldPartsRes, counterpartiesRes, suppliersRes, carsRes, incomeRes] = await Promise.all([
          fetch('/api/sold-parts', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/counterparties', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/suppliers', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/items/cars', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/income-summary', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        // <<<--- Проверяем ответы --->
        if (!soldPartsRes.ok || !counterpartiesRes.ok || !suppliersRes.ok || !carsRes.ok || !incomeRes.ok) {
          throw new Error('Failed to fetch data');
        }

        // <<<--- Преобразуем в JSON --->
        const [soldPartsData, counterpartiesData, suppliersData, carsData, incomeData] = await Promise.all([
          soldPartsRes.json(),
          counterpartiesRes.json(),
          suppliersRes.json(),
          carsRes.json(),
          incomeRes.json()
        ]);

        // <<<--- Устанавливаем состояние --->
        setSoldParts(soldPartsData);
        setCounterparties(counterpartiesData);
        setSuppliers(suppliersData);
        setCars(carsData);
        setIncomeSummary(incomeData);
        setFilteredIncome(incomeData.daily);

      } catch (err) {
        console.error('Error in fetchAllData:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAllData();
    } else {
      setError('No token provided');
      setLoading(false);
    }
  }, [token]); // <<<--- Только token в зависимостях

  // <<<--- Обновляем данные при изменении activeTab (только для нужных вкладок) --->
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'cars') {
          const response = await fetch('/api/items/cars', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch cars: ${response.status}`);
          const data = await response.json();
          setCars(data);
        } else if (activeTab === 'income') {
          const response = await fetch('/api/income-summary', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch income summary: ${response.status}`);
          const data = await response.json();
          setIncomeSummary(data);
          setFilteredIncome(data.daily);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message);
      }
    };

    if (token && (activeTab === 'cars' || activeTab === 'income')) {
      fetchData();
    }
  }, [activeTab, token]);

  // Фильтрация по дате
  useEffect(() => {
    if (startDate && endDate && incomeSummary.daily) {
      const filtered = incomeSummary.daily.filter(day => {
        if (!day.sale_date) return false;
        const date = new Date(day.sale_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return date >= start && date <= end;
      });
      setFilteredIncome(filtered);
    } else {
      setFilteredIncome(incomeSummary.daily.filter(day => day.sale_date));
    }
  }, [startDate, endDate, incomeSummary]);

  // Экспорт в Excel
  const exportToExcel = () => {
    if (activeTab === 'soldParts') {
      const ws = XLSX.utils.json_to_sheet(soldParts.map(part => ({
        ID: part.item_id,
        Наименование: part.item_name,
        Количество: part.quantity,
        Цена: part.selling_price,
        'Дата продажи': part.sale_date,
        Покупатель: counterparties.find(cp => cp.id === part.counterparty_id)?.fio || counterparties.find(cp => cp.id === part.counterparty_id)?.company_name || '-',
        Поставщик: suppliers.find(s => s.id === part.supplier_id)?.name || '-'
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Проданные запчасти');
      XLSX.writeFile(wb, 'sold_parts.xlsx');
    } else if (activeTab === 'income') {
      const rows = [];
      filteredIncome.forEach(day => {
        rows.push({
          'Дата продажи': day.sale_date,
          'Количество продаж': day.daily_sales,
          'Выручка': typeof day.daily_income === 'number' ? day.daily_income.toFixed(2) : parseFloat(day.daily_income).toFixed(2) || '0.00',
          'Наименование': '',
          'Количество': '',
          'Цена': '',
          'Покупатель': '',
          'Поставщик': ''
        });

        (day.details || []).forEach(detail => {
          rows.push({
            'Дата продажи': '',
            'Количество продаж': '',
            'Выручка': '',
            'Наименование': detail.item_name,
            'Количество': detail.quantity,
            'Цена': typeof detail.selling_price === 'number' ? detail.selling_price.toFixed(2) : parseFloat(detail.selling_price).toFixed(2) || '0.00',
            'Покупатель': detail.counterparty_name,
            'Поставщик': detail.supplier_name
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Доходы');
      XLSX.writeFile(wb, 'income_summary.xlsx');
    }
  };

  // Экспорт в PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Отчет по ${activeTab === 'soldParts' ? 'продажам' : 'доходам'}`, 14, 16);

    if (activeTab === 'soldParts') {
      doc.autoTable({
        head: [['ID', 'Наименование', 'Количество', 'Цена', 'Дата продажи', 'Покупатель', 'Поставщик']],
        body: soldParts.map(part => [
          part.item_id,
          part.item_name,
          part.quantity,
          typeof part.selling_price === 'number' ? part.selling_price.toFixed(2) : parseFloat(part.selling_price).toFixed(2) || '0.00',
          part.sale_date,
          counterparties.find(cp => cp.id === part.counterparty_id)?.fio || counterparties.find(cp => cp.id === part.counterparty_id)?.company_name || '-',
          suppliers.find(s => s.id === part.supplier_id)?.name || '-'
        ])
      });
    } else if (activeTab === 'income') {
      const rows = [];
      filteredIncome.forEach(day => {
        rows.push([
          day.sale_date,
          day.daily_sales,
          typeof day.daily_income === 'number' ? day.daily_income.toFixed(2) : parseFloat(day.daily_income).toFixed(2) || '0.00',
          '',
          '',
          '',
          '',
          ''
        ]);

        (day.details || []).forEach(detail => {
          rows.push([
            '',
            '',
            '',
            detail.item_name,
            detail.quantity,
            typeof detail.selling_price === 'number' ? detail.selling_price.toFixed(2) : parseFloat(detail.selling_price).toFixed(2) || '0.00',
            detail.counterparty_name,
            detail.supplier_name
          ]);
        });
      });

      doc.autoTable({
        head: [['Дата продажи', 'Количество', 'Выручка', 'Наименование', 'Кол-во', 'Цена', 'Покупатель', 'Поставщик']],
        body: rows
      });
    }

    doc.save(`${activeTab === 'soldParts' ? 'sold_parts' : 'income_summary'}.pdf`);
  };

  // <<<--- Функция для открытия модального окна редактирования автомобиля --->
  const openEditCarModal = (car) => {
    setEditingCar(car);
  };

  // <<<--- Функция для закрытия модального окна редактирования автомобиля --->
  const closeEditCarModal = () => {
    setEditingCar(null);
  };

  // <<<--- Функция для сохранения изменений автомобиля --->
  const saveEditedCar = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/items/cars/${editingCar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingCar)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // <<<--- Обновляем состояние --->
      setCars(prev => prev.map(car => car.id === editingCar.id ? editingCar : car));
      alert('Изменения сохранены');
      closeEditCarModal();
    } catch (err) {
      console.error('Error updating car:', err);
      alert(`Ошибка при сохранении: ${err.message}`);
    }
  };

  if (!token) return <div>No token provided</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // <<<--- Трансформируем данные для отображения --->
  const flattenedIncomeRows = filteredIncome.flatMap(day => [
    {
      type: 'summary',
      date: day.sale_date,
      count: typeof day.daily_sales === 'number' ? day.daily_sales : parseInt(day.daily_sales) || 0,
      income: typeof day.daily_income === 'number' ? day.daily_income : parseFloat(day.daily_income) || 0,
      key: `summary-${day.sale_date || 'no-date'}-${Date.now()}-${Math.random()}`
    },
    ...(day.details || []).map(detail => ({
      type: 'detail',
      detail: detail,
      key: `detail-${day.sale_date || 'no-date'}-${detail.item_id}-${detail.selling_price}-${Date.now()}-${Math.random()}`
    }))
  ]);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '100vw',
      overflowX: 'auto',
    }} ref={componentRef}>
      <h2 style={{ marginBottom: '20px' }}>Документооборот</h2>

      {/* Мобильная версия */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => setActiveTab('soldParts')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'soldParts' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeTab === 'soldParts' ? 'white' : 'black',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '120px',
          }}
        >
          Проданные запчасти
        </button>
        <button
          onClick={() => setActiveTab('counterparties')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'counterparties' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeTab === 'counterparties' ? 'white' : 'black',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '120px',
          }}
        >
          Контрагенты
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'suppliers' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeTab === 'suppliers' ? 'white' : 'black',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '120px',
          }}
        >
          Поставщики
        </button>
        <button
          onClick={() => setActiveTab('cars')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'cars' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeTab === 'cars' ? 'white' : 'black',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '120px',
          }}
        >
          Автомобили в разборе
        </button>
        <button
          onClick={() => setActiveTab('income')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'income' ? '#3498db' : '#f0f0f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: activeTab === 'income' ? 'white' : 'black',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '120px',
          }}
        >
          Доход с продаж
        </button>
      </div>

      {/* Кнопки управления */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Вернуться в Dashboard
        </button>
        {(activeTab === 'soldParts' || activeTab === 'income') && (
          <>
            <button
              onClick={exportToExcel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Экспорт в Excel
            </button>
            <button
              onClick={exportToPDF}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Экспорт в PDF
            </button>
          </>
        )}
      </div>

      {/* Фильтр по дате для доходов */}
      {activeTab === 'income' && (
        <div style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          <h4>Фильтр по дате</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <label>
              С:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  marginLeft: '5px',
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
              />
            </label>
            <label>
              По:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  marginLeft: '5px',
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
              />
            </label>
          </div>
        </div>
      )}
      {activeTab === 'soldParts' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Проданные запчасти</h3>
          <div style={{
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            width: '125%',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Наименование</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>Количество</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>Цена</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Дата продажи</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Покупатель</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Поставщик</th>
                </tr>
              </thead>
              <tbody>
                {soldParts.map(part => {
                  // <<<--- Находим покупателя --->
                  const counterparty = counterparties.find(cp => cp.id === part.counterparty_id);
                  // <<<--- Находим поставщика --->
                  const supplier = suppliers.find(s => s.id === part.supplier_id);

                  return (
                    <tr key={part.id} style={{ backgroundColor: part.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{part.item_id}</td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{part.item_name}</td>
                      <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>{part.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>
                        {part.selling_price != null ? parseFloat(part.selling_price).toFixed(2) : '0.00'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                        {part.sale_date ? new Date(part.sale_date).toLocaleDateString('ru-RU') : 'Нет даты'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                        {counterparty ? (counterparty.type === 'legal' ? counterparty.company_name : counterparty.fio) : '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                        {supplier ? supplier.name : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Таблица контрагентов */}
      {activeTab === 'counterparties' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Контрагенты</h3>
          <div style={{
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            width: '125%',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Тип</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ФИО/Название</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ИНН</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Телефон</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Адрес</th>
                </tr>
              </thead>
              <tbody>
                {counterparties.map(cp => (
                  <tr key={cp.id} style={{ backgroundColor: cp.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{cp.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{cp.type}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{cp.type === 'legal' ? cp.company_name : cp.fio}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{cp.inn || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{cp.phone || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{cp.legal_address || cp.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Таблица поставщиков */}
      {activeTab === 'suppliers' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Поставщики</h3>
          <div style={{
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            width: '125%',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Название</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ИНН</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ОГРН</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>КПП</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Юр. адрес</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Факт. адрес</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(supplier => (
                  <tr key={supplier.id} style={{ backgroundColor: supplier.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.name}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.inn}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.ogrn || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.kpp || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.legal_address || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{supplier.actual_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Таблица автомобилей в разборе */}
      {activeTab === 'cars' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Автомобили в разборе</h3>
          <div style={{
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            width: '125%',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Марка</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Модель</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>VIN</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Год</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Дата прибытия</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id} style={{ backgroundColor: car.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{car.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{car.brand}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{car.model}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{car.vin}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{car.year || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{car.arrival_date}</td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                      <button
                        onClick={() => openEditCarModal(car)} // <<<--- Открываем модальное окно
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'income' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Доход с продаж</h3>
          <div style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#e8f4fd',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '5px 0' }}><strong>Общая выручка:</strong> {(incomeSummary.total).toFixed(2)} руб</p>
            <p style={{ margin: '5px 0' }}><strong>Количество продаж:</strong> {incomeSummary.count}</p>
          </div>
          <div style={{
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            width: '125%',
            overflowX: 'auto',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Дата продажи</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #bdc3c7' }}>Количество продаж</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>Выручка</th>
                </tr>
              </thead>
              <tbody>

              {flattenedIncomeRows.map((row) => (
                row.type === 'summary' ? (
                  <tr key={row.key} style={{ backgroundColor: row.date % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                      {row.date ? new Date(row.date).toLocaleDateString('ru-RU') : 'Нет даты'}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{row.count}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>
                      {typeof row.income === 'number' ? row.income.toFixed(2) : parseFloat(row.income).toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ) : (
                  // <<<--- Детали продажи — отдельная строка с 5 колонками --->
                  <tr key={row.key} style={{ backgroundColor: row.detail.item_id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #bdc3c7', fontStyle: 'italic' }} colSpan="3">
                      <div style={{ paddingLeft: '20px' }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                              <th style={{ padding: '6px', border: '1px solid #ddd', width: '30%' }}>Наименование</th>
                              <th style={{ padding: '6px', border: '1px solid #ddd', width: '10%' }}>Количество</th>
                              <th style={{ padding: '6px', border: '1px solid #ddd', width: '15%' }}>Цена</th>
                              <th style={{ padding: '6px', border: '1px solid #ddd', width: '25%' }}>Покупатель</th>
                              <th style={{ padding: '6px', border: '1px solid #ddd', width: '20%' }}>Поставщик</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '6px', border: '1px solid #ddd' }}>{row.detail.item_name}</td>
                              <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>{row.detail.quantity}</td>
                              <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>
                                {typeof row.detail.selling_price === 'number' ? row.detail.selling_price.toFixed(2) : parseFloat(row.detail.selling_price).toFixed(2) || '0.00'}
                              </td>
                              <td style={{ padding: '6px', border: '1px solid #ddd' }}>{row.detail.counterparty_name}</td>
                              <td style={{ padding: '6px', border: '1px solid #ddd' }}>{row.detail.supplier_name}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )
              ))}               
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingCar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h3>Редактировать автомобиль</h3>
              <button
                onClick={closeEditCarModal}
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

            <form onSubmit={saveEditedCar}> 
              <div style={{ marginBottom: '10px' }}>
                <label>ID:</label>
                <input
                  type="text"
                  value={editingCar.id}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Марка:</label>
                <input
                  type="text"
                  value={editingCar.brand}
                  onChange={(e) => setEditingCar({...editingCar, brand: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Модель:</label>
                <input
                  type="text"
                  value={editingCar.model}
                  onChange={(e) => setEditingCar({...editingCar, model: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>VIN:</label>
                <input
                  type="text"
                  value={editingCar.vin}
                  onChange={(e) => setEditingCar({...editingCar, vin: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Год:</label>
                <input
                  type="number"
                  value={editingCar.year || ''}
                  onChange={(e) => setEditingCar({...editingCar, year: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>Дата прибытия:</label>
                <input
                  type="date"
                  value={editingCar.arrival_date}
                  onChange={(e) => setEditingCar({...editingCar, arrival_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={closeEditCarModal}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentFlowPage;