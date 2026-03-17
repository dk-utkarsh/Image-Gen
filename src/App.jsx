import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ReferenceGallery from './components/ReferenceGallery';
import { generateImage } from './lib/gemini';
import { SplineScene } from './components/ui/splite';
import { Card } from './components/ui/card';
import { Spotlight } from './components/ui/spotlight';
import { ContainerScroll } from './components/ui/container-scroll-animation';
import { SparklesCore } from './components/ui/sparkles';
import AnimatedGenerateButton from './components/ui/animated-generate-button';
import './index.css';

const MATTE_PRESETS = [
  { 
    id: 'clinical-matte', 
    label: '🧴 Soft Matte Clinic', 
    prompt: 'Professional medical product photography, 8k resolution, ultra HD, pixel-perfect clarity, razor-sharp details, highly rendered textures, soft diffused natural lighting, minimal shadows, matte surface finish, high-end designer clinical aesthetic, pastel gray background.' 
  },
  { 
    id: 'cinematic-hero', 
    label: '🏆 Cinematic Hero 3D', 
    prompt: 'Ultra HD 3D cinematic hero shot, 8k resolution, pixel-perfect precision, highly rendered textures, ray-tracing reflections, Physically Based Rendering (PBR), dramatic medical lighting, soft rim highlights, Octane render aesthetic, extreme detail.' 
  },
  { 
    id: 'catalog-white', 
    label: '🛒 Pure White Catalog', 
    prompt: 'Standard e-commerce listing on a solid pure white background (#FFFFFF). Ultra HD, pixel-perfect, zero noise, high fidelity, professional color grading, clean shadows, sharp product details.' 
  },
  { 
    id: 'studio-pastel', 
    label: '🎨 Pastel Designer', 
    prompt: 'Premium studio product shot, ultra HD, 8k resolution, pixel-perfect rendering, soft pastel secondary light, elegant minimalist composition, clean transitions, matte textures, commercial high-fidelity ray-traced render.' 
  },
  { 
    id: 'industrial-3d', 
    label: '🏗️ Industrial 3D Studio', 
    prompt: 'Clean industrial 3D render, ultra HD, 8k, pixel-perfect sharpness, Unreal Engine 5 render style, sharp focus, octane render output, high-fidelity mechanical details, professional studio setup.' 
  },
  { 
    id: 'macro-detail', 
    label: '🔍 Macro Precision', 
    prompt: 'Extreme close-up macro shot, ultra HD resolution, 8k, pixel-perfect focus, soft clinical focus, high-tech metallic matte finish, sharp intricate details, professional dentistry photography.' 
  },
];

const ENHANCERS = [
  { id: 'sharpness', label: 'Sharpness', value: 'MANDATORY SHARPNESS OVERRIDE: Apply maximum unsharp mask and high-pass sharpening across the entire product. Every edge, engraving, texture, and surface detail must be hyper-crisp with extreme micro-contrast. Amplify fine detail frequency by 200%. Zero softness allowed on the product — all contours and material grain must cut like a blade. Output must look sharper than a macro photograph at f/16.' },
  { id: 'clinical-clean', label: 'Sterile Clarity', value: 'Maximize clinical cleanliness and artifact-free surfaces.' },
];

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
  const [isEnhancing, setIsEnhancing] = useState(false);

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

  const handleEnhancePixels = async () => {
    if (!currentResult) return;
    setIsEnhancing(true);
    setLoading(true);
    setError('');

    const ENHANCE_PROMPT = `
      ENHANCE THIS IMAGE TO MAXIMUM QUALITY. This is a second-pass refinement.
      CRITICAL RULES:
      - Do NOT change the product, composition, angle, background, or any visual element.
      - The output must be pixel-identical in layout — only quality improves.
      ENHANCEMENT DIRECTIVES:
      - Apply extreme supersampling and sub-pixel rendering.
      - Sharpen every edge, engraving, texture, and surface detail to hyper-crisp levels.
      - Boost micro-contrast on all product surfaces and material grain.
      - Eliminate all compression artifacts, noise, banding, and aliasing.
      - Enhance metallic reflections, surface textures, and material fidelity.
      - Render at maximum 8K UHD+ fidelity with professional advertising photography quality.
      - High-frequency detail refinement on every product contour.
      OUTPUT: The highest possible quality version of this exact image.
    `.trim();

    // Convert the current result (base64 data URL) to inline_data for the API
    const base64Data = currentResult.split(',')[1];
    const mimeType = currentResult.split(';')[0].split(':')[1];
    const enhanceImages = [{
      data: base64Data,
      type: mimeType,
    }];

    const config = { imageSize: '2K', aspectRatio: '1:1' };

    try {
      const imageUrl = await generateImage(apiKey, ENHANCE_PROMPT, enhanceImages, config);
      setCurrentResult(imageUrl);
    } catch (err) {
      setError(err.message || 'Enhancement failed.');
    } finally {
      setLoading(false);
      setIsEnhancing(false);
    }
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
      QUALITY: Output MUST be Pixel-Perfect Ultra High Definition (UHD+), 8k resolution, razor-sharp clarity, no artifacts, highly rendered with realistic textures, ray-tracing, and PBR shaders. Use professional advertising photography standards.
    `.trim();

    const finalPrompt = `
      ${PRODUCT_IDENTITY_LAYER}
      Artistic Directives: ${prompt}
      ${preset ? `Style Preset: ${preset.prompt}` : ''}
      Technical Enhancements: ${enhancerTexts}
    `.trim();

    setIsEnhancing(false);
    setLoading(true);
    setError('');
    setShowOriginal(false);

    const config = {
      imageSize: '2K',
      aspectRatio: '1:1'
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
          <div className="brand-label relative">
            <span>DENTALKART</span>
            <label>DESIGN STUDIO</label>
            <div className="brand-sparkles">
              <SparklesCore
                id="brand-sparkles"
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={80}
                className="w-full h-full"
                particleColor="#FFFFFF"
                speed={1}
              />
            </div>
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

      {/* Robot 3D Hero with Scroll Animation */}
      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <p className="text-sm md:text-base font-semibold tracking-[0.3em] uppercase text-neutral-500">
              Powered By <span className="text-white">Gemini-Pro</span>
            </p>
          }
        >
          <div className="relative w-full h-full">
            <Spotlight
              className="-top-40 left-0 md:left-60 md:-top-20"
              fill="white"
            />
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </ContainerScroll>
      </div>

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
                <button className="on">1:1 SQUARE</button>
              </div>
              <div className="flex justify-end">
                <AnimatedGenerateButton
                  labelIdle="Generate Image"
                  labelActive={isEnhancing ? "Enhancing..." : "Processing..."}
                  generating={loading}
                  highlightHueDeg={195}
                  onClick={handleGenerate}
                  disabled={loading}
                />
              </div>
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
                    src={showOriginal && originalImage ? originalImage : currentResult}
                    alt={showOriginal ? 'Original' : 'Result'}
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
                  <button
                    className={`btn-matrix-mode enhance-pixels-btn ${isEnhancing ? 'loading' : ''}`}
                    onClick={handleEnhancePixels}
                    disabled={loading}
                  >
                    ✨ ENHANCE PIXELS
                  </button>
                  <button className="btn-matrix-download" onClick={() => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      const ctx = canvas.getContext('2d');
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0);
                      const link = document.createElement('a');
                      link.href = canvas.toDataURL('image/jpeg', 0.95);
                      link.download = 'dentalkart-asset.jpg';
                      link.click();
                    };
                    img.src = currentResult;
                  }}>EXPORT JPEG</button>
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
        <p>DENTALKART DESIGN STUDIO • 2026</p>
      </footer>
    </div>
  );
}

export default App;
