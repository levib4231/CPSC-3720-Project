const express = require("express");
const router = express.Router();
const llmController = require("../controllers/llmController");

// Existing specialized routes
router.post("/parse", llmController.parseBookingRequest);
router.post("/confirm", llmController.confirmBooking);

module.exports = router;