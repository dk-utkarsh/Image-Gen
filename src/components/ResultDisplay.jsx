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
    const link = document.createElement('a');
    link.href = image;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
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
