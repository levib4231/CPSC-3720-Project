/**
 * @file concurrency.test.js
 * ---------------------------------------------------------
 * @description
 *   Integration test for verifying transactional safety and
 *   concurrency handling in the Client Service.
 *
 *   Ensures that when multiple concurrent purchase requests
 *   are made against the same event, the system does not
 *   oversell tickets and updates database state consistently.
 *
 * Dependencies:
 *   - supertest: for HTTP integration testing.
 *   - sqlite3: for temporary DB isolation.
 *   - fs, path: for filesystem manipulation of test DB.
 *
 * Test Strategy:
 *   1. Clone the shared SQLite DB into a temp file.
 *   2. Point process.env.DB_PATH to the temp file so that
 *      the tested service operates on isolated data.
 *   3. Insert a known test event with fixed ticket count.
 *   4. Fire multiple concurrent POST /purchase requests.
 *   5. Verify that:
 *        - total successful purchases ≤ initial tickets
 *        - DB reflects the correct remaining ticket count
 * ---------------------------------------------------------
 */

jest.setTimeout(20000);

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const request = require("supertest");
const app = require("../server");

// --- Paths for shared and temp DBs ---
const SRC_DB = path.join(__dirname, "..", "..", "shared-db", "database.sqlite");
const TEMP_DB = path.join(__dirname, "..", "temp-test-db.sqlite");

/**
 * @function runSql
 * @description Executes a non-select SQL statement (e.g., INSERT, UPDATE).
 * @param {string} dbPath - Path to SQLite database file.
 * @param {string} sql - SQL query string to execute.
 * @param {Array} [params=[]] - Optional parameter array.
 * @returns {Promise<Object>} Resolves with run context on success.
 */
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

/**
 * @function getRow
 * @description Retrieves a single row result from the database.
 * @param {string} dbPath - Path to SQLite database file.
 * @param {string} sql - SQL query string to execute.
 * @param {Array} [params=[]] - Optional parameter array.
 * @returns {Promise<Object|null>} The resulting row, or null if none found.
 */
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

// --- Prepare temp DB ---
try {
  if (fs.existsSync(TEMP_DB)) fs.unlinkSync(TEMP_DB);
} catch (e) {
  console.warn("[ConcurrencyTest] Could not clear old temp DB:", e.message);
}
fs.copyFileSync(SRC_DB, TEMP_DB);

// Ensure the service uses this temp DB
process.env.DB_PATH = TEMP_DB;

/**
 * @test
 * @description
 *   Verifies that concurrent ticket purchases never exceed
 *   available inventory and maintain consistent database state.
 */
describe("Client Service concurrency integration", () => {
  const EVENT_ID = 9999;
  const INITIAL_TICKETS = 5;

  beforeAll(async () => {
    // Ensure a clean test event row exists
    await runSql(TEMP_DB, "DELETE FROM events WHERE id = ?", [EVENT_ID]).catch(() => {});
    await runSql(
      TEMP_DB,
      "INSERT INTO events (id, name, date, tickets) VALUES (?, ?, ?, ?)",
      [EVENT_ID, "Concurrency Test", "2025-10-30", INITIAL_TICKETS]
    );
  });

  afterAll(async () => {
    // Graceful shutdown of app and temp DB cleanup
    if (app && typeof app.shutdown === "function") {
      await app.shutdown();
    }
    try {
      fs.unlinkSync(TEMP_DB);
    } catch (e) {
      console.warn("[ConcurrencyTest] Temp DB cleanup failed:", e.message);
    }
  });

  test("concurrent purchases do not oversell (transactional safety)", async () => {
    const CONCURRENT_REQUESTS = 10; // More than initial stock to stress-test concurrency

    // --- Execute concurrent purchase requests ---
    const results = await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }).map(() =>
        request(app)
          .post(`/api/events/${EVENT_ID}/purchase`)
          .send({ quantity: 1 })
      )
    );

    // --- Count successful transactions ---
    const successes = results.filter(
      (r) => r.status === 200 && r.body && (r.body.success === true || r.body.success === "true")
    ).length;

    // --- Verify DB consistency ---
    const row = await getRow(TEMP_DB, "SELECT tickets FROM events WHERE id = ?", [EVENT_ID]);
    const remaining = row ? Number(row.tickets) : null;

    // --- Assertions ---
    expect(successes).toBeLessThanOrEqual(INITIAL_TICKETS);
    expect(remaining).not.toBeNull();
    expect(remaining).toBe(INITIAL_TICKETS - successes);
  });
});