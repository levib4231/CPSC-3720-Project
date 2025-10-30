/**
 * Server: admin-service/server.js
 * ---------------------------------------------------------
 * Purpose:
 *   Entry point for the TigerTix Admin Service.
 *   This microservice handles administrative operations such as:
 *     - Creating new events
 *     - (Future) Updating or deleting existing events
 *
 * Standards Addressed:
 *   - Proper middleware setup (CORS, JSON parsing)
 *   - Modular route integration
 *   - Error handling and startup logging
 *   - Code readability and consistent formatting
 * ---------------------------------------------------------
 */

const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const { close: closeAdminDb } = require("./db"); // new

const app = express();
const PORT = process.env.PORT || 5001;

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse incoming JSON requests

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
app.use("/api/admin", adminRoutes);

// ------------------------------------------------------------
// Global Error Handler (optional but recommended)
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[AdminService Error]", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ------------------------------------------------------------
// Server Initialization
// ------------------------------------------------------------
let serverInstance = null;
if (require.main === module) {
  serverInstance = app.listen(PORT, () => {
    console.log(`Admin Service running on port ${PORT}`);
  });
}

// Export app and a shutdown function for tests
app.shutdown = async function () {
  // close HTTP server if started
  if (serverInstance && typeof serverInstance.close === "function") {
    await new Promise((res) => serverInstance.close(res));
  }
  // close DB
  try {
    await closeAdminDb();
  } catch (e) {
    // ignore close errors in tests
  }
};

module.exports = app;