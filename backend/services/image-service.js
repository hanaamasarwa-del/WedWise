const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";

function cleanText(value, maxLength = 5000) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function buildWeddingImagePrompt({ reportText, questionnaire = {} }) {
  const details = [
    questionnaire.regionName && `Region in Israel: ${questionnaire.regionName}`,
    questionnaire.guestCount && `Guest count: ${questionnaire.guestCount}`,
    questionnaire.budget && `Budget in ILS: ${questionnaire.budget}`,
    questionnaire.style && `Wedding style: ${questionnaire.style}`,
    questionnaire.colors && `Preferred colors: ${questionnaire.colors}`,
    questionnaire.flowers && `Flowers: ${questionnaire.flowers}`,
    questionnaire.decorations && `Decor: ${questionnaire.decorations}`,
    questionnaire.freeText && `Couple notes: ${questionnaire.freeText}`,
  ].filter(Boolean);

  return `Create one realistic premium wedding visualization based on this WedWise planning report.

Visual direction:
- Photorealistic wedding venue and styling concept, not a poster and not an invitation card.
- Elegant Israeli wedding atmosphere, warm natural light, refined floral design, tasteful table styling, romantic but realistic.
- Use the couple's described style, colors, flowers, decor preferences, guest scale, and region as inspiration.
- No readable text, no logos, no watermarks, no UI, no document layout.
- Avoid showing identifiable faces close-up. If people appear, keep them subtle and atmospheric.
- Professional wedding editorial photography, high detail, soft luxury palette.

Structured questionnaire details:
${details.length ? details.join("\n") : "No structured details provided."}

Report / user description:
${cleanText(reportText)}`;
}

async function generateWeddingImage({ reportText, questionnaire }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.IMAGE_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    const error = new Error("OpenAI API key is not configured");
    error.statusCode = 500;
    throw error;
  }

  const prompt = buildWeddingImagePrompt({ reportText, questionnaire });
  const response = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      n: 1,
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
      quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
    }),
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(responseBody.error?.message || "OpenAI image generation failed");
    error.statusCode = response.status;
    throw error;
  }

  const firstImage = responseBody.data?.[0];
  const base64Image = firstImage?.b64_json;
  const imageUrl = firstImage?.url;

  if (!base64Image && !imageUrl) {
    const error = new Error("OpenAI returned no image");
    error.statusCode = 502;
    throw error;
  }

  return {
    image: base64Image ? `data:image/png;base64,${base64Image}` : imageUrl,
    promptUsed: prompt,
    model: responseBody.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
  };
}

module.exports = {
  buildWeddingImagePrompt,
  generateWeddingImage,
};
