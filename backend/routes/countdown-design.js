const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/generate-countdown-design', upload.single('image'), async (req, res) => {
  try {
    const { coupleNames, customTitle, years, months } = req.body;

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

    // First, analyze the image to understand its style in detail using GPT-4 Vision
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this wedding inspiration image to extract its visual style. Provide:
1. Color palette: List 3-5 dominant colors with specific names (e.g., "warm gold", "soft cream", "sage green", "terracotta", "dusty rose")
2. Visual elements: Describe specific textures, patterns, flowers, plants, or materials visible
3. Overall mood: (e.g., romantic, rustic, modern, bohemian, luxe, natural, vintage)
4. Lighting: Describe the lighting quality (golden hour, soft natural, warm, cool, dramatic)
5. Environment/setting: (garden, field, beach, urban, forest, outdoor, indoor)
6. Style keywords: 5-7 adjectives that capture the essence

Be very specific and detailed. This will guide the creation of a matching countdown card.`,
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
        max_tokens: 400,
      }),
    });

    if (!visionResponse.ok) {
      throw new Error('Failed to analyze image');
    }

    const visionData = await visionResponse.json();
    const styleDescription = visionData.choices[0]?.message?.content || 'elegant wedding design';

    // Generate a beautiful, elegant countdown card design inspired by the photo
    const prompt = `Create a stunning, premium wedding countdown card design in Hebrew. This is a DESIGNED CARD, not a photo.

Aesthetic inspiration from the uploaded image:
${styleDescription}

COUNTDOWN INFORMATION TO DISPLAY:
- Large prominent numbers: ${years} | ${months}
- Labels below: שנים | חודשים
- Couple names: ${coupleNames || 'לזוג האושר'}
${customTitle ? `- Custom title: ${customTitle}` : ''}

DESIGN REQUIREMENTS:
✓ Elegant, romantic, premium aesthetic suitable for a wedding save-the-date
✓ Extract and use the soft, refined color palette from the inspiration image
✓ Incorporate textures, patterns, or decorative elements that match the mood
✓ Beautiful typography with Hebrew text
✓ Balanced composition with intentional spacing
✓ Soft decorative elements (not tacky or childish)
✓ Modern, polished, professional appearance
✓ Cohesive design that feels intentionally crafted

CRITICAL:
- DO NOT include photos of people
- DO NOT use plain gradients with just text
- DO NOT make it childish, generic, or basic
- DO use the color palette from the inspiration image
- DO create a card someone would actually want to share
- Make it feel like a premium, designed wedding save-the-date card
- The overall composition should feel balanced and elegant
- Include subtle decorative elements that enhance the design`;


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
