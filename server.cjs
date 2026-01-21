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
