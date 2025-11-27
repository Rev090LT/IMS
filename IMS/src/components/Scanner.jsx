import { useState } from 'react';

function Scanner({ onScan }) {
  const [qrCode, setQrCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (qrCode) {
      onScan(qrCode);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Введите QR-код"
        value={qrCode}
        onChange={(e) => setQrCode(e.target.value)}
      />
      <button type="submit">Сканировать</button>
    </form>
  );
}

export default Scanner;  // <= Это важно!