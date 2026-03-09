const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
