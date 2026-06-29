const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/generate-countdown-design', upload.single('image'), async (req, res) => {
  try {
    const { coupleNames, customTitle, months, days } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const imageMediaType = req.file.mimetype;

    // First, analyze the image to understand its style in detail
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this wedding inspiration image in detail. Describe:
1. Dominant colors (list specific color names like "blush pink", "navy blue", "sage green", "gold", etc.)
2. Visual elements (flowers, plants, textures, materials, patterns)
3. Overall mood and aesthetic (romantic, modern, rustic, minimalist, bohemian, etc.)
4. Lighting and atmosphere (warm, cool, natural, dramatic, soft)
5. Any specific style details (garden vibes, beach/ocean, forest, luxury, vintage)

Be specific and detailed. This will be used to create a matching countdown card design.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMediaType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!visionResponse.ok) {
      throw new Error('Failed to analyze image');
    }

    const visionData = await visionResponse.json();
    const styleDescription = visionData.choices[0]?.message?.content || 'elegant wedding design';

    // Generate a similar image using DALL-E with detailed matching prompt
    const prompt = `Create a stunning Hebrew wedding countdown card design that matches this exact aesthetic and style:

${styleDescription}

The countdown card must include:
- Couple names at the top: "${coupleNames || 'לזוג האושר'}"
- Large prominent countdown numbers: "${months} חודשים | ${days} ימים"
- ${customTitle ? `Title text: "${customTitle}"` : 'Hebrew text: "עד ליום הגדול"'}

CRITICAL STYLE REQUIREMENTS:
- Match the color palette exactly as described above
- Incorporate the same visual elements, flowers, textures, and mood
- Use the same aesthetic and atmosphere
- Keep the exact same lighting style (warm/cool)
- Maintain the same overall vibe and feeling
- Premium, professional, polished appearance

The design should be a beautiful save-the-date card suitable for sharing. Hebrew text throughout. Cohesive, elegant, and matching the inspiration image perfectly.`;


    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1280',
        quality: 'hd',
      }),
    });

    if (!dalleResponse.ok) {
      const error = await dalleResponse.json();
      console.error('DALL-E error:', error);
      throw new Error('Failed to generate image');
    }

    const dalleData = await dalleResponse.json();
    const imageUrl = dalleData.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL received from DALL-E');
    }

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    res.json({ image: base64Image });
  } catch (error) {
    console.error('Countdown design generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate design' });
  }
});

module.exports = router;
