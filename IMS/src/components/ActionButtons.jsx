function ActionButtons({ item, onUpdate }) {
  const handleMoveToProduction = () => {
    const updatedItem = { ...item, status: 'production', location: 'Производство' };
    onUpdate(updatedItem);
  };

  const handleDispose = () => {
    const updatedItem = { ...item, status: 'disposed', location: 'Списание', quantity: item.quantity - 1 };
    onUpdate(updatedItem);
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={handleMoveToProduction} style={{ padding: '8px 16px' }}>
        Переместить в производство
      </button>
      <button onClick={handleDispose} style={{ padding: '8px 16px' }}>
        Списать (–1)
      </button>
    </div>
  );
}

export default ActionButtons;