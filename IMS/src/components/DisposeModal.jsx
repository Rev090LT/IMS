import { useState, useEffect } from 'react';
import { disposeItem, getItemByName } from '../services/api'; // <= Добавь searchItemByName в api.js

function DisposeModal({ onClose, token }) {
  const [searchName, setSearchName] = useState(''); // <= Поле для поиска по имени
  const [qrCode, setQrCode] = useState(''); // <= QR-код
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState([]); // <= Подсказки
  const [showSuggestions, setShowSuggestions] = useState(false); // <= Показывать подсказки

  // <<<--- Поиск по имени при изменении поля --->
  useEffect(() => {
    if (searchName.trim().length > 0) {
      const fetchSuggestions = async () => {
        try {
          const response = await getItemByName(searchName, token);
          const data = await response.json();
          if (response.ok) {
            setSuggestions(data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      };

      // <<<--- Делаем задержку, чтобы не спамить API --->
      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchName, token]);

  // <<<--- Выбрать подсказку --->
  const handleSelectSuggestion = (item) => {
    setQrCode(item.qr_code); // <<<--- Подставляем QR-код
    setSearchName(item.name); // <<<--- Подставляем имя
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!qrCode || quantity <= 0) {
      setError('QR код и количество обязательны');
      return;
    }

    try {
      const response = await disposeItem({ qr_code: qrCode, quantity }, token);
      const data = await response.json();

      if (response.ok) {
        setSuccess('Позиция успешно списана');
        // <<<--- Очистить форму --->
        setSearchName('');
        setQrCode('');
        setQuantity(1);
        setSuggestions([]);
        setShowSuggestions(false);
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
          <h3 className="modal-title">Списать позицию</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div style={{ position: 'relative' }}>
              <label>Название:</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                required
                placeholder="Введите название"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {suggestions.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => handleSelectSuggestion(item)}
                      style={{
                        padding: '8px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseDown={(e) => e.preventDefault()} // <<<--- Чтобы не терялось фокус
                    >
                      {item.name} (QR: {item.qr_code})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label>QR код:</label>
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)} // <<<--- Можно менять вручную
                required
                placeholder="QR код подставится автоматически"
                readOnly // <<<--- Сделать поле только для чтения, если не нужно редактировать
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
          <button type="submit" onClick={handleSubmit}>Списать</button>
        </div>
      </div>
    </div>
  );
}

export default DisposeModal;