const { parseTextToBooking } = require("../services/llmParser");
const fetch = require("node-fetch");

/**
 * POST /api/llm/parse
 * Parses user natural language input (e.g., "Book two tickets for Jazz Night").
 */
exports.parseBookingRequest = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing 'text' field" });

    const parsed = await parseTextToBooking(text);
    if (!parsed) {
      return res.status(422).json({
        error: "Could not parse request",
        fallback: "Try 'Book 2 tickets for [Event Name]'",
      });
    }

    return res.json({ parsed, source: "llm" });
  } catch (err) {
    console.error("[LLM Controller] Error parsing text:", err.message);
    res.status(500).json({ error: "Internal LLM parse error" });
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