// npm install express node-fetch
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENROUTER_API_KEY; // set this on Render secrets

app.post('/api/chat', async (req,res)=>{
  const userMessage = req.body.message;
  if(!userMessage) return res.status(400).send('missing message');

  const messages = [
    {
      role: "system",
      content: "You talk casual internet slang. lowercase, playful, say 'lol', 'fr', 'so', ignore grammar, 1-2 sentences max."
    },
    { role: "user", content: userMessage }
  ];

  try{
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:"POST",
      headers:{
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        model:"gpt-4o-mini",
        messages: messages
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'no response lol';
    res.json({ reply });
  }catch(e){
    console.error(e);
    res.status(500).send('server error lol');
  }
});

app.listen(PORT, ()=>console.log('makala.ai running on port', PORT));
