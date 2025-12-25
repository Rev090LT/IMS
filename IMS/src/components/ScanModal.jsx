import { useState } from 'react';
import { scanItem } from '../services/api'; // Заглушка

function ScanModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [itemInfo, setItemInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('Необходим QR код');
      return;
    }

    setLoading(true);
    setError('');
    setItemInfo(null);

    try {
      const response = await scanItem(qrCode, token);
      const data = await response.json();
      if (response.ok) setItemInfo(data);

      // Временная заглушка
    } catch (err) {
      setError('Ошибка получения информации о позиции');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBluetoothScan = async () => {
    setError('');
    setItemInfo(null);

    try {
      if (!navigator.bluetooth) {
        setError('Bluetooth не поддерживается этим браузером');
        return;
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Scanner' }],
        optionalServices: ['generic_access'],
      });

      const server = await device.gatt.connect();
      const mockCode = 'BLUETOOTH123456';
      setQrCode(mockCode);
      setTimeout(() => {
        handleScan();
      }, 500);

    } catch (err) {
      setError('Не удалось подключиться к сканеру Bluetooth');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Сканировать позицию</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}

          <div className="scan-input-group">
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Введите инвентарный номер или отсканируйте QR код"
              className="modal-form-input"
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="scan"
            >
              {loading ? 'Scanning...' : 'Сканировать вручную'}
            </button>

            <button
              onClick={handleBluetoothScan}
              className="bluetooth"
            >
              Сканировать с подключением Bluetooth сканера
            </button>
          </div>

          {itemInfo && (
            <div className="item-info">
              <h4>Позиция найдена:</h4>
              <p><strong>QR:</strong> {itemInfo.qr_code}</p>
              <p><strong>Имя:</strong> {itemInfo.name}</p>
              <p><strong>Количество:</strong> {itemInfo.quantity}</p>
              <p><strong>Статус:</strong> {itemInfo.status}</p>
              <p><strong>Местоположение:</strong> {itemInfo.location_name}</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

export default ScanModal;