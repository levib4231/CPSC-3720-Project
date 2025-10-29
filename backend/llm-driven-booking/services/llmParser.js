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
  let eventList = "";
  console.log("[LLM Parser] Sending request to LM Studio...");

  // --- Fetch available events safely ---
  try {
    const eventsRes = await fetch("http://localhost:6001/api/events");
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      if (Array.isArray(events) && events.length > 0) {
        eventList = events
          .map((e) => `- ${e.name} (ID: ${e.id}, Date: ${e.date || "TBA"})`)
          .join("\n");
      } else {
        eventList = "(no available events)";
      }
    } else {
      console.warn(`[LLM Parser] Failed to fetch events: ${eventsRes.status}`);
      eventList = "(unable to retrieve events)";
    }
  } catch (e) {
    console.warn("[LLM Parser] Error fetching events:", e.message);
    eventList = "(error fetching events)";
  }

  // --- Try LM Studio model ---
  try {
    const prompt = `You are an assistant that interprets user messages about event ticket bookings.
Extract the event name, ticket quantity, and intent from the user's message.

User message:
"${trimmedText}"

Here are the available events:
${eventList}

Respond strictly in JSON format with no extra text or explanation:
{"event": "<event name>", "tickets": <number>, "intent": "book"}`;

    const response = await axios.post("http://localhost:1234/v1/chat/completions", {
      model: "qwen2.5-7b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
    console.log("[LLM Parser] Raw response:", response.data);

    const content = response.data?.choices?.[0]?.message?.content || "";

    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn("[LLM Parser] JSON parse failed:", content);
    }

    if (parsed && parsed.event && parsed.tickets && parsed.intent) {
      return parsed;
    }

    console.warn("[LLM Parser] LM Studio returned invalid data, falling back to regex");
  } catch (err) {
    console.warn("[LLM Parser] LLM Studio request failed:", err.message);
  }

  // --- Fallback regex parser ---
  const match = trimmedText.match(/book\s*(\d+)?\s*ticket.*for\s*(.+)/i);
  if (match) {
    return {
      intent: "book",
      tickets: parseInt(match[1]) || 1,
      event: match[2].trim(),
    };
  }

  return null;
};