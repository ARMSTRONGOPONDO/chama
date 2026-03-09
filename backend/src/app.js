const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const memberRoutes = require("./routes/members");
const authRoutes = require("./routes/auth");
const savingsRoutes = require("./routes/savings");
const { attachMember } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(attachMember);

app.use("/api/members", memberRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/savings", savingsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
