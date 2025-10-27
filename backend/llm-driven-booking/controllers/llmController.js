const { parseTextToBooking } = require("../services/llmParser");
const fetch = require("node-fetch");

/**
 * POST /api/llm/parse
 * Parses user natural language input (e.g., "Book two tickets for Jazz Night").
 */

exports.parseBookingRequest = async (req, res) => {
  console.log("[LLM Controller] req.body:", req.body);

  // Safely get the user message
  const message = req.body?.message;
  if (!message) {
    return res.status(400).json({
      reply: "No message provided. Make sure you send JSON with { message: '...' }",
    });
  }

  try {
    // Attempt to parse booking info via LLM + regex fallback
    const bookingInfo = await parseTextToBooking(message);

    if (!bookingInfo) {
      // If nothing could be parsed, send fallback reply
      return res.status(200).json({
        reply: "Sorry, I couldn't understand your booking request.",
      });
    }

    // Compose a friendly response
    const reply = `Got it! You want to book ${bookingInfo.tickets} ticket(s) for "${bookingInfo.event}".`;

    // Return both the raw booking data and a chat-friendly reply
    res.status(200).json({ reply, bookingInfo });
  } catch (err) {
    console.error("[LLM Controller] LLM error:", err);
    res.status(500).json({ reply: "Oops! Something went wrong." });
  }
};

/**
 * POST /api/llm/confirm
 * After confirmation, calls the client service to actually book tickets.
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { eventName, tickets } = req.body;
    if (!eventName || !tickets) {
      return res.status(400).json({ error: "Missing eventName or tickets" });
    }

    // Fetch all events from client-service
    const eventsRes = await fetch("http://localhost:6001/api/events");
    const events = await eventsRes.json();
    const match = events.find(
      (e) => e.name.toLowerCase() === eventName.toLowerCase()
    );

    if (!match) return res.status(404).json({ error: "Event not found" });

    // Trigger booking for each ticket (or modify for bulk booking)
    for (let i = 0; i < tickets; i++) {
      await fetch(`http://localhost:6001/api/events/${match.id}/purchase`, {
        method: "POST",
      });
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
    res.status(500).json({ error: "Failed to confirm booking" });
  }
};