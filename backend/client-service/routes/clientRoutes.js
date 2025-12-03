const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

/**
 * @constant {string} dbPath
 * @description Absolute path to the shared TigerTix SQLite database.
 *
 * In production (Railway), the project is mounted at /app, so this resolves to:
 *   /app/backend/shared-db/database.sqlite
 * We proactively create the parent directory if it does not exist so that
 * SQLite can create the file instead of failing with SQLITE_CANTOPEN.
 */
const dbDir = path.resolve(__dirname, "../../shared-db");
if (!fs.existsSync(dbDir)) {
  console.warn("[ClientModel] DB directory missing, creating:", dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, "database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[ClientModel] Failed to connect to database:", err.message);
  } else {
    console.log("[ClientModel] Connected to database:", dbPath);
    db.run("PRAGMA foreign_keys = ON");

    // Optional safety: ensure the events table exists so listEvents doesn't fail
    db.run(
      `CREATE TABLE IF NOT EXISTS events (
         id INTEGER PRIMARY KEY,
         name TEXT NOT NULL,
         date TEXT NOT NULL,
         tickets INTEGER NOT NULL
       )`,
      (tableErr) => {
        if (tableErr) {
          console.error("[ClientModel] Failed to ensure events table exists:", tableErr.message);
        } else {
          console.log("[ClientModel] Events table is ready.");
        }
      }
    );
  }
});

module.exports = db;