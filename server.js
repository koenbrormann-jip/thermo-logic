const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY is missing. AI endpoint will return an error until configured.");
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.post("/api/ai/suggestions", async (req, res) => {
  if (!geminiApiKey) {
    return res.status(500).send("Server is missing GEMINI_API_KEY.");
  }

  const { profile, plan, recentLogs } = req.body || {};
  if (!profile || !plan) {
    return res.status(400).send("Invalid payload: missing profile or plan.");
  }

  const prompt = `You are a strict strength and conditioning coach.
Return concise actionable suggestions in plain text with these sections:
1) Workout Adjustments
2) Progression Adjustments
3) Safety Notes

Context:
${JSON.stringify({ profile, plan, recentLogs }, null, 2)}

Rules:
- Keep under 220 words.
- Respect injuries and equipment constraints.
- Give specific load adjustments in kg or percentage when possible.
- Mention if any planned exercise should be replaced.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).send(`Gemini API error: ${errText}`);
    }

    const data = await response.json();
    const suggestion =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim() ||
      "No suggestion returned by Gemini.";

    return res.json({ suggestion });
  } catch (error) {
    return res.status(500).send(`Request failed: ${error.message}`);
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Workout Coach server running on http://localhost:${port}`);
});
