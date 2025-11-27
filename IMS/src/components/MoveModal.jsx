import { useState } from 'react';
// import { moveItem } from '../../services/api'; // Заглушка

function MoveModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!qrCode || !fromLocation || !toLocation || quantity <= 0) {
      setError('All fields are required');
      return;
    }

    try {
      // const response = await moveItem({ qr_code, from_location, to_location, quantity }, token);
      // const data = await response.json();
      // if (response.ok) {
      //   setSuccess('Item moved successfully');
      //   setQrCode('');
      //   setFromLocation('');
      //   setToLocation('');
      //   setQuantity(1);
      // } else {
      //   setError(data.error || 'Failed to move item');
      // }

      // Временная заглушка
      setSuccess('Item moved successfully (mock)');
      setQrCode('');
      setFromLocation('');
      setToLocation('');
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
          <h3 className="modal-title">Move Item</h3>
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
              <label>From Location:</label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label>To Location:</label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
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
          <button type="submit" form="modal-form">Move Item</button> {/* form="modal-form" связывает с формой */}
        </div>
      </div>
    </div>
  );
}

export default MoveModal;