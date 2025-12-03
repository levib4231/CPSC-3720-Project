/**
 * Controller: clientController.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles all client-facing operations for the TigerTix system,
 *   including retrieving event listings, processing ticket purchases,
 *   and coordinating with the LLM-driven booking microservice.
 *
 * Endpoints:
 *   GET  /api/events              → listEvents()
 *   POST /api/events/:id/purchase → purchaseEvent()
 *   POST /api/events/llm-book     → llmBookEvent()  ← NEW
 *
 * Dependencies:
 *   - clientModel.js (handles database operations)
 *   - LLM microservice (http://localhost:6002)
 *
 * Standards Addressed:
 *   - Comprehensive documentation and inline comments
 *   - Robust error handling
 *   - Clear variable naming
 *   - Consistent async/await I/O management
 * ---------------------------------------------------------
 */

const axios = require("axios");
const { purchaseTicket, getAllEvents } = require("../models/clientModel");

/**
 * @function listEvents
 * @description Retrieves all events from the database and returns them to the client.
 *
 * @route GET /api/events
 * @returns {JSON} 200 OK with list of events, or 500 on server error.
 */
exports.listEvents = async (req, res) => {
  try {
    const events = await getAllEvents();
    return res.status(200).json(events);
  } catch (err) {
    console.error("[ClientController] Error listing events:", err);
    return res.status(500).json({
      error: "An internal server error occurred while retrieving events.",
    });
  }
};

/**
 * @function purchaseEvent
 * @description Handles direct ticket purchase requests for a specific event.
 *
 * @route POST /api/events/:id/purchase
 * @returns {JSON} 200 OK on success, or an appropriate error status on failure.
 */
exports.purchaseEvent = async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const quantity = parseInt(req.body.quantity || 1, 10);

  if (Number.isNaN(eventId) || Number.isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, error: "Invalid event id or quantity" });
  }

  try {
    const result = await purchaseTicket(eventId, quantity);
    // Expect result to be an object like { success: true, remainingTickets: X } or { success: false, error: "..." }
    if (result && typeof result === "object") {
      // forward the model result as JSON
      return res.status(result.success ? 200 : 400).json(result);
    }
    // fallback
    return res.status(500).json({ success: false, error: "Unknown purchase result" });
  } catch (err) {
    console.error("[ClientController] purchase error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * @function llmBookEvent
 * @description Handles natural-language ticket booking using the LLM-driven microservice.
 *
 * Flow:
 *   1. User sends a text message describing what they want to book.
 *   2. Client service sends this to the LLM service for parsing.
 *   3. LLM returns structured intent → event + ticket count.
 *   4. Client asks for confirmation.
 *   5. On confirmation, client requests booking via LLM confirm endpoint.
 *
 * @route POST /api/events/llm-book
 * @body { message: string, confirm?: boolean, eventName?: string, tickets?: number }
 * @returns {JSON} confirmation prompt or booking result.
 *
 * @example
 * POST /api/events/llm-book
 * Body: { "message": "Book two tickets for Jazz Night" }
 * → { step: "confirmation_required", message: "Do you want to book 2 ticket(s) for Jazz Night?" }
 *
 * POST /api/events/llm-book
 * Body: { "confirm": true, "eventName": "Jazz Night", "tickets": 2 }
 * → { "message": "Successfully booked 2 ticket(s) for Jazz Night" }
 */
exports.llmBookEvent = async (req, res) => {
  try {
    const { message, confirm, eventName, tickets } = req.body;
    console.log("[ClientController] Received LLM booking request:", req.body);

    // Step 1: If confirmation not yet given, ask LLM to parse the natural-language message.
    if (!confirm) {
      if (!message) {
        return res.status(400).json({ error: "Missing 'message' field." });
      }

      const llmResponse = await axios.post(
        "http://localhost:6002/api/llm/parse",
        { text: message }
      );

      const parsed = llmResponse.data.parsed;

      if (!parsed || !parsed.event || !parsed.tickets) {
        return res.status(422).json({
          error: "Could not extract booking details. Try rephrasing your request.",
        });
      }

      // Ask frontend to confirm booking
      return res.status(200).json({
        step: "confirmation_required",
        message: `Do you want to book ${parsed.tickets} ticket(s) for ${parsed.event}?`,
        proposedBooking: parsed,
      });
    }

    // Step 2: If user confirmed, ask LLM service to perform the booking
    if (confirm) {
      if (!eventName || !tickets) {
        return res.status(400).json({
          error: "Missing eventName or tickets in confirmation request.",
        });
      }

      const confirmRes = await axios.post(
        "http://localhost:6002/api/llm/confirm",
        { eventName, tickets }
      );

      return res.status(200).json({
        message: confirmRes.data.message,
        event: confirmRes.data.eventName,
        purchased: confirmRes.data.purchased,
      });
    }
  } catch (err) {
    console.error("[ClientController] Error in LLM-driven booking:", err.message);
    return res.status(500).json({
      error: "An error occurred while processing your LLM booking request.",
    });
  }
};