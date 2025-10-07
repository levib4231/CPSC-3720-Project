const { addEvent } = require("../models/adminModel");

exports.createEvent = async (req, res) => {
  try {
    const { name, date, tickets } = req.body;
    if (!name || !date || !tickets) {
      return res.status(400).json({ error: "Missing event data" });
    }
    await addEvent(name, date, tickets);
    res.status(201).json({ message: "Event created successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
