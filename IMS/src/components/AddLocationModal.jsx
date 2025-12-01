import { useState } from 'react';
import { createLocation } from '../services/api';

function AddLocationModal({ onClose, token, onLocationAdded }) { // Принимаем onLocationAdded
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Location name is required');
      return;
    }

    try {
      const response = await createLocation({ name, description }, token);
      const data = await response.json();

      if (response.ok) {
        setSuccess('Location added successfully!');
        // Вызываем функцию из родителя, передаём новую локацию
        onLocationAdded(data); // data - это новая локация, возвращённая с бэкенда
        // onClose(); // Закрывать не нужно, это делает родитель
      } else {
        setError(data.error || 'Failed to add location');
      }
    } catch (err) {
      setError('Network error or server is unreachable');
      console.error('Error during add location:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Add New Location</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-message error">{error}</div>}
          {success && <div className="modal-message success">{success}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
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
          </form>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel">Cancel</button>
          <button type="button" onClick={handleSubmit}>Add location</button>
        </div>
      </div>
    </div>
  );
}

export default AddLocationModal;