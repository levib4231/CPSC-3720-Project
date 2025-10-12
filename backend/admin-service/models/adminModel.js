/**
 * Model: adminModel.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles all database operations related to the Admin Service.
 *   Includes functions for creating and managing event records
 *   in the shared TigerTix SQLite database.
 *
 * Database:
 *   - SQLite (shared across microservices)
 *
 * Exports:
 *   - addEvent(name, date, tickets): Adds a new event to the DB.
 * ---------------------------------------------------------
 */

const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

// ------------------------------------------------------------
// Database Initialization
// ------------------------------------------------------------

/**
 * @constant {string} dbPath
 * @description Absolute path to the shared SQLite database file.
 */
const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");

/**
 * Ensure the shared-db directory exists before connecting.
 */
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("Created shared-db folder at:", dbDir);
}

/**
 * @constant {sqlite3.Database} db
 * @description Active SQLite database connection instance.
 */
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database:", dbPath);
  }
});

/**
 * Ensure the events table exists on startup.
 * Uses idempotent table creation (safe to run multiple times).
 */
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL CHECK (date LIKE '____-__-__'),
    tickets INTEGER NOT NULL CHECK (tickets >= 0)
  )
`, (err) => {
  if (err) {
    console.error("Failed to initialize events table:", err.message);
  } else {
    console.log("Verified: 'events' table exists.");
  }
});

// ------------------------------------------------------------
// Exported Functions
// ------------------------------------------------------------

/**
 * @function addEvent
 * @description Inserts a new event record into the database.
 *
 * @param {string} name - Name of the event.
 * @param {string} date - Date of the event (ISO 8601 format, YYYY-MM-DD).
 * @param {number} tickets - Number of available tickets.
 *
 * @returns {Promise<void>} Resolves when the insert succeeds.
 * @throws {Error} Rejects with an error if the insert fails.
 *
 * @example
 * await addEvent("Clemson Concert", "2025-10-20", 100);
 */
exports.addEvent = async (name, date, tickets) => {
  return new Promise((resolve, reject) => {
    // Defensive validation inside the model (in case controller misses)
    if (!name || !date || tickets === undefined) {
      return reject(new Error("Invalid event data provided to addEvent()"));
    }

    const sql = `
      INSERT INTO events (name, date, tickets)
      VALUES (?, ?, ?)
    `;

    db.run(sql, [name, date, tickets], (err) => {
      if (err) {
        console.error("Database error in addEvent:", err.message);
        return reject(err);
      }
      console.log(`Event added: ${name} (${date}) with ${tickets} tickets`);
      resolve();
    });
  });
};

// ------------------------------------------------------------
// Optional: Graceful Shutdown Handling
// ------------------------------------------------------------

process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed cleanly.");
    }
    process.exit(0);
  });
});