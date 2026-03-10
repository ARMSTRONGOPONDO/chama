const express = require("express");
const { prisma } = require("../lib/prismaClient"); // Import prisma
const router = express.Router();

router.post("/login", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const member = await prisma.member.findUnique({
      where: { email: email },
    });

    if (!member) {
      return res.status(401).json({ error: "Invalid Email Address." });
    }

    // Return the member object (In production, use JWT)
    res.json(member);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An unexpected error occurred during login." });
  }
});

module.exports = router;
