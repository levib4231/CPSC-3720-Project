/**
 * @file clientDB.js
 * ---------------------------------------------------------
 * @description
 *   SQLite database connection module for the Client Service.
 *   Handles DB initialization, shared-path configuration, and
 *   graceful shutdown for clean test and runtime operations.
 *
 * @usage
 *   const { db, close } = require('./clientDB');
 *   db.run('SELECT * FROM events', ...);
 *   await close(); // graceful teardown
 * ---------------------------------------------------------
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Determine which DB file to use
const DB_PATH = path.join(__dirname, "../shared-db/database.sqlite");

// Initialize and open the database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("[Client DB] Failed to open database:", err.message);
  } else {
    console.log("[Client DB] Database opened successfully:", DB_PATH);
  }
});

/**
 * @function close
 * @description Closes the active SQLite connection gracefully.
 * @returns {Promise<void>} Resolves when closed successfully.
 */
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("[Client DB] Error closing DB:", err.message);
        return reject(err);
      }
      console.log("[Client DB] Connection closed.");
      resolve();
    });
  });
}

module.exports = { db, close };