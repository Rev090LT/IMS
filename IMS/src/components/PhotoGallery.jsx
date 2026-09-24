// IMS/src/components/PhotoGallery.jsx
import React, { useState, useEffect } from 'react';

function PhotoGallery({ itemId, token }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, [itemId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/photos/items/${itemId}/photos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Удалить это фото?')) return;

    try {
      const response = await fetch(`/api/photos/items/${itemId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPhotos(photos.filter(p => p.id !== photoId));
        alert('Фото удалено');
      }
    } catch (error) {
      alert('Ошибка при удалении фото');
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      const response = await fetch(`/api/photos/items/${itemId}/photos/${photoId}/primary`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPhotos(photos.map(p => ({
          ...p,
          is_primary: p.id === photoId,
        })));
      }
    } catch (error) {
      alert('Ошибка при установке основного фото');
    }
  };

  if (loading) {
    return <div style={loadingStyle}>⏳ Загрузка фото...</div>;
  }

  if (photos.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
        <div style={{ color: '#666' }}>Фотографии не загружены</div>
      </div>
    );
  }

  return (
    <div style={galleryStyle}>
      {/* Сетка фото */}
      <div style={gridStyle}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              ...photoCardStyle,
              border: photo.is_primary ? '3px solid #3498db' : '2px solid #e0e0e0',
            }}
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.photo_url}
              alt={photo.photo_name || 'Фото'}
              style={photoImageStyle}
              onError={(e) => {
                console.error('Ошибка загрузки фото:', photo.photo_url);
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EНет фото%3C/text%3E%3C/svg%3E';
              }}
            />
            
            {photo.is_primary && (
              <div style={primaryBadgeStyle}>⭐ Основное</div>
            )}
            
            <div style={photoActionsStyle}>
              {!photo.is_primary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPrimary(photo.id);
                  }}
                  style={actionButtonStyle}
                  title="Сделать основным"
                >
                  ⭐
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
                style={{ ...actionButtonStyle, backgroundColor: '#e74c3c' }}
                title="Удалить"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно просмотра — ИСПРАВЛЕНО: используем selectedPhoto */}
      {selectedPhoto && (
        <div style={modalOverlayStyle} onClick={() => setSelectedPhoto(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              style={closeButtonStyle}
            >
              ✕
            </button>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.photo_name || 'Фото'}
              style={modalImageStyle}
            />
            <div style={modalInfoStyle}>
              <div><strong>Файл:</strong> {selectedPhoto.photo_name}</div>
              <div><strong>Размер:</strong> {selectedPhoto.file_size ? (selectedPhoto.file_size / 1024).toFixed(1) + ' KB' : 'N/A'}</div>
              <div><strong>Загружено:</strong> {selectedPhoto.uploaded_at ? new Date(selectedPhoto.uploaded_at).toLocaleString('ru-RU') : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Стили
const galleryStyle = {
  marginTop: '20px',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '15px',
};

const photoCardStyle = {
  position: 'relative',
  borderRadius: '8px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s',
  backgroundColor: 'white',
};

const photoImageStyle = {
  width: '100%',
  height: '150px',
  objectFit: 'cover',
};

const primaryBadgeStyle = {
  position: 'absolute',
  top: '5px',
  left: '5px',
  backgroundColor: '#3498db',
  color: 'white',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '600',
};

const photoActionsStyle = {
  position: 'absolute',
  bottom: '5px',
  right: '5px',
  display: 'flex',
  gap: '5px',
};

const actionButtonStyle = {
  padding: '5px 8px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modalContentStyle = {
  position: 'relative',
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '90%',
  maxHeight: '90vh',
  overflow: 'auto',
};

const closeButtonStyle = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(0,0,0,0.5)',
  color: 'white',
  border: 'none',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  cursor: 'pointer',
  fontSize: '16px',
};

const modalImageStyle = {
  maxWidth: '100%',
  maxHeight: '70vh',
  borderRadius: '4px',
};

const modalInfoStyle = {
  marginTop: '15px',
  padding: '10px',
  backgroundColor: '#f5f5f5',
  borderRadius: '4px',
  fontSize: '13px',
  color: '#666',
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#666',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#999',
};

export default PhotoGallery;