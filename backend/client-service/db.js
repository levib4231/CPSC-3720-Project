const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../shared-db/database.sqlite");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("[Client DB] Failed to open DB:", err);
  } else {
    console.log("[Client DB] Opened:", DB_PATH);
  }
});

function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("[Client DB] Error closing DB:", err);
        return reject(err);
      }
      console.log("[Client DB] Closed.");
      resolve();
    });
  });
}

module.exports = { db, close };