/**
 * @file llmParser.js
 * ---------------------------------------------------------
 * @description
 *   Provides natural-language parsing for booking requests.
 *   Attempts to extract structured booking info (event name, ticket count, intent)
 *   using a local LLM service (LM Studio), with a regex-based fallback if the model fails.
 *
 * Dependencies:
 *   - axios: For sending requests to the local LM Studio model.
 *   - fetch (global): For retrieving available event listings from the Event Service.
 *
 * Exports:
 *   - parseTextToBooking(message): Parses text into structured booking data.
 * ---------------------------------------------------------
 */

const axios = require("axios");
const jwt = require("jsonwebtoken");

/**
 * @function parseTextToBooking
 * @description
 *   Extracts booking details (event name, ticket quantity, and user intent)
 *   from a natural-language message using an LLM, with regex fallback.
 *
 * @param {string} message - The raw user input (e.g., "Book 2 tickets for Jazz Night").
 * @returns {Promise<Object|null>} A Promise resolving to a booking object:
 *   { event: string, tickets: number, intent: "book" } — or null if parsing fails.
 *
 * @sideEffects
 *   - Makes HTTP requests to fetch event data and call the LM Studio API.
 *   - Logs diagnostic info to the console.
 */
exports.parseTextToBooking = async (message) => {
  const trimmedText = (message || "").trim();
  let eventList = "";

  console.log("[LLM Parser] Sending request to LM Studio...");

  // --- STEP 1: Fetch the list of available events for context ---
  // The LLM performs better when it knows which events exist.
  try {
    const eventsRes = await fetch("http://localhost:6001/api/events");

    if (eventsRes.ok) {
      const events = await eventsRes.json();

      if (Array.isArray(events) && events.length > 0) {
        // Format event list for LLM context (one per line)
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

  // --- STEP 2: Attempt to parse using LM Studio (LLM) ---
  // Sends prompt instructing model to output strict JSON.
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
      model: "qwen2.5-7b-instruct-mlx",
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

  // --- STEP 3: Fallback regex extraction ---
  // Basic heuristic for commands like: "Book 2 tickets for Jazz Night"
  const match = trimmedText.match(/book\s*(\d+)?\s*ticket.*for\s*(.+)/i);

  if (match) {
    return {
      intent: "book",
      tickets: parseInt(match[1]) || 1,
      event: match[2].trim(),
    };
  }

  // No successful parse found
  return null;
};