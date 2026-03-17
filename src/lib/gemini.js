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

export const generateImage = async (apiKey, prompt, baseImages = [], config = {}) => {
  const { imageSize = "1K", aspectRatio = "1:1" } = config;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

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

    if (!candidate.content || !candidate.content.parts) {
      throw new Error("Empty response from API. Try a different prompt.");
    }

    // Extract base64 image from parts
    const parts = candidate.content.parts;
    const imagePart = parts.find(p => p.inline_data || p.inlineData);

    if (!imagePart) {
      const textPart = parts.find(p => p.text);
      throw new Error(textPart ? `API returned text only: ${textPart.text.slice(0, 100)}` : "No image found in response");
    }

    const imageData = imagePart.inline_data?.data || imagePart.inlineData?.data;
    const mimeType = imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType || "image/png";

    return `data:${mimeType};base64,${imageData}`;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
};
