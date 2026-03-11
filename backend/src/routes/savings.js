const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prismaClient");

const router = express.Router();

const savingSchema = z.object({
  memberId: z.string().min(1),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
  month: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  contributionDate: z.string().optional(),
  transactionReference: z.string().optional(),
  note: z.string().optional(),
});

router.post("/", async (req, res) => {
  const parseResult = savingSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors });
  }

  try {
    const { month, contributionDate, ...savingData } = parseResult.data;
    const saving = await prisma.saving.create({
      data: {
        ...savingData,
        month: new Date(month),
        contributionDate: contributionDate ? new Date(contributionDate) : new Date(),
      },
    });
    res.status(201).json(saving);
  } catch (error) {
    console.error("Failed to record saving", error);
    res.status(500).json({ error: "Unable to record saving" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      include: { savings: true },
    });

    const summary = {
      totalGroupSavings: members
        .reduce((sum, m) => sum + m.savings.reduce((s, sav) => s + Number(sav.amount), 0), 0)
        .toFixed(2),
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        memberNumber: m.memberNumber,
        totalSaved: m.savings.reduce((s, sav) => s + Number(sav.amount), 0).toFixed(2),
      })),
    };

    res.json(summary);
  } catch (error) {
    console.error("Failed to load summary", error);
    res.status(500).json({ error: "Unable to load summary" });
  }
});

module.exports = router;
