// Dental abbreviations that trigger false-positive safety filters
const DENTAL_TERM_MAP = [
  [/\bpedo\b/gi, 'Pediatric'],
  [/\bpedo\s+extraction\b/gi, 'Pediatric Extraction'],
  [/\bpedo\s+forceps\b/gi, 'Pediatric Forceps'],
];

const sanitizeDentalPrompt = (text) => {
  let sanitized = text;
  for (const [pattern, replacement] of DENTAL_TERM_MAP) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
};

const MAX_IMAGE_SIZE_KB = 1000;

const compressToMaxSize = (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      const tryCompress = (quality, scale) => {
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        canvas.width = w;
        canvas.height = h;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        const sizeKB = Math.round((compressed.length - compressed.indexOf(',') - 1) * 3 / 4 / 1024);

        if (sizeKB <= MAX_IMAGE_SIZE_KB) return resolve(compressed);
        if (quality > 0.3) return tryCompress(quality - 0.05, scale);
        if (scale > 0.5) return tryCompress(0.8, scale - 0.1);
        resolve(compressed);
      };

      tryCompress(0.92, 1.0);
    };
    img.src = dataUrl;
  });
};

const MAX_RETRIES = 3;
const RETRYABLE_REASONS = ['MALFORMED_FUNCTION_CALL', 'RECITATION'];

export const generateImage = async (apiKey, prompt, baseImages = [], config = {}) => {
  const { imageSize = "1K", aspectRatio = "1:1" } = config;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

  const safePrompt = sanitizeDentalPrompt(prompt);
  const userParts = [{ text: safePrompt }];

  if (baseImages && baseImages.length > 0) {
    baseImages.forEach(img => {
      userParts.push({
        inline_data: {
          mime_type: img.type || "image/jpeg",
          data: img.data
        }
      });
    });
  }

  const contents = [
    {
      role: "user",
      parts: userParts
    }
  ];

  const body = {
    contents,
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: {
        imageSize: imageSize,
        aspectRatio: aspectRatio
      }
    }
  };

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate image");
      }

      const result = await response.json();

      // Check if response was blocked by safety filters
      if (!result.candidates || result.candidates.length === 0) {
        const blockReason = result.promptFeedback?.blockReason;
        if (blockReason) {
          throw new Error(`Request blocked by safety filter: ${blockReason}. Try rephrasing your prompt.`);
        }
        throw new Error("No response from API. The prompt may have been filtered.");
      }

      const candidate = result.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Image generation blocked by safety filters. Try rephrasing your prompt.");
      }

      // Retry on transient Gemini issues like MALFORMED_FUNCTION_CALL
      if (!candidate.content || !candidate.content.parts) {
        const reason = candidate.finishReason || 'unknown';
        if (RETRYABLE_REASONS.includes(reason) && attempt < MAX_RETRIES) {
          console.warn(`Gemini returned ${reason}, retrying (${attempt}/${MAX_RETRIES})...`);
          lastError = new Error(`Gemini returned ${reason}`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw new Error(`Empty response (finishReason: ${reason}). Try a different prompt.`);
      }

      // Extract base64 image from parts
      const parts = candidate.content.parts;
      const imagePart = parts.find(p => p.inline_data || p.inlineData);

      if (!imagePart) {
        const textPart = parts.find(p => p.text);
        throw new Error(textPart ? `API returned text only: ${textPart.text.slice(0, 100)}` : "No image found in response");
      }

      const imageData = imagePart.inline_data?.data || imagePart.inlineData?.data;

      // Always normalize to JPEG regardless of what format the API returns (png, webp, etc.)
      const originalMime = imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType || "image/png";
      const rawDataUrl = `data:${originalMime};base64,${imageData}`;
      return compressToMaxSize(rawDataUrl);
    } catch (err) {
      lastError = err;
      // Only retry on retryable reasons, not on other errors
      if (attempt < MAX_RETRIES && err.message?.includes('MALFORMED_FUNCTION_CALL')) {
        console.warn(`Retrying after error (${attempt}/${MAX_RETRIES}):`, err.message);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      console.error("Gemini API Error:", err);
      throw err;
    }
  }

  throw lastError;
};
