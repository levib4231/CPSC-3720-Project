/**
 * Model: clientModel.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles all client-facing database operations for TigerTix.
 *   Provides read and transactional write access to the shared
 *   SQLite database that stores campus event and ticket data.
 *
 * Features:
 *   - Safe, concurrent ticket purchasing using atomic transactions.
 *   - Clean async Promise-based DB access.
 *   - Centralized DB initialization and error handling.
 *
 * Standards Addressed:
 *   - Documentation & comments for each function
 *   - Modularized structure
 *   - Robust error handling with descriptive messages
 *   - Consistent formatting and naming
 *   - Proper async input/output handling
 * ---------------------------------------------------------
 */

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// ------------------------------------------------------------
// Database Initialization
// ------------------------------------------------------------

/**
 * @constant {string} dbPath
 * @description Absolute path to the shared TigerTix SQLite database.
 */
const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");

/**
 * @constant {sqlite3.Database} db
 * @description Shared SQLite connection instance for client operations.
 */
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[ClientModel] Error opening database:", err.message);
  } else {
    console.log("[ClientModel] Connected to database:", dbPath);
    db.run("PRAGMA foreign_keys = ON");
  }
});

// ------------------------------------------------------------
// Functions
// ------------------------------------------------------------

/**
 * @function getAllEvents
 * @description Retrieves all events from the database in ascending date order.
 *
 * @returns {Promise<Array>} A promise resolving to an array of event objects.
 *
 * @example
 * const events = await getAllEvents();
 * console.log(events);
 * // → [{ id: 1, name: "Clemson Concert", date: "2025-10-20", tickets: 120 }]
 */
exports.getAllEvents = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM events ORDER BY date ASC", [], (err, rows) => {
      if (err) {
        console.error("[ClientModel] Failed to fetch events:", err.message);
        return reject(new Error("DB_READ_ERROR"));
      }
      resolve(rows);
    });
  });
};

/**
 * @function purchaseTicket
 * @description Safely purchases a ticket for an event using a serialized
 *              transaction to prevent overselling. Implements optimistic locking.
 *
 * @param {number} eventId - The event ID to purchase a ticket for.
 * @returns {Promise<Object>} A promise resolving to purchase details:
 *   {
 *     success: true,
 *     eventId: number,
 *     eventName: string,
 *     remainingTickets: number
 *   }
 *
 * @throws {Error} Possible errors:
 *   - EVENT_NOT_FOUND: No matching event ID found
 *   - SOLD_OUT: No tickets available
 *   - SOLD_OUT_RACE: Tickets sold out during transaction
 *   - DB_TRANSACTION_ERROR: Database or transaction error
 *
 * @example
 * const result = await purchaseTicket(5);
 * console.log(result.remainingTickets);
 */
exports.purchaseTicket = (eventId) => {
  return new Promise((resolve, reject) => {
    // Input validation (defensive)
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return reject(new Error("INVALID_EVENT_ID"));
    }

    // Run transaction inside serialized context to prevent race conditions
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (beginErr) => {
        if (beginErr) {
          console.error("[ClientModel] Failed to begin transaction:", beginErr.message);
          return reject(new Error("DB_TRANSACTION_ERROR"));
        }

        // Step 1: Fetch event info
        db.get(
          "SELECT id, name, tickets FROM events WHERE id = ?",
          [eventId],
          (selectErr, eventRow) => {
            if (selectErr) {
              db.run("ROLLBACK");
              console.error("[ClientModel] Select failed:", selectErr.message);
              return reject(new Error("DB_READ_ERROR"));
            }

            if (!eventRow) {
              db.run("ROLLBACK");
              return reject(new Error("EVENT_NOT_FOUND"));
            }

            if (eventRow.tickets <= 0) {
              db.run("ROLLBACK");
              return reject(new Error("SOLD_OUT"));
            }

            // Step 2: Conditional update to prevent overselling
            db.run(
              `UPDATE events
               SET tickets = tickets - 1
               WHERE id = ? AND tickets > 0`,
              [eventId],
              function (updateErr) {
                if (updateErr) {
                  db.run("ROLLBACK");
                  console.error("[ClientModel] Update failed:", updateErr.message);
                  return reject(new Error("DB_WRITE_ERROR"));
                }

                // Step 3: Check if row was updated (race-condition protection)
                if (this.changes === 0) {
                  db.run("ROLLBACK");
                  return reject(new Error("SOLD_OUT_RACE"));
                }

                // Step 4: Commit transaction
                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    db.run("ROLLBACK");
                    console.error("[ClientModel] Commit failed:", commitErr.message);
                    return reject(new Error("DB_TRANSACTION_ERROR"));
                  }

                  console.log(`[ClientModel] Ticket purchased for '${eventRow.name}'`);

                  resolve({
                    success: true,
                    eventId: eventRow.id,
                    eventName: eventRow.name,
                    remainingTickets: eventRow.tickets - 1,
                  });
                });
              }
            );
          }
        );
      });
    });
  });
};

// ------------------------------------------------------------
// Graceful Shutdown Handling
// ------------------------------------------------------------
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("[ClientModel] Error closing database:", err.message);
    } else {
      console.log("[ClientModel] Database connection closed.");
    }
    process.exit(0);
  });
});