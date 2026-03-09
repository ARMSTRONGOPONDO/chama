const express = require("express");
const { z } = require("zod");
const { prisma, Prisma } = require("../lib/prismaClient");

const router = express.Router();

const memberSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(8),
  nationalId: z.string().min(6),
  dateJoined: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  memberNumber: z.string().min(3),
});

router.post("/", async (req, res) => {
  const parseResult = memberSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors });
  }

  try {
    const member = await prisma.member.create({ data: parseResult.data });
    res.status(201).json(member);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: "Member data violates uniqueness" });
    }
    res.status(500).json({ error: "Unable to create member" });
  }
});

router.get("/", async (req, res) => {
  const members = await prisma.member.findMany({
    include: { savings: true, loans: true },
  });
  res.json(members);
});

module.exports = router;
