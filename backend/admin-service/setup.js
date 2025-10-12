/**
 * setup.js
 * ---------------------------------------------------------
 * Purpose:
 *   Ensures the shared SQLite database and "events" table exist.
 *   Optionally loads schema from `init.sql` if missing.
 * ---------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../../shared-db/database.sqlite");
const sqlPath = path.resolve(__dirname, "../../shared-db/init.sql");

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("Checking database structure...");

  if (fs.existsSync(sqlPath)) {
    const schema = fs.readFileSync(sqlPath, "utf8");
    db.exec(schema, (err) => {
      if (err) console.error("Error running schema:", err.message);
      else console.log("Database schema verified or created.");
    });
  } else {
    console.warn("init.sql not found — skipping schema creation.");
  }
});

db.close();