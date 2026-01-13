import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

function PrintReceiptModal({ receipt, onClose, token }) {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_${receipt.item.qr_code}`,
    pageStyle: `
      @page {
        margin: 0;
        size: 80mm auto;
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
        width: 80mm;
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
          <h3>Чек о продаже</h3>
          <hr />
          <p><strong>QR-код:</strong> {receipt.item.qr_code || 'N/A'}</p>
          <p><strong>Наименование:</strong> {receipt.item.name || 'N/A'}</p>
          <p><strong>Part Number:</strong> {receipt.item.part_number || 'N/A'}</p>
          <p><strong>Модель машины:</strong> {receipt.item.car_model || 'N/A'}</p>
          <p><strong>VIN:</strong> {receipt.item.vin_number || 'N/A'}</p>
          <hr />
          <p><strong>Цена:</strong> {receipt.selling_price.toFixed(2)} руб</p>
          <p><strong>Дата продажи:</strong> {receipt.sale_date}</p>
          <p><strong>ФИО покупателя:</strong> {receipt.buyer_name || 'N/A'}</p>
          <p><strong>Телефон:</strong> {receipt.buyer_phone || 'N/A'}</p>
          <p><strong>Информация о покупателе:</strong> {receipt.buyer_info || 'N/A'}</p>
          <hr />
          <p>Спасибо за покупку!</p>
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