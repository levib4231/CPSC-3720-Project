const express = require("express");
const app = express();
const adminRoutes = require("./routes/adminRoutes");

app.use(express.json());
app.use("/api/admin", adminRoutes);

app.listen(5001, () => console.log("Admin service running on port 5001"));