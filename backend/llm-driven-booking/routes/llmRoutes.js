const express = require("express");
const router = express.Router();
const llmController = require("../controllers/llmController");

// Route for parsing natural language booking requests
router.post("/parse", llmController.parseBookingRequest);

// Route for confirming bookings (after user confirmation)
router.post("/confirm", llmController.confirmBooking);

module.exports = router;