/**
 * @file setup.js
 * ---------------------------------------------------------
 * @description
 *   Initializes the shared SQLite database for the project.
 *   - Ensures `database.sqlite` exists
 *   - Verifies or creates the "events" table
 *   - Optionally loads schema from `init.sql` if present
 *
 * Usage:
 *   node setup.js
 * ---------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Paths to database and schema
const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");
const sqlPath = path.resolve(__dirname, "../../shared-db/init.sql");

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[DB Setup] Failed to open DB:", err.message);
    process.exit(1);
  }
  console.log("[DB Setup] Opened database:", dbPath);
});

// Serialize ensures commands execute in order
db.serialize(() => {
  console.log("[DB Setup] Checking database structure...");

  if (fs.existsSync(sqlPath)) {
    const schema = fs.readFileSync(sqlPath, "utf8");
    db.exec(schema, (err) => {
      if (err) console.error("[DB Setup] Error running schema:", err.message);
      else console.log("[DB Setup] Database schema verified or created.");
    });
  } else {
    console.warn("[DB Setup] init.sql not found — skipping schema creation.");
  }
});

// Close DB when done
db.close((err) => {
  if (err) console.error("[DB Setup] Error closing DB:", err.message);
  else console.log("[DB Setup] Database connection closed.");
});