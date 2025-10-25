/**
 * Router: clientRoutes.js
 * ---------------------------------------------------------
 * Purpose:
 *   Defines all HTTP routes for the TigerTix Client Service.
 *   These routes handle public (non-admin) operations such as:
 *   - Viewing available events
 *   - Purchasing event tickets
 *   - Booking tickets using natural language (LLM integration)
 *
 * Standards Addressed:
 *   - File and route-level documentation
 *   - Consistent error-safe structure
 *   - RESTful API conventions
 *   - Clear mapping to controller functions
 * ---------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const {
  listEvents,
  purchaseEvent,
  llmBookEvent, // ← Added new controller method
} = require("../controllers/clientController");

/**
 * @route   GET /api/events
 * @desc    Retrieves a list of all available events (public endpoint).
 * @access  Public
 * @returns {Array<Object>} Array of event objects:
 *   [
 *     { id: 1, name: "TigerFest", date: "2025-10-15", tickets: 120 },
 *     { id: 2, name: "Homecoming Game", date: "2025-11-02", tickets: 85 }
 *   ]
 *
 * @example
 * // Example request:
 * GET /api/events
 */
router.get("/events", listEvents);

/**
 * @route   POST /api/events/:id/purchase
 * @desc    Purchases a ticket for a specific event ID.
 * @access  Public
 * @param   {number} id - Event ID parameter in the URL
 * @returns {Object} Confirmation message:
 *   {
 *     message: "Ticket purchased successfully",
 *     event: "TigerFest",
 *     remainingTickets: 84
 *   }
 *
 * @example
 * // Example request:
 * POST /api/events/2/purchase
 */
router.post("/events/:id/purchase", purchaseEvent);

/**
 * @route   POST /api/events/llm-book
 * @desc    Handles natural-language ticket booking using the LLM microservice.
 * @access  Public
 *
 * @body
 *   {string} message  - User input like "Book two tickets for Jazz Night"
 *   {boolean} [confirm] - Whether the user confirmed the suggested booking
 *   {string} [eventName] - Event name to confirm booking
 *   {number} [tickets] - Number of tickets to confirm booking
 *
 * @returns {Object} Dynamic response based on step:
 *   - Step 1 (parse): { step: "confirmation_required", proposedBooking: {...} }
 *   - Step 2 (confirm): { message: "Successfully booked 2 ticket(s) for Jazz Night" }
 *
 * @example
 * // Step 1: Parse request
 * POST /api/events/llm-book
 * Body: { "message": "Book two tickets for Jazz Night" }
 *
 * // Step 2: Confirm booking
 * POST /api/events/llm-book
 * Body: { "confirm": true, "eventName": "Jazz Night", "tickets": 2 }
 */
router.post("/events/llm-book", llmBookEvent);

// ------------------------------------------------------------
// Export router
// ------------------------------------------------------------
module.exports = router;