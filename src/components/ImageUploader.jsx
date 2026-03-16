import React, { useState } from 'react';

const ImageUploader = ({ onImagesAdd }) => {
  const [isDragging, setIsDragging] = useState(false);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension for reference
          const MAX_SIZE = 1024;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG for smaller payload
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
      };
    });
  };

  const processFiles = async (files) => {
    for (const file of Array.from(files)) {
      const compressedDataUrl = await compressImage(file);
      const base64Data = compressedDataUrl.split(',')[1];
      onImagesAdd({
        id: Math.random().toString(36).substr(2, 9),
        preview: compressedDataUrl,
        data: base64Data,
        type: 'image/jpeg',
        name: file.name
      });
    }
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
