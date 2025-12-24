import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

function PrintLabelModal({ onClose, token }) {
  const [itemName, setItemName] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const componentRef = useRef(); // <= ref

  const handleGenerate = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!itemName.trim() || !inventoryNumber.trim()) {
      setError('Необходимо имя и инвентарный номер');
      return;
    }

    setSuccess('Этикетка сгенерирована успешно');
  };

  // useReactToPrint
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Label_${inventoryNumber || 'unknown'}`,
    pageStyle: `
      @page {
        margin: 0;
        size: 210mm 297mm; /* Размер A4 */
      }
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
        margin: 0;
      }
      .print-container {
        position: absolute;
        top: 10mm; /* Отступ сверху */
        left: 10mm; /* Отступ слева */
        width: 100mm;
        height: 50mm;
        padding: 5mm;
        font-family: 'Arial, sans-serif';
        fontSize: '10pt';
        lineHeight: 1.2;
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        box-sizing: border-box;
      }
    `
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Печать этикеток</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleGenerate} className="modal-form">
            <div>
              <label>Имя позиции:</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Инвентарный номер:</label>
              <input
                type="text"
                value={inventoryNumber}
                onChange={(e) => setInventoryNumber(e.target.value)}
                required
              />
            </div>
            <div className='modal-actions'>
            <button type="submit">Сгенерировать метку</button>
            </div>
          </form>

          {/* УСЛОВНЫЙ РЕНДЕР КОНТЕЙНЕРА ПЕЧАТИ */}
          {success && (
            <div style={{ display: 'none' }}>
              {/* Обертка с классом print-container */}
              <div ref={componentRef} className="print-container">
                {/* QR код */}
                <div style={{ marginBottom: '2mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                {/* Имя товара */}
                <div style={{ fontWeight: 'bold', marginBottom: '5mm' }}>
                  {itemName}
                </div>
                {/* Инвентарный номер */}
                <div style={{ fontSize: '11pt' }}>
                  INV: {inventoryNumber}
                </div>
              </div>
            </div>
          )}

          {/* Превью этикетки на экране */}
          {success && (
            <div className="label-preview-container" style={{ marginTop: '20px', textAlign: 'center' }}>
              <h4>Label Preview:</h4>
              <div style={{
                width: '100mm',
                height: '50mm',
                padding: '5mm',
                fontFamily: 'Arial, sans-serif',
                fontSize: '10pt',
                lineHeight: 1.2,
                border: '1px solid #ccc',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}>
                <div style={{ marginBottom: '2mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={64}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>
                  {itemName}
                </div>
                <div style={{ fontSize: '8pt' }}>
                  INV: {inventoryNumber}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'center' }}>
          {/* Кнопка печати - показываем только если этикетка сгенерирована */}
          {success && (
            <button onClick={handlePrint} className="action-btn" style={{ backgroundColor: '#3498db', color: 'white' }}>
              Печать
            </button>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

export default PrintLabelModal;