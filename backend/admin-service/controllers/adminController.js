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

const { addEvent } = require("../models/adminModel");

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
  try {
    const { name, date, tickets } = req.body;

    // --- Input Validation ---
    if (!name || !date || tickets === undefined) {
      return res.status(400).json({
        error: "Missing required event data: name, date, and tickets are mandatory.",
      });
    }

    // Validate ticket count and date format (basic check)
    if (typeof tickets !== "number" || tickets < 0) {
      return res.status(400).json({ error: "Tickets must be a non-negative number." });
    }

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(date)) {
      return res.status(400).json({
        error: "Date must be in ISO 8601 format (YYYY-MM-DD).",
      });
    }

    // --- Database Operation ---
    await addEvent(name, date, tickets);

    return res.status(201).json({
      message: `Event '${name}' created successfully.`,
    });
  } catch (err) {
    console.error("Error in createEvent:", err);

    return res.status(500).json({
      error: "An internal server error occurred while creating the event.",
    });
  }
};