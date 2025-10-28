const axios = require("axios");
const { parseTextToBooking } = require("../services/llmParser");

/**
 * POST /api/llm/parse
 * Parse user input into booking info using LLM + fallback.
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
    const bookingInfo = await parseTextToBooking(message);

    if (!bookingInfo) {
      return res.status(200).json({
        reply: "Sorry, I couldn't understand your booking request.",
        bookingInfo: null,
      });
    }

    const reply = `Got it! You want to book ${bookingInfo.tickets} ticket(s) for "${bookingInfo.event}". Please confirm to proceed.`;

    res.status(200).json({ reply, bookingInfo });
  } catch (err) {
    console.error("[LLM Controller] LLM error:", err);
    res
      .status(500)
      .json({ reply: "Oops! Something went wrong parsing your request." });
  }
};

/**
 * POST /api/llm/confirm
 * Confirms a booking after explicit user approval.
 * Delegates to the event service on port 6001.
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { eventName, tickets } = req.body;
    if (!eventName || !tickets) {
      return res.status(400).json({ error: "Missing eventName or tickets." });
    }

    // Fetch all events from the event service
    const { data: events } = await axios.get("http://localhost:6001/api/events");

    const match = events.find(
      (e) => e.name.toLowerCase() === eventName.toLowerCase()
    );

    if (!match)
      return res
        .status(404)
        .json({ error: `Event not found: ${eventName}` });

    // Check if enough tickets are available
    if (match.tickets < tickets) {
      return res.status(409).json({ error: "Not enough tickets available." });
    }

    // Perform booking (bulk)
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