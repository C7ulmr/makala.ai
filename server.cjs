// server.cjs
const express = require('express');
const path = require('path');
const fetch = globalThis.fetch || require('node-fetch'); // node 18+ has fetch

const app = express();
app.use(express.json());

// Serve static files from ./public
app.use(express.static(path.join(__dirname, 'public')));

// Simple health
app.get('/health', (req, res) => res.send('ok'));

// Proxy to model APIs (example)
// POST /api/chat  { messages: [...] , model: '...' }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages) return res.status(400).send('Missing messages');

    // Choose API based on env vars (OpenRouter preferred)
    const OR_KEY = process.env.OPENROUTER_API_KEY;
    const OA_KEY = process.env.OPENAI_API_KEY;
    const chosenModel = model || process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (OR_KEY) {
      // OpenRouter (example endpoint, adapt if your router differs)
      const orResp = await fetch('https://api.openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OR_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: chosenModel, messages, temperature: 0.3, max_tokens: 800 })
      });
      const data = await orResp.json();
      const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      return res.json({ reply, raw: data });
    }

    if (OA_KEY) {
      // OpenAI fallback
      const oaResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: chosenModel, messages, temperature: 0.3, max_tokens: 800 })
      });
      const data = await oaResp.json();
      const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
      return res.json({ reply, raw: data });
    }

    return res.status(500).send('No API key configured (OPENROUTER_API_KEY or OPENAI_API_KEY required)');
  } catch (err) {
    console.error(err);
    res.status(500).send(String(err));
  }
});

// Optional: title endpoint
app.post('/api/title', async (req, res) => {
  // similar proxy logic; keep simple: use /api/chat fallback or return 204
  res.status(204).send();
});

// Fallback: serve index.html for any SPA route (so client-side routing works)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
