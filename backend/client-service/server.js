/**
 * Server: client-service/server.js
 * ---------------------------------------------------------
 * Purpose:
 *   Entry point for the TigerTix Client Service.
 *   This microservice serves public-facing API routes that:
 *     - Retrieve event listings
 *     - Handle ticket purchase requests
 *
 * Standards Addressed:
 *   - File-level documentation
 *   - Organized middleware and route structure
 *   - Global error handling
 *   - Maintainable, consistent formatting
 * ---------------------------------------------------------
 */

const express = require("express");
const cors = require("cors");
const clientRoutes = require("./routes/clientRoutes");
const { close: closeClientDb } = require("./db"); // add or adapt to your db helper

const app = express();

app.use((req, res, next) => {
  console.log(`[client-service] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 6001;

app.use(cors());
app.use(express.json());
app.use("/api", clientRoutes);

// global error handler
app.use((err, req, res, next) => {
  console.error("[ClientService Error]", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// only listen when run directly
let serverInstance = null;
if (require.main === module) {
  serverInstance = app.listen(PORT, () => {
    console.log(`Client Service running on port ${PORT}`);
  });
}

// shutdown helper for tests
app.shutdown = async function () {
  if (serverInstance && typeof serverInstance.close === "function") {
    await new Promise((res) => serverInstance.close(res));
  }
  if (typeof closeClientDb === "function") {
    try {
      await closeClientDb();
    } catch (e) { /* ignore */ }
  }
};

module.exports = app;