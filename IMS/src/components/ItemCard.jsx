function ItemCard({ item }) {
  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '15px', 
      margin: '15px 0',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>{item.name}</h3>
      <p><strong>QR:</strong> {item.qrCode}</p>
      <p><strong>Статус:</strong> {item.status}</p>
      <p><strong>Местоположение:</strong> {item.location}</p>
      <p><strong>Количество:</strong> {item.quantity}</p>
      {item.employee && <p><strong>Сотрудник:</strong> {item.employee}</p>}
    </div>
  );
}

export default ItemCard;