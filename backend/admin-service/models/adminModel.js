const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("../shared-db/database.sqlite");

exports.addEvent = (name, date, tickets) => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO events (name, date, tickets) VALUES (?, ?, ?)",
      [name, date, tickets],
      (err) => (err ? reject(err) : resolve())
    );
  });
};
