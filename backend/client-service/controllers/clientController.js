/**
 * Controller: clientController.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles all client-facing operations for the TigerTix system,
 *   including retrieving event listings and processing ticket purchases.
 *
 * Endpoints:
 *   GET  /api/events              → listEvents()
 *   POST /api/events/:id/purchase → purchaseEvent()
 *
 * Dependencies:
 *   - clientModel.js (handles database operations)
 *
 * Standards Addressed:
 *   - Comprehensive documentation and inline comments
 *   - Robust error handling
 *   - Clear variable naming
 *   - Consistent async/await I/O management
 * ---------------------------------------------------------
 */

const { getAllEvents, purchaseTicket } = require("../models/clientModel");

/**
 * @function listEvents
 * @description Retrieves all events from the database and returns them to the client.
 *
 * @route GET /api/events
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 OK with a list of events, or 500 on server error.
 *
 * @example
 * GET /api/events
 * Response: [{ id: 1, name: "Clemson Concert", date: "2025-10-20", tickets: 120 }]
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
 * @description Handles ticket purchase requests for a specific event.
 *
 * @route POST /api/events/:id/purchase
 * @param {Object} req - Express request object containing event ID in URL params.
 * @param {Object} res - Express response object.
 * @returns {JSON} 200 OK on success, or an appropriate error status on failure.
 *
 * @example
 * POST /api/events/3/purchase
 * Response:
 * {
 *   "message": "Ticket purchased successfully",
 *   "event": "Clemson Homecoming Concert",
 *   "remainingTickets": 99
 * }
 */
exports.purchaseEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);

    // --- Input Validation ---
    if (isNaN(eventId) || eventId <= 0) {
      return res.status(400).json({ error: "Invalid event ID provided." });
    }

    // --- Process Purchase ---
    const result = await purchaseTicket(eventId);

    return res.status(200).json({
      message: "Ticket purchased successfully.",
      event: result.eventName,
      remainingTickets: result.remainingTickets,
    });
  } catch (err) {
    console.error("[ClientController] Error purchasing ticket:", err);

    // --- Specific Error Handling ---
    switch (err.message) {
      case "EVENT_NOT_FOUND":
        return res.status(404).json({ error: "Event not found." });
      case "SOLD_OUT":
      case "SOLD_OUT_RACE":
        return res.status(409).json({ error: "Tickets sold out." });
      default:
        return res.status(500).json({
          error: "An internal server error occurred while purchasing a ticket.",
        });
    }
  }
};