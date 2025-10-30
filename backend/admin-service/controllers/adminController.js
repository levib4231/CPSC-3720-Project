/**
 * Controller: adminController.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles admin-related HTTP requests, including creation
 *   and management of events in the TigerTix system.
 *
 * Dependencies:
 *   - adminModel.js (for database operations)
 *
 * Exports:
 *   - createEvent: Creates a new event in the database.
 * ---------------------------------------------------------
 */

const adminModel = require("../models/adminModel");

/**
 * @function createEvent
 * @description Creates a new event in the shared database.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body containing event data.
 * @param {string} req.body.name - Name of the event.
 * @param {string} req.body.date - Event date (YYYY-MM-DD format).
 * @param {number} req.body.tickets - Number of available tickets.
 *
 * @param {Object} res - Express response object.
 * @returns {JSON} 201 Created on success, or an appropriate error response.
 *
 * @sideEffects Writes a new record to the `events` table.
 */
exports.createEvent = async (req, res) => {
  const { name, date, tickets } = req.body;
  if (!name || !date || typeof tickets === "undefined") {
    return res.status(400).json({ error: "Missing name, date, or tickets" });
  }

  try {
    // adminModel.addEvent(name, date, tickets) -> returns created event or id
    const created = await adminModel.addEvent(name, date, tickets);
    return res.status(created && created.id ? 201 : 200).json(created);
  } catch (err) {
    console.error("[AdminController] createEvent error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.listEvents = async (req, res) => {
  try {
    const events = await adminModel.getAllEvents();
    return res.status(200).json(events || []);
  } catch (err) {
    console.error("[AdminController] listEvents error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};