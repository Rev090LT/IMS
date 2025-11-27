import { useState } from 'react';
// import { disposeItem } from '../../services/api'; // Заглушка

function DisposeModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!qrCode || quantity <= 0) {
      setError('QR code and quantity are required');
      return;
    }

    try {
      // const response = await disposeItem({ qr_code: qrCode, quantity }, token);
      // const data = await response.json();
      // if (response.ok) {
      //   setSuccess('Item disposed successfully');
      //   setQrCode('');
      //   setQuantity(1);
      // } else {
      //   setError(data.error || 'Failed to dispose item');
      // }

      // Временная заглушка
      setSuccess('Item disposed successfully (mock)');
      setQrCode('');
      setQuantity(1);
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Dispose Item</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label>QR Code:</label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                required
              />
            </div>
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Cancel</button>
          <button type="submit">Dispose Item</button>
        </div>
      </div>
    </div>
  );
}

export default DisposeModal;