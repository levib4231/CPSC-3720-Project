const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../shared-db/database.sqlite");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("Created shared-db folder at:", dbDir);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to database:", dbPath);
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    tickets INTEGER NOT NULL
  )
`);

exports.addEvent = (name, date, tickets) => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)",
      [name, date, tickets],
      (err) => (err ? reject(err) : resolve())
    );
  });
};
