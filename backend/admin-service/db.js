/**
 * @file adminDB.js
 * ---------------------------------------------------------
 * @description
 *   SQLite database connection module for the Admin Service.
 *   Provides DB initialization, path configuration, and
 *   a Promise-based close function for graceful shutdown.
 *
 * @usage
 *   const { db, close } = require('./adminDB');
 *   db.run('SELECT * FROM events', ...);
 *   await close(); // clean teardown
 * ---------------------------------------------------------
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Determine database path, with environment fallback
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "../../database.sqlite");

// Open database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("[Admin DB] Failed to open database:", err.message);
  } else {
    console.log("[Admin DB] Database opened:", DB_PATH);
  }
});

/**
 * @function close
 * @description Closes the SQLite connection gracefully.
 * @returns {Promise<void>} Resolves when closed successfully.
 */
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("[Admin DB] Error closing database:", err.message);
        return reject(err);
      }
      console.log("[Admin DB] Connection closed.");
      resolve();
    });
  });
}

module.exports = { db, close };