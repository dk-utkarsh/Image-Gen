import React, { useState } from 'react';

const ImageUploader = ({ onImagesAdd }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        onImagesAdd({
          id: Math.random().toString(36).substr(2, 9),
          preview: reader.result,
          data: base64Data,
          type: file.type,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={`matrix-dropzone ${isDragging ? 'is-dragging' : ''}`}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}>
      <div className="dropzone-aura"></div>
      <div className="dropzone-content">
        <div className="upload-icon-container">
          <span className="matrix-icon">⚡</span>
          <div className="icon-rings">
            <div className="ring"></div>
            <div className="ring"></div>
          </div>
        </div>
        <div className="dropzone-text">
          <span className="prime-text">Inject Base Assets</span>
          <span className="alt-text">Drag & Drop or Multi-Select</span>
        </div>
      </div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        title=""
        className="matrix-file-input"
      />
    </div>
  );
};

export default ImageUploader;
