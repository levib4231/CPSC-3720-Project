/**
 * @file llmParser.js
 * ---------------------------------------------------------
 * @description
 *   Provides natural-language parsing for booking requests.
 *   Attempts to extract structured booking info (event name, ticket count, intent)
 *   using Google Gemini (Generative Language API), with a regex-based fallback
 *   if the model fails or returns unusable output.
 *
 * Dependencies:
 *   - global fetch (Node 18+ / 22+ runtime) for HTTP calls.
 *
 * Exports:
 *   - parseTextToBooking(message): Parses text into structured booking data.
 * ---------------------------------------------------------
 */

// Base URL for the client-service (used to fetch events for context)
const CLIENT_SERVICE_API = (
  process.env.CLIENT_SERVICE_API || "http://localhost:6001/api"
).replace(/\/$/, "");

const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || "gemini-2.0-flash";

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
 *   - Makes HTTP requests to fetch event data and call the Gemini API.
 *   - Logs diagnostic info to the console.
 */
exports.parseTextToBooking = async (message) => {
  const trimmedText = (message || "").trim();
  let eventList = "";

  console.log("[LLM Parser] Using Gemini model:", GOOGLE_MODEL);

  // --- STEP 1: Fetch the list of available events for context (best-effort) ---
  try {
    const eventsRes = await fetch(`${CLIENT_SERVICE_API}/events`);

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
      console.warn(
        `[LLM Parser] Failed to fetch events: ${eventsRes.status} ${eventsRes.statusText}`
      );
      eventList = "(unable to retrieve events)";
    }
  } catch (e) {
    console.warn("[LLM Parser] Error fetching events:", e.message);
    eventList = "(error fetching events)";
  }

  // --- STEP 2: Attempt to parse using Gemini ---
  if (!GOOGLE_API_KEY) {
    console.error("[LLM Parser] Missing GOOGLE_API_KEY / GEMINI_API_KEY");
  } else {
    try {
      const prompt = `You are an assistant that interprets user messages about event ticket bookings.
Extract the event name, ticket quantity, and intent from the user's message.

User message:
"${trimmedText}"

Here are the available events:
${eventList}

Respond strictly in JSON format with no extra text or explanation:
{"event": "<event name>", "tickets": <number>, "intent": "book"}`;

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=` +
        encodeURIComponent(GOOGLE_API_KEY);

      const body = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (data.error) {
        console.error("[LLM Parser] Google error:", data.error);
      } else {
        const rawText =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        let parsed = null;
        try {
          const cleaned = rawText
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/i, "");
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.warn(
            "[LLM Parser] JSON parse failed from Gemini output:",
            rawText
          );
        }

        if (
          parsed &&
          typeof parsed.event === "string" &&
          (typeof parsed.tickets === "number" ||
            typeof parsed.tickets === "string") &&
          parsed.intent
        ) {
          const ticketsNum =
            typeof parsed.tickets === "number"
              ? parsed.tickets
              : parseInt(parsed.tickets, 10) || 1;

          return {
            event: parsed.event,
            tickets: ticketsNum,
            intent: parsed.intent || "book",
          };
        }

        console.warn(
          "[LLM Parser] Gemini returned invalid data, falling back to regex"
        );
      }
    } catch (err) {
      console.warn("[LLM Parser] Gemini request failed:", err.message);
    }
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