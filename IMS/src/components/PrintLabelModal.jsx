import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

function PrintLabelModal({ onClose, token }) {
  const [itemName, setItemName] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [template, setTemplate] = useState('75x120'); // Новое состояние для шаблона
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
        ${template === '75x120' ? 'width: 75mm; height: 120mm;' : 'width: 58mm; height: 40mm;'}
        padding: ${template === '75x120' ? '5mm' : '2mm'};
        font-family: 'Arial, sans-serif';
        font-size: ${template === '75x120' ? '10pt' : '8pt'};
        line-height: 1.2;
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

  // Функция для получения стилей превью в зависимости от шаблона
  const getPreviewStyle = () => {
    if (template === '75x120') {
      return {
        width: '75mm',
        height: '120mm',
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
      };
    } else { // 58x40
      return {
        width: '58mm',
        height: '40mm',
        padding: '2mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '8pt',
        lineHeight: 1.2,
        border: '1px solid #ccc',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        backgroundColor: 'white'
      };
    }
  };

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

            {/* Выбор шаблона */}
            <div style={{ marginTop: '10px' }}>
              <label>Шаблон этикетки:</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)} // Обновляем состояние шаблона
                style={{ marginLeft: '10px' }}
              >
                <option value="75x120">75x120 мм</option>
                <option value="58x40">58x40 мм</option>
              </select>
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
                <div style={{ marginBottom: template === '75x120' ? '2mm' : '1mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={template === '75x120' ? 150 : 100} // Разный размер QR для разных шаблонов
                    level="H"
                    includeMargin={true}
                  />
                </div>
                {/* Имя товара */}
                <div style={{ fontWeight: 'bold', marginBottom: template === '75x120' ? '5mm' : '2mm' }}>
                  {itemName}
                </div>
                {/* Инвентарный номер */}
                <div style={{ fontSize: template === '75x120' ? '11pt' : '9pt' }}>
                  INV: {inventoryNumber}
                </div>
              </div>
            </div>
          )}

          {/* Превью этикетки на экране */}
          {success && (
            <div className="label-preview-container" style={{ marginTop: '20px', textAlign: 'center' }}>
              <h4>Label Preview:</h4>
              <div style={getPreviewStyle()}> {/* Используем функцию для стилей */}
                <div style={{ marginBottom: template === '75x120' ? '2mm' : '1mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={template === '75x120' ? 64 : 48} // Разный размер QR для превью
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: template === '75x120' ? '1mm' : '0.5mm' }}>
                  {itemName}
                </div>
                <div style={{ fontSize: template === '75x120' ? '8pt' : '6pt' }}>
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