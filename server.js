import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* Rate limit: 20 requests per minute per IP */
app.use("/api/chat", rateLimit({
  windowMs: 60 * 1000,
  max: 20
}));

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Makala, a clean and professional AI assistant." },
        { role: "user", content: userMessage }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Makala is unavailable right now." });
  }
});

/* Serve website */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* IMPORTANT: Render port */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("makala.ai running on port", PORT);
});
