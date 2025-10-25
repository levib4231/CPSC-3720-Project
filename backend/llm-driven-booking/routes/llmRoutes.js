const express = require("express");
const router = express.Router();
const { parseBookingRequest, confirmBooking } = require("../controllers/llmController");

// Parse natural-language booking intent
router.post("/parse", parseBookingRequest);

// Confirm booking (with explicit user confirmation)
router.post("/confirm", confirmBooking);

module.exports = router;