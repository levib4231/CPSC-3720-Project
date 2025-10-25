const express = require("express");
const cors = require("cors");
const llmRoutes = require("./routes/llmRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/llm", llmRoutes);

const PORT = process.env.PORT || 6002;
app.listen(PORT, () => console.log(`[LLM Service] Running on port ${PORT}`));