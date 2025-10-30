jest.setTimeout(20000);

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Copy shared DB to a temp DB and point the service to it so tests don't mutate main DB
const SRC_DB = path.join(__dirname, "..", "..", "shared-db", "database.sqlite");
const TEMP_DB = path.join(__dirname, "..", "temp-test-db.sqlite");

// ensure a clean temp DB
try { if (fs.existsSync(TEMP_DB)) fs.unlinkSync(TEMP_DB); } catch (e) {}
fs.copyFileSync(SRC_DB, TEMP_DB);

// Make the server pick up the test DB before requiring it
process.env.DB_PATH = TEMP_DB;

const request = require("supertest");
const app = require("../server");

async function runSql(dbPath, sql, params = []) {
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      db.close();
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function getRow(dbPath, sql, params = []) {
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row);
    });
  });
}

describe("Client Service concurrency integration", () => {
  const EVENT_ID = 9999;
  const INITIAL_TICKETS = 5;

  beforeAll(async () => {
    // Ensure event row exists with known ticket count.
    // Use DELETE then INSERT to be robust to existing rows.
    await runSql(TEMP_DB, "DELETE FROM events WHERE id = ?", [EVENT_ID]).catch(() => {});
    // Adjust this INSERT to match your schema if column names differ.
    await runSql(
      TEMP_DB,
      "INSERT INTO events (id, name, date, tickets) VALUES (?, ?, ?, ?)",
      [EVENT_ID, "Concurrency Test", "2025-10-30", INITIAL_TICKETS]
    );
  });

  afterAll(async () => {
    // Shutdown the app so Jest can exit cleanly
    if (app && typeof app.shutdown === "function") {
      await app.shutdown();
    }
    // remove temp DB
    try { fs.unlinkSync(TEMP_DB); } catch (e) {}
  });

  test("concurrent purchases do not oversell (transactional safety)", async () => {
    const CONCURRENT_REQUESTS = 10; // more than INITIAL_TICKETS to test oversell protection

    const promises = Array.from({ length: CONCURRENT_REQUESTS }).map(() =>
      request(app)
        .post(`/api/events/${EVENT_ID}/purchase`)
        .send({ quantity: 1 })
    );

    const results = await Promise.all(promises);

    // Count successful purchases (assumes successful purchase returns status 200 and body.success === true)
    const successes = results.filter(
      (r) => r.status === 200 && r.body && (r.body.success === true || r.body.success === "true")
    ).length;

    // Read remaining tickets from temp DB
    const row = await getRow(TEMP_DB, "SELECT tickets FROM events WHERE id = ?", [EVENT_ID]);
    const remaining = row ? Number(row.tickets) : null;

    // Assertions:
    // - successes should not exceed initial tickets
    // - remaining should equal initial - successes
    expect(successes).toBeLessThanOrEqual(INITIAL_TICKETS);
    expect(remaining).not.toBeNull();
    expect(remaining).toBe(INITIAL_TICKETS - successes);
  });
});