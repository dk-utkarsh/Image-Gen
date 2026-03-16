import React from 'react';

const ReferenceGallery = ({ images, onRemove }) => {
  if (images.length === 0) return null;

  return (
    <div className="reference-gallery">
      <label className="gallery-label">Reference Images ({images.length})</label>
      <div className="gallery-grid">
        {images.map(img => (
          <div key={img.id} className="gallery-item">
            <img src={img.preview} alt="Reference" />
            <button 
              className="remove-btn" 
              onClick={() => onRemove(img.id)}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferenceGallery;
