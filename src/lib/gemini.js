export const generateImage = async (apiKey, prompt, baseImages = [], config = {}) => {
  const { imageSize = "1K", aspectRatio = "1:1" } = config;
  
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;

  const userParts = [{ text: prompt }];

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
    
    // Extract base64 image from parts
    const parts = result.candidates[0].content.parts || [];
    const imagePart = parts.find(p => p.inline_data || p.inlineData);
    
    if (!imagePart) {
      throw new Error("No image found in response");
    }

    const imageData = imagePart.inline_data?.data || imagePart.inlineData?.data;
    const mimeType = imagePart.inline_data?.mime_type || imagePart.inlineData?.mimeType || "image/png";

    return `data:${mimeType};base64,${imageData}`;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
};
