import { useState } from 'react';
import { createItem } from '../services/api'; 

function AddItemModal({ onClose, token }) {
  console.log('AddItemModal rendered, token:', token); // <= Добавьте это
  const [qrCode, setQrCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called'); // <= Добавьте это
    console.log('FormData:', { qrCode, name, description, quantity, location }); // <= И это
    console.log('Token:', token); // <= И это

    setError('');
    setSuccess('');

    if (!qrCode || !name || !quantity || quantity <= 0) {
      setError('QR Code, Name, and Quantity are required');
      return;
    }

    console.log('Before calling createItem'); // <= Добавьте это
    console.log('createItem function:', createItem); // <= И это
    
    try {
      console.log('Inside try block'); // <= И это
      const response = await createItem({
        qr_code: qrCode,
        name,
        description,
        quantity: parseInt(quantity),
        location
      }, token);

      console.log('Response received:', response); // <= И это
      const data = await response.json();      
      console.log('Response ', data); // <= И это

      if (response.ok) {
        setSuccess('Item added successfully!');
        // Очищаем форму
        setQrCode('');
        setName('');
        setDescription('');
        setQuantity(1);
        setLocation('');
      } else {
        setError(data.error || 'Failed to add item');
      }
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Add New Item</h3>
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
              <label>Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

            <div>
              <label>Location:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Cancel</button>
          <button type="button" onClick={handleSubmit}>Add Item</button>
        </div>
      </div>
    </div>
  );
}

export default AddItemModal;