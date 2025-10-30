const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../database.sqlite");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("[Admin DB] Failed to open DB:", err);
  } else {
    console.log("[Admin DB] Opened:", DB_PATH);
  }
});

function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("[Admin DB] Error closing DB:", err);
        return reject(err);
      }
      console.log("[Admin DB] Closed.");
      resolve();
    });
  });
}

module.exports = { db, close };