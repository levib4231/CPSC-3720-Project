const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const clientRoutes = require("./routes/clientRoutes");

app.use(express.json());
app.use("/api", clientRoutes);

app.listen(6001, () => console.log("Client service running on port 6001"));