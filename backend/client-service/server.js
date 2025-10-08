const express = require("express");
const app = express();
const clientRoutes = require("./routes/clientRoutes");

app.use(express.json());
app.use("/api", clientRoutes);

app.listen(5002, () => console.log("Client service running on port 5002"));