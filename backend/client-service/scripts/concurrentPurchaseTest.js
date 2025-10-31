/**
 * @file concurrentPurchaseTest.js
 * ---------------------------------------------------------
 * @description
 *   External concurrency smoke test for the client-service.
 *   This script simulates multiple users attempting to
 *   purchase event tickets concurrently to verify that
 *   overselling does not occur under load.
 *
 * Usage:
 *   Run with:  node scripts/concurrentPurchaseTest.js
 *
 * Requirements:
 *   - The client-service must be running locally on port 6001.
 *   - Event with ID 1 must exist in the database.
 *
 * ---------------------------------------------------------
 */

const fetch = require("node-fetch");

// --- Configurable constants ---
const BASE_URL = "http://localhost:6001";
const EVENT_ID = 1;
const REQUEST_COUNT = 10;
const QUANTITY = 1;

/**
 * @function purchase
 * @description Sends a single purchase request to the client-service API.
 * @param {number} index - Request index (for logging/debugging).
 * @returns {Promise<{status: number, body: object}>} Response object with status and parsed body.
 */
async function purchase(index) {
  try {
    const res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: QUANTITY }),
    });

    const json = await res.json().catch(() => ({}));
    return { index, status: res.status, body: json };
  } catch (err) {
    return { index, status: 0, body: { error: err.message } };
  }
}

/**
 * @function main
 * @description Executes multiple concurrent purchase requests and summarizes results.
 */
async function main() {
  console.log(`\n Running concurrency test: ${REQUEST_COUNT} parallel purchase requests\n`);

  const requests = Array.from({ length: REQUEST_COUNT }).map((_, i) => purchase(i + 1));
  const results = await Promise.all(requests);

  const successes = results.filter((r) => r.status === 200 && r.body?.success).length;
  const failures = results.length - successes;

  console.table(
    results.map((r) => ({
      Request: r.index,
      Status: r.status,
      Success: !!r.body?.success,
      Remaining: r.body?.remainingTickets ?? "N/A",
      Error: r.body?.error ?? "",
    }))
  );

  console.log("\n Summary:");
  console.log(` Successful purchases: ${successes}`);
  console.log(` Failed or rejected:   ${failures}`);
  console.log(`Total requests sent:    ${results.length}\n`);
}

// --- Entry point ---
main().catch((err) => {
  console.error("\n Test failed unexpectedly:", err);
  process.exit(1);
});