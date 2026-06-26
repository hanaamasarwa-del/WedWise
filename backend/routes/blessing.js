const express = require('express');
const router = express.Router();

router.post('/generate-blessing', async (req, res) => {
  try {
    const { prompt, length } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Hebrew wedding blessing writer. Write natural, warm, and authentic Hebrew wedding blessings for Jewish/Israeli weddings. Always write in Hebrew only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: length === 'קצר-מאוד' ? 150 : length === 'קצר' ? 300 : 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI error:', error);
      return res.status(500).json({ error: 'Failed to generate blessing' });
    }

    const data = await response.json();
    const blessing = data.choices[0]?.message?.content || 'לא הצלחנו לייצר ברכה';

    res.json({ blessing: blessing.trim() });
  } catch (error) {
    console.error('Blessing generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
