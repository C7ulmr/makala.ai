import express from "express";
import fetch from "node-fetch"; // only needed for Node <18
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const HF_API_KEY = process.env.HF_API_KEY;
if (!HF_API_KEY) {
  console.error("Missing HF_API_KEY environment variable");
  process.exit(1);
}

// Rate limit: 20 requests per minute per IP
app.use("/api/chat", rateLimit({ windowMs: 60 * 1000, max: 20 }));

// Use a public chat model
const MODEL = "OpenAssistant/oasst-sft-1-pythia-12b";

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: userMessage }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ reply: "Hugging Face error: " + text });
    }

    const data = await response.json();

    // Hugging Face returns [{ generated_text: "..." }]
    const reply = Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text
      : "No reply";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error or model unavailable." });
  }
});

// Serve HTML front-end
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("makala.ai running on port", PORT));
