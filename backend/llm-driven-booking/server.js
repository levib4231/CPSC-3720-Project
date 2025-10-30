require("dotenv").config();
const express = require("express");
const cors = require("cors");
const llmRoutes = require("./routes/llmRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/llm", llmRoutes);

const PORT = process.env.PORT || 6002;

// Replace unconditional listen with conditional startup and export
if (require.main === module) {
  app.listen(PORT, () => console.log(`[LLM Service] Running on port ${PORT}`));
}

// Add a shutdown helper so tests can explicitly close resources (no-op if none)
app.shutdown = async function () {
  // If you later open DB connections or start servers here, close them.
  // Keep this function async-compatible for test usage.
  if (app.__serverInstance && typeof app.__serverInstance.close === "function") {
    await new Promise((res) => app.__serverInstance.close(res));
  }
};

module.exports = app;