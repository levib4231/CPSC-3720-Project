/**
 * @file llmParser.js
 * @description Extracts structured booking info from natural language input.
 */

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // or leave undefined if using Ollama
});

/**
 * Extracts event name, ticket quantity, and intent.
 * Falls back to regex-based keyword extraction if model fails.
 */
const axios = require("axios");

exports.parseTextToBooking = async (message) => {
  const trimmedText = (message || "").trim();

  try {
    const prompt = `Extract the event name, ticket quantity, and intent from this text:
"${trimmedText}"
Respond strictly in JSON format: {"event": "...", "tickets": <number>, "intent": "book"}`;

    const response = await axios.post("http://localhost:1234/v1/chat/completions", {
      model: "gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const content = response.data.choices?.[0]?.message?.content || "";

    let parsed = null;
    try { parsed = JSON.parse(content); } 
    catch { console.warn("[LLM Parser] JSON parse failed", content); }

    if (parsed && parsed.event && parsed.tickets && parsed.intent) return parsed;
    console.warn("[LLM Parser] LM Studio returned invalid data, falling back to regex");
  } catch (err) {
    console.warn("[LLM Parser] LLM Studio request failed:", err.message);
  }

  // Fallback parser
  const match = trimmedText.match(/book\s*(\d+)?\s*ticket.*for\s*(.+)/i);
  if (match) return { intent: "book", tickets: parseInt(match[1]) || 1, event: match[2].trim() };

  return null;
};