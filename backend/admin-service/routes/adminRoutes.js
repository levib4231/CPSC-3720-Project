/**
 * Router: adminRoutes.js
 * ---------------------------------------------------------
 * Purpose:
 *   Defines all administrative routes for the TigerTix Admin Service.
 *   These routes allow authorized administrators to:
 *     - Create new events
 *     - (Future) Update or delete existing events
 *
 * Standards Addressed:
 *   - Function and file-level documentation
 *   - Consistent formatting and naming
 *   - Clear REST API design and modular separation
 * ---------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const { createEvent } = require("../controllers/adminController");

/**
 * @route   POST /api/admin/events
 * @desc    Creates a new event in the shared database.
 * @access  Admin (internal use)
 * @body    {string} name - Event name  
 *          {string} date - Event date (ISO 8601 format preferred)  
 *          {number} tickets - Total number of tickets available
 * @returns {Object} Success message:
 *   {
 *     message: "Event created successfully!"
 *   }
 *
 * @example
 * // Example request:
 * POST /api/admin/events
 * {
 *   "name": "TigerFest",
 *   "date": "2025-10-15",
 *   "tickets": 150
 * }
 */
router.post("/events", createEvent);

// ------------------------------------------------------------
// Export router
// ------------------------------------------------------------
module.exports = router;