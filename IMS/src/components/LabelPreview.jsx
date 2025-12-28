import React from 'react';

function LabelPreview({ template, itemData }) {
  // Деструктуризация с значениями по умолчанию
  const { name = 'Неизвестный товар', qrCode = 'QR000000000' } = itemData || {};

  // Функция для получения стиля в зависимости от шаблона
  const getTemplateStyle = () => {
    switch (template) {
      case '75x120':
        return {
          width: '75mm',
          height: '120mm',
          border: '1px solid black',
          padding: '5mm',
          fontSize: '10px',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        };
      case '58x40':
        return {
          width: '58mm',
          height: '40mm',
          border: '1px solid black',
          padding: '2mm',
          fontSize: '8px',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        };
      default:
        // По умолчанию — 75x120 мм
        return {
          width: '75mm',
          height: '120mm',
          border: '1px solid black',
          padding: '5mm',
          fontSize: '10px',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        };
    }
  };

  return (
    <div style={getTemplateStyle()}>
      <div>
        <div><strong>{name}</strong></div>
        <div>QR: {qrCode}</div>
        {/* Можно добавить другие поля товара, например, артикул */}
        {/* <div>Part: {itemData.partNumber}</div> */}
      </div>
      <div style={{ textAlign: 'center' }}>
        {/* Простой текстовый QR-код для предпросмотра */}
        <div style={{ fontSize: '6px', fontFamily: 'monospace' }}>
          [QR: {qrCode}]
        </div>
      </div>
    </div>
  );
}

// Обязательно экспортируем по умолчанию
export default LabelPreview;