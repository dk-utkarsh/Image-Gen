import React from 'react';

const ResultDisplay = ({ image, loading }) => {
  if (loading) {
    return (
      <div className="result-container" style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px' }}></div>
        <p className="subtitle">Gemini is crafting your image...</p>
      </div>
    );
  }

  if (!image) return null;

  const handleDownload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      // Embed unique IST timestamp into image pixels to avoid duplicate detection
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const ist = new Date(now.getTime() + istOffset);
      const ts = ist.getTime().toString();
      const imageData = ctx.getImageData(0, 0, canvas.width, 1);
      for (let i = 0; i < ts.length && i * 4 + 3 < imageData.data.length; i++) {
        const idx = i * 4 + 2;
        const diff = (parseInt(ts[i]) % 3) - 1;
        imageData.data[idx] = Math.min(255, Math.max(0, imageData.data[idx] + diff));
      }
      ctx.putImageData(imageData, 0, 0);
      const istStr = ist.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }).replace(/[/:, ]/g, '-');
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.download = `dentalkart-asset-${istStr}.jpg`;
      link.click();
    };
    img.src = image;
  };

  return (
    <div className="result-container">
      <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Your Masterpiece</h3>
      <img src={image} alt="Generated" className="result-image" />
      <button className="btn-generate" onClick={handleDownload} style={{ background: 'rgba(255,255,255,0.1)' }}>
        <span>Download Image</span>
      </button>
    </div>
  );
};

export default ResultDisplay;
