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
  const navigate = useNavigate();
  const componentRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'soldParts') {
          if (!token) throw new Error('No token provided for sold parts');
          const response = await fetch('/api/sold-parts', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch sold parts: ${response.status}`);
          const data = await response.json();
          setSoldParts(data);
        } else if (activeTab === 'counterparties') {
          if (!token) throw new Error('No token provided for counterparties');
          const response = await fetch('/api/counterparties', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch counterparties: ${response.status}`);
          const data = await response.json();
          setCounterparties(data);
        } else if (activeTab === 'suppliers') {
          if (!token) throw new Error('No token provided for suppliers');
          const response = await fetch('/api/suppliers', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch suppliers: ${response.status}`);
          const data = await response.json();
          setSuppliers(data);
        } else if (activeTab === 'cars') {
          if (!token) throw new Error('No token provided for cars');
          const response = await fetch('/api/items/cars', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch cars: ${response.status}`);
          const data = await response.json();
          setCars(data);
        } else if (activeTab === 'income') {
          if (!token) throw new Error('No token provided for income');
          const response = await fetch('/api/income-summary', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error(`Failed to fetch income summary: ${response.status}`);
          const data = await response.json();
          console.log('Income Summary Data:', data);
          setIncomeSummary(data);
          setFilteredIncome(data.daily);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else {
      setError('No token provided');
      setLoading(false);
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }} ref={componentRef}>
      <h2 style={{ marginBottom: '20px' }}>Документооборот</h2>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
          }}
        >
          Доходы с запчастей
        </button>
      </div>

      {/* Кнопки управления */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
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
              }}
            >
              Экспорт в PDF
            </button>
          </>
        )}
      </div>

      {/* Фильтр по дате для доходов */}
      {activeTab === 'income' && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Фильтр по дате</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label>
              С:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </label>
            <label>
              По:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ marginLeft: '5px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Таблица проданных запчастей */}
      {activeTab === 'soldParts' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Проданные запчасти</h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
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
              {soldParts.map(part => (
                <tr key={part.id} style={{ backgroundColor: part.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{part.item_id}</td>
                  <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>{part.item_name}</td>
                  <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>{part.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #bdc3c7' }}>
                    {part.selling_price != null ? parseFloat(part.selling_price).toFixed(2) : '0.00'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                    {part.sale_date ? new Date(part.sale_date).toLocaleDateString('ru-RU') : 'Нет даты'} {/* <<<--- Вот тут исправили дату */}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                    {counterparties.find(cp => cp.id === part.counterparty_id)?.fio || counterparties.find(cp => cp.id === part.counterparty_id)?.company_name || '-'} {/* <<<--- Покупатель текстом */}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #bdc3c7' }}>
                    {suppliers.find(s => s.id === part.supplier_id)?.name || '-'} {/* <<<--- Поставщик текстом */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Таблица контрагентов */}
      {activeTab === 'counterparties' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Контрагенты</h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
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
      )}

      {/* Таблица поставщиков */}
      {activeTab === 'suppliers' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Поставщики</h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
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
      )}

      {/* Таблица автомобилей в разборе */}
      {activeTab === 'cars' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Автомобили в разборе</h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
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
                      onClick={() => {
                        alert(`Редактировать автомобиль ID: ${car.id}`);
                      }}
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
      )}

      {/* Таблица доходов с запчастей */}
      {activeTab === 'income' && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Доходы с запчастей</h3>
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
            <p style={{ margin: '5px 0' }}><strong>Общая выручка:</strong> {typeof incomeSummary.total === 'number' ? incomeSummary.total.toFixed(2) : parseFloat(incomeSummary.total).toFixed(2) || '0.00'} руб</p>
            <p style={{ margin: '5px 0' }}><strong>Количество продаж:</strong> {typeof incomeSummary.count === 'number' ? incomeSummary.count : parseInt(incomeSummary.count) || 0}</p>
          </div>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
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
      )}
    </div>
  );
}

export default DocumentFlowPage;