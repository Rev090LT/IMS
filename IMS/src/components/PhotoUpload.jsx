// IMS/src/components/PhotoUpload.jsx
import React, { useState, useRef } from 'react';

function PhotoUpload({ itemId, token, onPhotoUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.match('image.*')) {
      setError('❌ Пожалуйста, выберите изображение (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('❌ Размер файла не должен превышать 5MB');
      return;
    }

    setError('');
    setFileName(file.name);
    
    // Предпросмотр
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('is_primary', 'false');

    try {
      const response = await fetch(`/api/photos/items/${itemId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки');
      }

      // Очистить форму
      setPreview(null);
      setFileName('');
      fileInputRef.current.value = '';
      
      // Уведомить родителя
      if (onPhotoUploaded) {
        onPhotoUploaded(data.photo);
      }

      alert('✅ Фото успешно загружено!');
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    setFileName('');
    fileInputRef.current.value = '';
    setError('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={uploadContainerStyle}>
      {/* Скрытый input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      
      {!preview ? (
        // Зона выбора файла
        <div style={dropZoneStyle} onClick={triggerFileInput}>
          <div style={dropZoneContentStyle}>
            <div style={uploadIconStyle}>📷</div>
            <div style={uploadTextStyle}>
              <div style={uploadTitleStyle}>Нажмите для выбора фото</div>
              <div style={uploadSubtitleStyle}>или перетащите файл сюда</div>
            </div>
            <div style={uploadHintStyle}>
              📎 JPEG, PNG, GIF, WebP | Макс. 5MB
            </div>
          </div>
        </div>
      ) : (
        // Предпросмотр
        <div style={previewContainerStyle}>
          <div style={previewWrapperStyle}>
            <img 
              src={preview} 
              alt="Preview" 
              style={previewImageStyle} 
            />
            <button
              onClick={handleRemovePreview}
              style={removeButtonStyle}
              title="Удалить предпросмотр"
            >
              ✕
            </button>
          </div>
          
          <div style={fileInfoStyle}>
            <div style={fileNameStyle}>📄 {fileName}</div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={uploadButtonStyle(uploading)}
            >
              {uploading ? '⏳ Загрузка...' : '📤 Загрузить фото'}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div style={errorStyle}>{error}</div>
      )}
    </div>
  );
}

// Стили
const uploadContainerStyle = {
  marginTop: '15px',
};

const dropZoneStyle = {
  border: '2px dashed #3498db',
  borderRadius: '12px',
  padding: '40px 20px',
  textAlign: 'center',
  backgroundColor: '#f8f9fa',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  ':hover': {
    borderColor: '#2980b9',
    backgroundColor: '#e3f2fd',
  },
};

const dropZoneContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
};

const uploadIconStyle = {
  fontSize: '48px',
  marginBottom: '5px',
};

const uploadTextStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
};

const uploadTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#2c3e50',
};

const uploadSubtitleStyle = {
  fontSize: '13px',
  color: '#7f8c8d',
};

const uploadHintStyle = {
  fontSize: '12px',
  color: '#95a5a6',
  marginTop: '10px',
  fontStyle: 'italic',
};

const previewContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const previewWrapperStyle = {
  position: 'relative',
  display: 'inline-block',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  alignSelf: 'center',
};

const previewImageStyle = {
  maxWidth: '300px',
  maxHeight: '300px',
  width: '100%',
  height: 'auto',
  display: 'block',
};

const removeButtonStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(231, 76, 60, 0.9)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
};

const fileInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
};

const fileNameStyle = {
  fontSize: '13px',
  color: '#2c3e50',
  fontWeight: '500',
  wordBreak: 'break-all',
};

const uploadButtonStyle = (uploading) => ({
  padding: '12px 24px',
  backgroundColor: uploading ? '#95a5a6' : '#27ae60',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: uploading ? 'not-allowed' : 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'all 0.2s ease',
  alignSelf: 'flex-start',
  opacity: uploading ? 0.7 : 1,
});

const errorStyle = {
  color: '#e74c3c',
  backgroundColor: '#fadbd8',
  padding: '12px',
  borderRadius: '8px',
  marginTop: '10px',
  fontSize: '13px',
  border: '1px solid #e74c3c',
};

export default PhotoUpload;