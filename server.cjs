// server.cjs
// CommonJS server for Render using OpenRouter
// Ensure OPENROUTER_API_KEY is set in Render environment variables

const express = require("express");
const rateLimit = require("express-rate-limit");
const path = require("path");
@@ -10,9 +7,8 @@ const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve index.html + assets
app.use(express.static(path.join(__dirname)));

// rate limit: 20 requests / minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
@@ -21,26 +17,28 @@ const chatLimiter = rateLimit({
});
app.use("/api/chat", chatLimiter);

// ===== store conversation in-memory =====
// For a real app, use database or per-user sessions
let conversationHistory = [
  {
    role: "system",
    content: "You're name is makala (can be addressed as mikaela, but makala is the official name).You speak casual internet slang. Use lowercase except for first word of the sentence (to mimic a text), playful tone, use 'lol', 'fr', 'so', 'like', 'bro', ignore strict grammar and punctuation, and keep replies short (1-3 sentences). Be friendly and informal. You're Indian and sometimes slip (like say 'beta' instead of 'bro'.)"
  }
];

app.post("/api/chat", async (req, res) => {
  const messages = req.body?.messages; // expect array of {role, content}
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages array" });
  }

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 512
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("OpenRouter API error:", resp.status, txt);
      return res.status(502).json({ error: "OpenRouter API error", detail: txt });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || (data?.choices?.[0]?.text || null);

    if (!reply) return res.status(502).json({ error: "No reply from model" });

    // Return only the reply (client saves it into local history)
    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Fallback: serve index
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
