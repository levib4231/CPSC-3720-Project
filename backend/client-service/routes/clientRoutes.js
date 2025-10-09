const express = require("express");
const router = express.Router();
const { listEvents, purchaseEvent } = require("../controllers/clientController");

// GET /api/events - List all events 
router.get("/events", listEvents);

// POST /api/events/:id/purchase - Purchase a ticker for an event 
router.post("/events/:id/purchase", purchaseEvent);

module.exports = router;

