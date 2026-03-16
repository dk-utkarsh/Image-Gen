import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ReferenceGallery from './components/ReferenceGallery';
import { generateImage } from './lib/gemini';
import './index.css';

const MATTE_PRESETS = [
  { 
    id: 'clinical-matte', 
    label: '🧴 Soft Matte Clinic', 
    prompt: 'Professional medical product photography, soft diffused natural lighting, minimal shadows, matte surface finish, high-end designer clinical aesthetic, pastel gray background, 8k resolution.' 
  },
  { 
    id: 'cinematic-hero', 
    label: '🏆 Cinematic Hero 3D', 
    prompt: 'Premium 3D cinematic hero shot of a dental product. High-end industrial render, dramatic medical lighting, soft rim highlights, 8k resolution, advertising quality, Octane render aesthetic.' 
  },
  { 
    id: 'catalog-white', 
    label: '🛒 Pure White Catalog', 
    prompt: 'Standard e-commerce listing on a solid pure white background (#FFFFFF). High fidelity, commercial grade, clean shadows, sharp product details.' 
  },
  { 
    id: 'studio-pastel', 
    label: '🎨 Pastel Designer', 
    prompt: 'Premium studio product shot with a soft pastel secondary light, elegant minimalist composition, clean transitions, matte textures, commercial high-fidelity render.' 
  },
  { 
    id: 'industrial-3d', 
    label: '🏗️ Industrial 3D Studio', 
    prompt: 'Clean industrial 3D render of medical equipment, architectural lighting, sharp focus, octane render output, high-fidelity mechanical details, professional studio setup.' 
  },
  { 
    id: 'macro-detail', 
    label: '🔍 Macro Precision', 
    prompt: 'Extreme close-up macro shot, soft clinical focus, high-tech metallic matte finish, sharp intricate details, professional dentistry photography.' 
  },
];

const ENHANCERS = [
  { id: 'matte', label: 'Matte Finish', value: 'Apply a luxurious matte texture and remove all harsh specular reflections.' },
  { id: 'soft-shadows', label: 'Cloud Shadows', value: 'Render extremely soft, diffused ambient occlusion shadows.' },
  { id: 'clinical-clean', label: 'Sterile Clarity', value: 'Maximize clinical cleanliness and artifact-free surfaces.' },
];

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDh89hMkOyPb7Hnsxpop8zn_LeC-ZMh6hY';

function App() {
  const [apiKey] = useState(VITE_GEMINI_API_KEY);
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [activeEnhancers, setActiveEnhancers] = useState([]);
  const [referenceImages, setReferenceImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState('');
  const [imageSize, setImageSize] = useState('1024x1024');

  const toggleEnhancer = (id) => {
    setActiveEnhancers(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const addReferenceImage = (img) => {
    setReferenceImages(prev => [...prev, img]);
    if (referenceImages.length === 0) setOriginalImage(img.preview);
  };

  const removeReferenceImage = (id) => {
    const remaining = referenceImages.filter(img => img.id !== id);
    setReferenceImages(remaining);
    setOriginalImage(remaining.length > 0 ? remaining[0].preview : null);
  };

  const handleGenerate = async () => {
    const preset = MATTE_PRESETS.find(s => s.id === selectedPreset);
    const enhancerTexts = activeEnhancers.map(id => ENHANCERS.find(e => e.id === id).value).join(', ');
    
    const isBackgroundRequested = /background|environment|scene|clinic|room|table|surface|desk|shelf|studio|platform|setup|location/.test(prompt.toLowerCase());

    const PRODUCT_IDENTITY_LAYER = `
      CRITICAL: Preserve the core product exactly as shown in the reference image. 
      Do not alter structural geometry, branding, text, or functional details of the product.
      The product must be 100% identical to the source asset.
      ${!isBackgroundRequested ? 'STRICT: Keep the original background of the source image exactly as it is. Do not modify the environment.' : 'TRANSFORM: Synthesize a professional background as requested while keeping the product identical.'}
    `.trim();

    const finalPrompt = `
      ${PRODUCT_IDENTITY_LAYER}
      Artistic Directives: ${prompt}
      ${preset ? `Style Preset: ${preset.prompt}` : ''}
      Technical Enhancements: ${enhancerTexts}
    `.trim();

    setLoading(true);
    setError('');
    setShowOriginal(false);
    
    const config = {
      imageSize: '1K',
       aspectRatio: imageSize === '1200x630' ? '16:9' : '1:1'
    };

    try {
      const imageUrl = await generateImage(apiKey, finalPrompt, referenceImages, config);
      setCurrentResult(imageUrl);
    } catch (err) {
      setError(err.message || 'Engine core failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || currentResult) {
      const resultsView = document.getElementById('results-view');
      if (resultsView) {
        resultsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [loading, currentResult]);

  return (
    <div className="matte-studio">
      <div className="soft-aura"></div>
      
      <header className="matte-header">
        <div className="matte-brand">
          <div className="matte-core"></div>
          <div className="brand-label">
            <span>DENTALKART</span>
            <label>DESIGN STUDIO • MATTE EDITION</label>
          </div>
        </div>
        <div className="matrix-status">
          <div className="fidelity-shield">
            <span className="shield-icon">🛡️</span>
            IDENTITY SECURE
          </div>
          <div className="dot pulse"></div>
          READY
        </div>
      </header>

      <main className="matrix-flow">
        
        {/* Phase 1: Inputs */}
        <section className="matrix-section input-hub">
          <div className="matrix-glass-card main-controls">
            <div className="card-header">
              <span className="step-count">01</span>
              <h3>Asset Intelligence</h3>
              <div className="header-line"></div>
            </div>

            <div className="input-grid">
              <div className="input-cell assets">
                <label className="matrix-label">Original Asset</label>
                <div className="asset-command">
                  <ImageUploader onImagesAdd={addReferenceImage} />
                  <ReferenceGallery images={referenceImages} onRemove={removeReferenceImage} />
                </div>
              </div>

              <div className="input-cell prompts">
                <label className="matrix-label">Artistic Directives</label>
                <textarea 
                  placeholder="Describe your vision... (Note: Mention 'background' to modify environment)" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="matrix-textarea"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Phase 2: Configuration */}
        <section className="matrix-section configs">
          <div className="matrix-glass-card tool-set">
            <div className="config-group">
              <label className="matrix-label">Creative Protocols (Optional)</label>
              <div className="protocol-list">
                {MATTE_PRESETS.map(p => (
                  <button 
                    key={p.id} 
                    className={`protocol-btn ${selectedPreset === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedPreset(selectedPreset === p.id ? null : p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="enhancer-section">
              <label className="matrix-label">Neural Artifacts</label>
              <div className="enhancer-list">
                {ENHANCERS.map(e => (
                  <button 
                    key={e.id}
                    className={`enhancer-tag ${activeEnhancers.includes(e.id) ? 'active' : ''}`}
                    onClick={() => toggleEnhancer(e.id)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-zone">
              <div className="matrix-format">
                <button className={imageSize === '1024x1024' ? 'on' : ''} onClick={() => setImageSize('1024x1024')}>1:1 SQUARE</button>
                <button className={imageSize === '1200x630' ? 'on' : ''} onClick={() => setImageSize('1200x630')}>16:9 BANNER</button>
              </div>
              <button 
                className="btn-matrix-trigger artist-generate" 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? 'PROCESSING ART...' : 'GENERATE IMAGE'}
              </button>
            </div>
          </div>
          {error && <div className="matrix-error-alert">{error}</div>}
        </section>

        {/* Phase 3: Display */}
        <section className="matrix-section display" id="results-view">
          <div className="matrix-glass-card result-frame">
            {currentResult ? (
              <div className="result-workspace">
                <div className="output-canvas">
                  <img 
                    src={showOriginal ? originalImage : currentResult} 
                    alt="Result" 
                    className={showOriginal ? 'dimmed' : ''}
                  />
                  
                  {loading && (
                    <div className="matrix-scanner-overlay">
                      <div className="cyber-line"></div>
                      <div className="scanner-glow"></div>
                      <div className="status-readout">DATA SYNC IN PROGRESS...</div>
                    </div>
                  )}
                </div>

                <div className="result-actions">
                  <button 
                    className={`btn-matrix-mode ${showOriginal ? 'active' : ''}`}
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onMouseLeave={() => setShowOriginal(false)}
                  >
                    ORIGINAL FREQUENCY
                  </button>
                  <button className="btn-matrix-download" onClick={() => {
                    const link = document.createElement('a');
                    link.href = currentResult;
                    link.download = 'dentalkart-matrix-asset.png';
                    link.click();
                  }}>EXPORT NEURAL DATA</button>
                </div>
              </div>
            ) : (
              <div className="matrix-empty">
                <div className="matrix-orbit">
                  <div className="orb-center"></div>
                </div>
                <h3>Studio Standby</h3>
                <p>Awaiting input for high-fidelity rendering</p>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="matrix-footer">
        <p>DENTALKART DESIGN STUDIO • MATTE EDITION • 2026</p>
      </footer>
    </div>
  );
}

export default App;
