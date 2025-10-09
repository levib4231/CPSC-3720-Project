const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Connect to SQLite shared database
const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("[ClientModel]: Error opening database:", err.message);
    } else {
        console.log("[ClientModel]: Connected to database:", dbPath);
        // Enable foreign keys for this connection 
        db.run("PRAGMA foreign_keys = ON");
    }
});

/**
 * Retrieves all events from the database
 * @returns {Promise<Array>} Array of event objects 
 */
exports.getAllEvents = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM events ORDER BY date ASC", [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

/**
 * Purchases a ticker for an event using atomic transaction to prevent overselling
 * uses optimistic locking pattern with conditional update 
 * @param (number} eventID - The event ID
 * @returns {Promise<Object>} Purchase result )
 */
exports.purchaseTicket = (eventId) => {
  return new Promise((resolve, reject) => {
    // Begin transaction (serialize ensures sequential execution)
    db.serialize(() => {
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          return reject(err);
        }

        // First checks if the event exists and has tickets available
        db.get(
          "SELECT id, name, tickets FROM events WHERE id = ?",
          [eventId],
          (err, row) => {
            if (err) {
              // Rollback on error
              db.run("ROLLBACK");
              return reject(err);
            }

            if (!row) {
              db.run("ROLLBACK");
              return reject(new Error("EVENT_NOT_FOUND"));
            }

            if (row.tickets <= 0) {
              db.run("ROLLBACK");
              return reject(new Error("SOLD_OUT"));
            }

            // Atomically decrement tickets_available with a conditional update
            // Ensures we only update if tickets are still available
            db.run(
              `UPDATE events 
               SET tickets = tickets - 1 
               WHERE id = ? AND tickets > 0`,
              [eventId],
              function (err) {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }

                // Checks if the update affected any rows
                if (this.changes === 0) {
                  // Race condition: tickets sold out between check and update
                  db.run("ROLLBACK");
                  return reject(new Error("SOLD_OUT_RACE"));
                }

                // Commit the transaction
                db.run("COMMIT", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                  }

                  resolve({
                    success: true,
                    eventId: eventId,
                    eventName: row.name,
                    remainingTickets: row.tickets - 1,
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