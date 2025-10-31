/**
 * Router: llmRoutes.js
 * ---------------------------------------------------------
 * Purpose:
 *   Defines the API routes for LLM-based booking interactions.
 *   These routes handle parsing natural-language booking requests
 *   and confirming bookings after user approval.
 *
 * Dependencies:
 *   - express: For routing HTTP requests.
 *   - llmController.js: Contains the business logic for LLM parsing
 *     and booking confirmation.
 *
 * Exports:
 *   - Express router configured with the following endpoints:
 *       POST /api/llm/parse   → llmController.parseBookingRequest
 *       POST /api/llm/confirm → llmController.confirmBooking
 * ---------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const llmController = require("../controllers/llmController");

// Route: Parse a natural-language booking request into structured info
router.post("/parse", llmController.parseBookingRequest);

// Route: Confirm and finalize a booking after user approval
router.post("/confirm", llmController.confirmBooking);

module.exports = router;