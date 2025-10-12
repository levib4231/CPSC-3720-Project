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
app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});