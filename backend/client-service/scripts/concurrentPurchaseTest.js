// Run: node scripts/concurrentPurchaseTest.js
const fetch = require("node-fetch");

async function purchase(x) {
  const res = await fetch("http://localhost:6001/api/events/1/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: 1 }),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

async function main() {
  const requests = Array.from({ length: 10 }).map(() => purchase());
  const results = await Promise.all(requests);
  console.log(results);
}

main().catch(console.error);