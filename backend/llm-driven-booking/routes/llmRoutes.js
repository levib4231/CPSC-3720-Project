const express = require("express");
const router = express.Router();
const llmController = require("../controllers/llmController");

// -------------------- New default route --------------------
// Handles general chat messages from frontend
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("[llmRoutes] Received LLM booking request:", req.body);
    // Call your existing LLM parsing logic or mock a response
    const reply = await llmController.parseBookingRequest(message);
    res.json({ reply });
  } catch (err) {
    console.error("LLM error:", err);
    res.status(500).json({ reply: "Oops! Something went wrong." });
  }
});

// Existing specialized routes
router.post("/parse", llmController.parseBookingRequest);
router.post("/confirm", llmController.confirmBooking);

module.exports = router;