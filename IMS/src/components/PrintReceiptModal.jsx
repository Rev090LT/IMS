import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';

function PrintReceiptModal({ receipt, onClose, token }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_${receipt.items ? receipt.items[0]?.item?.qr_code : receipt.item?.qr_code}`,
    pageStyle: `
      @page {
        margin: 0;
        size: auto;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          margin: 0;
          padding: 0;
        }
        .receipt-container {
          width: 100%;
          padding: 10px;
          font-family: 'Courier New', monospace;
          font-size: 12pt;
          line-height: 1.2;
          border: none;
          background: white;
        }
      }
      .receipt-container {
        width: 100%;
        padding: 10px;
        font-family: 'Courier New', monospace;
        font-size: 12pt;
        line-height: 1.2;
        border: 1px solid #ccc;
        background: white;
        text-align: center;
      }
    `,
  });

  const [checkNumber] = useState(() => {
    const stored = localStorage.getItem('lastCheckNumber');
    const number = stored ? parseInt(stored) + 1 : 1;
    localStorage.setItem('lastCheckNumber', number.toString());
    return number;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const numberToWords = (num) => {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    if (num === 0) return 'ноль';

    let result = '';

    const billions = Math.floor(num / 1000000000);
    const millions = Math.floor((num % 1000000000) / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    const ones = num % 1000;

    if (billions > 0) {
      result += numberToWords(billions) + ' миллиард' + (billions !== 1 ? 'ов' : '') + ' ';
    }

    if (millions > 0) {
      result += numberToWords(millions) + ' миллион' + (millions !== 1 ? 'ов' : '') + ' ';
    }

    if (thousands > 0) {
      const t = thousands;
      if (t >= 100) {
        result += hundreds[Math.floor(t / 100)] + ' ';
      }
      if (t % 100 >= 20) {
        result += tens[Math.floor((t % 100) / 10)] + ' ';
      } else if (t % 100 >= 10) {
        result += teens[t % 10] + ' ';
      }
      if (t % 10 > 0 && t % 100 < 10) {
        result += units[t % 10] + ' ';
      }
      const thousandsSuffix = (thousands % 10 === 1 && thousands % 100 !== 11) ? 'а' : 
                             (thousands % 10 >= 2 && thousands % 10 <= 4 && (thousands % 100 < 10 || thousands % 100 >= 20)) ? 'и' : '';
      result += 'тысяч' + thousandsSuffix + ' ';
    }

    if (ones > 0) {
      if (ones >= 100) {
        result += hundreds[Math.floor(ones / 100)] + ' ';
      }
      if (ones % 100 >= 20) {
        result += tens[Math.floor((ones % 100) / 10)] + ' ';
      } else if (ones % 100 >= 10) {
        result += teens[ones % 10] + ' ';
      }
      if (ones % 10 > 0 && ones % 100 < 10) {
        result += units[ones % 10] + ' ';
      }
    }

    return result.trim();
  };

  const totalInWords = () => {
    const rubles = Math.floor(receipt.totalAmount);
    const kopeks = Math.round((receipt.totalAmount - rubles) * 100);

    const rublesWords = numberToWords(rubles);
    const kopeksWords = numberToWords(kopeks);

    return `${rublesWords} рубль${rubles === 1 ? '' : (rubles >= 2 && rubles <= 4 ? 'я' : 'ей')} ${kopeks} копеек`;
  };

  return (
    <div className="modal-overlay" style={{
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
      <div className="modal-content" style={{
        width: '600px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h3>Чек о покупке</h3>
          <button
            onClick={onClose}
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

        <div ref={componentRef} className="receipt-container">
          <h3>Товарный чек №{checkNumber} от {formatDate(receipt.sale_date)}</h3>
          <hr />
          <p><strong>Поставщик:</strong> {receipt.seller || 'ИП Иванов И.И.'}</p>
          {receipt.counterparty?.type === 'legal' ? (
            <>
              <p><strong>Покупатель:</strong> {receipt.counterparty.company_name}</p>
              <p><strong>ИНН:</strong> {receipt.counterparty.inn || 'N/A'}</p>
              <p><strong>КПП:</strong> {receipt.counterparty.kpp || 'N/A'}</p>
              <p><strong>ОГРН:</strong> {receipt.counterparty.ogrn || 'N/A'}</p>
              <p><strong>Юридический адрес:</strong> {receipt.counterparty.legal_address || 'N/A'}</p>
            </>
          ) : (
            <p><strong>Покупатель:</strong> {receipt.counterparty ? receipt.counterparty.fio : 'Частное лицо'}</p>
          )}
          <hr />
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '10pt',
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>№</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>Артикул</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left' }}>Товар</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>Количество</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>Цена</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((itemData, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '4px' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #ddd', padding: '4px' }}>{itemData.item.qr_code || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '4px' }}>{itemData.item.name || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{itemData.quantity} шт</td>
                  <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{itemData.selling_price.toFixed(2)} руб</td>
                  <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>{(itemData.selling_price * itemData.quantity).toFixed(2)} руб</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}><strong>Итого:</strong></td>
                <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}><strong>{receipt.totalAmount.toFixed(2)} руб</strong></td>
              </tr>
            </tfoot>
          </table>
          <hr />
          <p>Всего наименований {receipt.items.length}, на сумму {receipt.totalAmount.toFixed(2)} руб.</p>
          <p>{totalInWords()}</p>
          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <p>Отпустил _________________</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p>Получил _________________</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Печать чека
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintReceiptModal;