// server.cjs
// CommonJS version for Render deployment
// Make sure you set your OPENAI_API_KEY in Render environment variables

const express = require('express');
const fetch = require('node-fetch'); // Node 18+ has global fetch; otherwise install: npm install node-fetch
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve your HTML + assets

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).send('Server misconfigured: missing OPENAI_API_KEY');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: userMessage }],
        temperature: 0.7,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).send('OpenAI API error: ' + text);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response.';
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`makala.ai running on http://localhost:${PORT}`);
});
