import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

function PrintLabelModal({ onClose, token }) {
  const [itemName, setItemName] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [originalItemName, setOriginalItemName] = useState('');
  const [originalInventoryNumber, setOriginalInventoryNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [template, setTemplate] = useState('75x120');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const componentRef = useRef();

  const fetchItemNamesByName = async (name) => {
    if (!name.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (!token) {
      setError('Authentication token is missing');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/items/search-by-name/${encodeURIComponent(name)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to search items');
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

  const fetchItemNameByQR = async (code) => {
    if (!code.trim()) {
      setItemName(originalItemName);
      return;
    }

    if (!token) {
      setError('Authentication token is missing');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/items/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch item by QR');
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

  const handleInventoryNumberChange = (e) => {
    const value = e.target.value;
    setInventoryNumber(value);
    setOriginalInventoryNumber(value);
    fetchItemNameByQR(value);
  };

  const handleItemNameChange = (e) => {
    const value = e.target.value;
    setItemName(value);
    setOriginalItemName(value);
    fetchItemNamesByName(value);
  };

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

  const handleBrowserPrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Label_${inventoryNumber || 'unknown'}`,
    pageStyle: `
      @page {
        margin: 0;
        size: ${template === '75x120' ? '75mm 120mm' : '58mm 40mm'};
        ${template === '58x40' ? 'size: 40mm 58mm; orientation: landscape;' : ''}
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          margin: 0;
          padding: 0;
        }
        .print-container {
          position: static;
          width: 100%;
          height: 100%;
          padding: 0;
          font-family: 'Arial, sans-serif';
          font-size: ${template === '75x120' ? '12pt' : '10pt'};
          line-height: 1.2;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
          background: white;
          page-break-inside: avoid;
        }
        .print-container svg {
          max-width: 100%;
          max-height: ${template === '75x120' ? '40mm' : '25mm'};
          width: auto;
          height: auto;
        }
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .print-container {
          margin: 0;
          padding: 0;
          font-size: ${template === '75x120' ? '12pt' : '10pt'};
          line-height: 1.2;
        }
        .print-container svg {
          max-width: 100%;
          max-height: ${template === '75x120' ? '40mm' : '25mm'};
          width: auto;
          height: auto;
        }
        @page {
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
      }
      .print-container {
        width: ${template === '75x120' ? '75mm' : '58mm'};
        height: ${template === '75x120' ? '120mm' : '40mm'};
        padding: ${template === '75x120' ? '5mm' : '1.5mm'};
        font-family: 'Arial, sans-serif';
        font-size: ${template === '75x120' ? '12pt' : '10pt'};
        line-height: 1.2;
        border: 1px solid #ccc;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        boxSizing: border-box;
        background: white;
      }
      .print-container svg {
        max-width: 100%;
        max-height: ${template === '75x120' ? '40mm' : '25mm'};
        width: auto;
        height: auto;
      }
    `,
  });

  const getPreviewStyle = () => {
    if (template === '75x120') {
      return {
        width: '75mm',
        height: '120mm',
        padding: '5mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12pt',
        lineHeight: 1.2,
        border: '1px solid #ccc',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
        backgroundColor: 'white',
      };
    } else {
      return {
        width: '58mm',
        height: '40mm',
        padding: '1.5mm',
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
        backgroundColor: 'white',
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
              {showDropdown && searchResults.length > 0 && (
                <div
                  style={{
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
                  }}
                >
                  {searchResults.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleItemSelect(item)}
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

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

          {success && (
            <div style={{ display: 'none' }}>
              <div ref={componentRef} className="print-container">
                <div style={{ marginBottom: template === '75x120' ? '3mm' : '1mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={template === '75x120' ? 180 : 80}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: template === '75x120' ? '6mm' : '2mm' }}>
                  {itemName}
                </div>
                <div style={{ fontSize: template === '75x120' ? '14pt' : '12pt' }}>
                  INV: {inventoryNumber}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="label-preview-container" style={{ marginTop: '20px', textAlign: 'center' }}>
              <h4>Label Preview:</h4>
              <div style={getPreviewStyle()}>
                <div style={{ marginBottom: template === '75x120' ? '3mm' : '1mm' }}>
                  <QRCodeSVG
                    value={inventoryNumber}
                    size={template === '75x120' ? 72 : 40}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: template === '75x120' ? '2mm' : '0.5mm' }}>
                  {itemName}
                </div>
                <div style={{ fontSize: template === '75x120' ? '10pt' : '9pt' }}>
                  INV: {inventoryNumber}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px', justifyContent: 'center' }}>
          {success && (
            <>
              <button onClick={handleBrowserPrint} className="action-btn" style={{ backgroundColor: '#2ecc71', color: 'white' }}>
                Печать (браузер)
              </button>
            </>
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