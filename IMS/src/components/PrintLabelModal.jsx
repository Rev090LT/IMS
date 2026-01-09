import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

function PrintLabelModal({ onClose, token }) {
  const [itemName, setItemName] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState(''); // <= Используем как QR-код
  const [originalItemName, setOriginalItemName] = useState(''); // <= Сохраняем оригинальное имя
  const [originalInventoryNumber, setOriginalInventoryNumber] = useState(''); // <= Сохраняем оригинальный QR-код
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [template, setTemplate] = useState('75x120');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]); // <= Новое состояние для результатов поиска
  const [showDropdown, setShowDropdown] = useState(false); // <= Новое состояние для отображения выпадающего списка
  const componentRef = useRef();

  // <<<--- Вот тут функция для получения списка наименований по части имени --->
  const fetchItemNamesByName = async (name) => {
    if (!name.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (!token) {
      setError('Authentication token is missing');
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/items/search-by-name/${encodeURIComponent(name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data);
      setShowDropdown(true);
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  // <<<--- Вот тут функция для получения QR-кода по имени (только для получения QR-кода) --->
  const fetchQRCodeByName = async (name) => {
    if (!name.trim()) {
      setInventoryNumber(originalInventoryNumber);
      return;
    }

    if (!token) {
      setError('Authentication token is missing');
      setInventoryNumber(originalInventoryNumber);
      return;
    }

    try {
      const response = await fetch(`/api/items/search-by-name/${encodeURIComponent(name)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Берём первый результат
      if (data.length > 0) {
        setInventoryNumber(data[0].qr_code);
        setOriginalInventoryNumber(data[0].qr_code);
      }
    } catch (err) {
      setError(err.message);
      setInventoryNumber(originalInventoryNumber);
    }
  };

  // <<<--- Вот тук функция для получения наименования по QR-коду (inventoryNumber) --->
  const fetchItemNameByQR = async (code) => {
    if (!code.trim()) {
      setItemName(originalItemName);
      return;
    }

    if (!token) {
      setError('Authentication token is missing');
      setItemName(originalItemName);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/items/${code}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const itemData = await response.json();
      setItemName(itemData.name);
      setOriginalItemName(itemData.name);
    } catch (err) {
      setError(err.message);
      setItemName(originalItemName);
    } finally {
      setLoading(false);
    }
  };

  // <<<--- Обновим onChange для инвентарного номера (QR-кода) --->
  const handleInventoryNumberChange = (e) => {
    const value = e.target.value;
    setInventoryNumber(value);
    setOriginalInventoryNumber(value);
    fetchItemNameByQR(value);
  };

  // <<<--- Обновим onChange для наименования --->
  const handleItemNameChange = (e) => {
    const value = e.target.value;
    setItemName(value);
    setOriginalItemName(value);
    fetchItemNamesByName(value); // <= Вызываем при изменении имени
  };

  // <<<--- Функция для выбора наименования из списка --->
  const handleItemSelect = (selectedItem) => {
    setItemName(selectedItem.name);
    setOriginalItemName(selectedItem.name);
    setInventoryNumber(selectedItem.qr_code);
    setOriginalInventoryNumber(selectedItem.qr_code);
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inventoryNumber.trim()) {
      setError('Необходим инвентарный номер (QR-код)');
      return;
    }

    if (!itemName.trim()) {
      setError('Необходимо имя позиции');
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
        font-size: ${template === '75x120' ? '10pt' : '12pt'}; /* <<<--- Вот тук увеличим шрифт для 58x40 ---> */
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
        fontSize: '12pt', /* <<<--- Вот тук увеличим шрифт для превью 58x40 ---> */
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
              <label>QR-код (инвентарный номер):</label>
              <input
                type="text"
                value={inventoryNumber}
                onChange={handleInventoryNumberChange}
                required
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label>Наименование:</label>
              <input
                type="text"
                value={itemName}
                onChange={handleItemNameChange}
                placeholder="Введите имя или оно подтянется по QR-коду"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              {/* <<<--- Вот тук выпадающий список ---> */}
              {showDropdown && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  zIndex: 10001,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {searchResults.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleItemSelect(item)}
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                      }}
                      onMouseDown={(e) => e.preventDefault()} // <= Предотвращаем потерю фокуса
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Выбор шаблона */}
            <div style={{ marginTop: '10px' }}>
              <label>Шаблон этикетки:</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
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
                    size={template === '75x120' ? 150 : 100}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                {/* Имя товара */}
                <div style={{ fontWeight: 'bold', marginBottom: template === '75x120' ? '5mm' : '2mm' }}>
                  {itemName}
                </div>
                {/* Инвентарный номер */}
                <div style={{ fontSize: template === '75x120' ? '11pt' : '13pt' }}> {/* <<<--- Вот тук увеличим шрифт для INV ---> */}
                  INV: {inventoryNumber}
                </div>
              </div>
            </div>
          )}

          {/* Превью этикетки на экране */}
          {success && (
            <div className="label-preview-container" style={{ marginTop: '20px', textAlign: 'center' }}>
              <h4>Label Preview:</h4>
              <div style={getPreviewStyle()}>
                <div style={{ marginBottom: template === '75x120' ? '2mm' : '1mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={template === '75x120' ? 64 : 48}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: template === '75x120' ? '1mm' : '0.5mm' }}>
                  {itemName}
                </div>
                <div style={{ fontSize: template === '75x120' ? '8pt' : '10pt' }}> {/* <<<--- Вот тук увеличим шрифт для INV в превью ---> */}
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