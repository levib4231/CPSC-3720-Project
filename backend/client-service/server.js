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

const app = express();
const PORT = process.env.PORT || 6001;

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------

// Enables CORS for cross-origin requests (e.g., frontend → backend)
app.use(cors());

// Parses incoming JSON request bodies
app.use(express.json());

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------

// Mount all client-facing routes (events, purchases)
app.use("/api", clientRoutes);

// ------------------------------------------------------------
// Global Error Handler
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[ClientService Error]", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ------------------------------------------------------------
// Server Startup
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Client Service running on port ${PORT}`);
});