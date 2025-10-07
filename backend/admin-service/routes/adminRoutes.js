const express = require("express");
const router = express.Router();
const { createEvent } = require("../controllers/adminController");

router.post("/events", createEvent);

module.exports = router;
