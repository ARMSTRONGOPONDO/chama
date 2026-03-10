const express = require("express");
const { prisma } = require("../lib/prismaClient");
const bcrypt = require("bcrypt");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Identifier and password are required." });
  }

  try {
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { email: identifier },
          { accountNumber: identifier }
        ]
      },
    });

    if (!member) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // In production, don't return the password field
    const { password: _, ...memberWithoutPassword } = member;
    res.json(memberWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An unexpected error occurred during login." });
  }
});

module.exports = router;
