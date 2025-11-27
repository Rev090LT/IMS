import { useState } from 'react';
// import { scanItem } from '../../services/api'; // Заглушка

function ScanModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [itemInfo, setItemInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!qrCode.trim()) {
      setError('QR code is required');
      return;
    }

    setLoading(true);
    setError('');
    setItemInfo(null);

    try {
      // const response = await scanItem(qrCode, token);
      // const data = await response.json();
      // if (response.ok) setItemInfo(data);

      // Временная заглушка
      setItemInfo({
        qr_code: qrCode,
        name: 'Sample Item',
        quantity: 5,
        status: 'warehouse',
        location: 'A1-05'
      });
    } catch (err) {
      setError('Failed to fetch item info');
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
        setError('Bluetooth is not supported on this browser');
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
      setError('Failed to connect to Bluetooth scanner');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Scan Item</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}

          <div className="scan-input-group">
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter or scan QR code"
              className="modal-form-input"
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="scan"
            >
              {loading ? 'Scanning...' : 'Scan via Input'}
            </button>

            <button
              onClick={handleBluetoothScan}
              className="bluetooth"
            >
              Scan via Bluetooth
            </button>
          </div>

          {itemInfo && (
            <div className="item-info">
              <h4>Item Found:</h4>
              <p><strong>QR:</strong> {itemInfo.qr_code}</p>
              <p><strong>Name:</strong> {itemInfo.name}</p>
              <p><strong>Quantity:</strong> {itemInfo.quantity}</p>
              <p><strong>Status:</strong> {itemInfo.status}</p>
              <p><strong>Location:</strong> {itemInfo.location}</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="cancel">Close</button>
        </div>
      </div>
    </div>
  );
}

export default ScanModal;