import { useState } from 'react';
import { disposeItem } from '../services/api';

function DisposeModal({ onClose, token }) {
  const [qrCode, setQrCode] = useState(''); // <= Вернули qr_code
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!qrCode || quantity <= 0) {
      setError('QR код и количество обязательны');
      return;
    }

    try {
      const response = await disposeItem({ qr_code: qrCode, quantity }, token); // <= Отправляем qr_code
      const data = await response.json();

      if (response.ok) {
        setSuccess('Позиция успешно списана');
        setQrCode(''); // <= Очищаем qr_code
        setQuantity(1);
      } else {
        setError(data.error || 'Не удалось списать позицию');
      }
    } catch (err) {
      setError('Ошибка сети или сервер недоступен');
      console.error('Error during dispose item:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Удалить позицию</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label>QR код:</label> {/* <= Вернули подпись */}
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                required
                placeholder="Введите QR код"
              />
            </div>

            <div>
              <label>Количество:</label>
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
          <button type="button" onClick={onClose} className="cancel">Отмена</button>
          <button type="button" onClick={handleSubmit}>Списать</button>
        </div>
      </div>
    </div>
  );
}

export default DisposeModal;