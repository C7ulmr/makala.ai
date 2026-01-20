// server.cjs
// OpenRouter version for Render
// Make sure you set your OPENROUTER_API_KEY in Render environment variables

const express = require('express');
const fetch = require('node-fetch'); // Node 18+ has global fetch
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve HTML + assets

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).send('Server misconfigured: missing OPENROUTER_API_KEY');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',          // or whichever model you want
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.7,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).send('OpenRouter API error: ' + text);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'No response.';
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`makala.ai running on http://localhost:${PORT}`);
});
