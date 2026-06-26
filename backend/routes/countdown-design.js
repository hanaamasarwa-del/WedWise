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

    // First, analyze the image to understand its style
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
                text: 'Analyze this wedding inspiration image and describe its style, colors, mood, and aesthetic in Hebrew. Be concise (2-3 sentences).',
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
        max_tokens: 200,
      }),
    });

    if (!visionResponse.ok) {
      throw new Error('Failed to analyze image');
    }

    const visionData = await visionResponse.json();
    const styleDescription = visionData.choices[0]?.message?.content || 'elegant wedding design';

    // Generate a similar image using DALL-E
    const prompt = `Create a beautiful wedding countdown card design in Hebrew inspired by this style: ${styleDescription}

    The design should include:
    - Couple names: ${coupleNames || 'לזוג האושר'}
    - Countdown display: ${months} חודשים | ${days} ימים
    - ${customTitle ? `Custom title: ${customTitle}` : 'A romantic footer with "עד ליום הגדול"'}
    - Professional, elegant, and premium appearance
    - Wedding/romantic aesthetic
    - Hebrew text
    - Suitable for sharing as a save-the-date

    Make it visually stunning and cohesive with the inspiration image's style.`;

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
