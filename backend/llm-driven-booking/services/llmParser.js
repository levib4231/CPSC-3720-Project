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
exports.parseTextToBooking = async (text) => {
  try {
    // --- Try LLM first ---
    const prompt = `Extract the event name, ticket quantity, and intent from this text:
    "${text}"
    Respond in JSON format: {"event": "...", "tickets": <number>, "intent": "book"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return parsed;
  } catch (err) {
    console.warn("[LLM Parser] LLM failed, using regex fallback:", err.message);

    // --- Fallback keyword parser ---
    const match = text.match(/book\s*(\d+)?\s*ticket.*for\s*(.+)/i);
    if (match) {
      return {
        intent: "book",
        tickets: parseInt(match[1]) || 1,
        event: match[2].trim(),
      };
    }
    return null;
  }
};