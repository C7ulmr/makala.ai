// server.cjs
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// health
app.get('/health', (req, res) => res.send('ok'));

// POST /api/chat  { messages: [...] , model?: '...' }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    if(!messages) return res.status(400).send('Missing messages');

    const OR_KEY = process.env.OPENROUTER_API_KEY;
    const OA_KEY = process.env.OPENAI_API_KEY;
    const chosenModel = model || process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // prefer OpenRouter if key present
    if(OR_KEY){
      const url = 'https://api.openrouter.ai/v1/chat/completions';
      const payload = { model: chosenModel, messages, temperature: 0.3, max_tokens: 800 };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OR_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      return res.json({ reply: data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '', raw: data });
    }

    if(OA_KEY){
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = { model: chosenModel, messages, temperature: 0.3, max_tokens: 800 };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OA_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      return res.json({ reply: data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '', raw: data });
    }

    return res.status(500).send('No API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY in environment.');
  } catch(err){
    console.error(err);
    res.status(500).send(String(err));
  }
});

// SPA fallback
app.get('*', (req,res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
