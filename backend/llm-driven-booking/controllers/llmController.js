/**
 * Controller: llmController.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles natural language booking requests using an LLM parser
 *   and delegates event booking confirmation to the Event Service.
 *
 * Dependencies:
 *   - axios: For making HTTP requests to the Event Service.
 *   - llmParser.js: For parsing natural language input into structured booking data.
 *
 * Exports:
 *   - parseBookingRequest: Interprets user text to extract booking info.
 *   - confirmBooking: Finalizes a booking by confirming ticket purchases.
 * ---------------------------------------------------------
 */

const axios = require("axios");
const jwt = require("jsonwebtoken");

/**
 * @function parseBookingRequest
 * @description Parses a natural-language message into structured booking information.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body containing the message text.
 * @param {string} req.body.message - The user’s natural-language booking request.
 *
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 OK with booking info, or 400/500 error response.
 *
 * @sideEffects Logs request body and may call LLM parser service.
 */
exports.parseBookingRequest = async (req, res) => {
  console.log("[LLM Controller] req.body:", req.body);

  const message = req.body?.message?.trim();
  if (!message) {
    return res.status(400).json({
      reply:
        "No message provided. Please send JSON like { message: 'Book 2 tickets for Jazz Night' }",
    });
  }

  try {
    const apiKey =
      process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      console.error("[LLM Controller] Missing GOOGLE_API_KEY / GEMINI_API_KEY");
      return res.status(500).json({
        reply:
          "LLM is not configured on the server. Please contact the administrator.",
      });
    }

    // Build a prompt that asks Gemini to extract a structured booking
    const systemInstructions = `
You are a ticket booking parser for a university events system.
Given a user's natural-language request, extract:
- "event": the exact event name as a string
- "tickets": the number of tickets as an integer

If you cannot confidently identify an event name or ticket count, respond with:
{"event": null, "tickets": null}

Respond with ONLY JSON. Do not include any explanation or extra text.
`;

    const userText = `${systemInstructions}\n\nUser request: "${message}"`;

    const model = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    const llmResponse = await axios.post(url, {
      contents: [
        {
          role: "user",
          parts: [{ text: userText }],
        },
      ],
    });

    const candidate =
      llmResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      // Some models wrap JSON in ```json fences; strip them if present
      const cleaned = candidate
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "");
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn(
        "[LLM Controller] Failed to parse Gemini JSON:",
        parseErr.message,
        "raw:",
        candidate
      );
      return res.status(200).json({
        reply: "Sorry, I couldn't understand your booking request.",
        bookingInfo: null,
      });
    }

    const bookingInfo = {
      event: parsed.event || null,
      tickets:
        typeof parsed.tickets === "number"
          ? parsed.tickets
          : parseInt(parsed.tickets, 10) || null,
    };

    if (!bookingInfo.event || !bookingInfo.tickets) {
      return res.status(200).json({
        reply: "Sorry, I couldn't understand your booking request.",
        bookingInfo: null,
      });
    }

    const reply = `Got it! You want to book ${bookingInfo.tickets} ticket(s) for "${bookingInfo.event}". Please confirm to proceed.`;

    return res.status(200).json({ reply, bookingInfo });
  } catch (err) {
    console.error(
      "[LLM Controller] LLM error:",
      err.response?.data || err.message
    );
    return res.status(500).json({
      reply: "Oops! Something went wrong parsing your request.",
    });
  }
};

/**
 * @function confirmBooking
 * @description Confirms a booking request after user approval by interacting with the Event Service.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body containing booking details.
 * @param {string} req.body.eventName - The name of the event to book.
 * @param {number} req.body.tickets - The number of tickets to purchase.
 *
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 OK with booking success info, or appropriate error status.
 *
 * @sideEffects Performs HTTP requests to the Event Service to complete the booking.
 */
exports.confirmBooking = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: missing Bearer token." });
    }

    // Verify token using the same JWT_SECRET as the auth service
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (authErr) {
    console.warn("[LLM Controller] JWT auth failed:", authErr.message);
    return res
      .status(401)
      .json({ error: "Unauthorized: invalid or expired token." });
  }
  try {
    const { eventName, tickets } = req.body;
    if (!eventName || !tickets) {
      return res.status(400).json({ error: "Missing eventName or tickets." });
    }

    // Fetch all available events from the Event Service
    const { data: events } = await axios.get("http://localhost:6001/api/events");

    const match = events.find(
      (e) => e.name.toLowerCase() === eventName.toLowerCase()
    );

    if (!match) {
      return res.status(404).json({ error: `Event not found: ${eventName}` });
    }

    // Validate ticket availability before attempting purchase
    if (match.tickets < tickets) {
      return res.status(409).json({ error: "Not enough tickets available." });
    }

    // Perform booking for the requested number of tickets
    for (let i = 0; i < tickets; i++) {
      const purchaseRes = await axios.post(
        `http://localhost:6001/api/events/${match.id}/purchase`
      );

      if (purchaseRes.status !== 200) {
        throw new Error(
          `Purchase failed with status ${purchaseRes.status}: ${purchaseRes.statusText}`
        );
      }
    }

    res.json({
      success: true,
      eventId: match.id,
      eventName: match.name,
      purchased: tickets,
      message: `Successfully booked ${tickets} ticket(s) for ${match.name}`,
    });
  } catch (err) {
    console.error("[LLM Controller] Booking confirm error:", err.message);
    res.status(500).json({ error: "Failed to confirm booking." });
  }
};