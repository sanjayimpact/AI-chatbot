import express from "express";
import cors from "cors";
import "dotenv/config";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use stable Gemini 2.5 Pro model
const MODEL_NAME = "models/gemini-2.5-flash-lite"; // instead of pro

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent`;
const API_KEY = process.env.GOOGLE_API_KEY;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid messages payload" });
  }

  try {
    const body = {
      contents: messages.map((msg) => ({
        role: msg.role || "user",
        parts: [{ text: msg.content || "" }],
      })),
    };

    const response = await axios.post(`${GEMINI_ENDPOINT}?key=${API_KEY}`, body, {
      headers: { "Content-Type": "application/json" },
    });

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received.";

    res.json({ reply, raw: response.data });
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        "Failed to call Gemini API. Check your key or model name.",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Gemini chatbot running on port ${PORT}`));
