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
const { parseTextToBooking } = require("../services/llmParser");

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
    // Delegate parsing to LLM service
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