const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prismaClient");

const router = express.Router();

const savingSchema = z.object({
  memberId: z.string().min(1),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
  month: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  transactionReference: z.string().optional(),
  note: z.string().max(280).optional(),
});

router.post("/", async (req, res) => {
  const parsed = savingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  try {
    const saving = await prisma.saving.create({
      data: {
        memberId: parsed.data.memberId,
        amount: parsed.data.amount.toFixed(2),
        month: new Date(parsed.data.month),
        transactionReference: parsed.data.transactionReference,
        note: parsed.data.note,
      },
    });

    res.status(201).json(saving);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to record saving" });
  }
});

router.get("/summary", async (req, res) => {
  const [totalSavingsData, members] = await Promise.all([
    prisma.saving.aggregate({ _sum: { amount: true } }),
    prisma.member.findMany({
      select: {
        id: true,
        name: true,
        memberNumber: true,
        savings: { select: { amount: true } },
      },
    }),
  ]);

  const formatter = (value) => Number(value ?? 0).toFixed(2);

  const memberSummaries = members.map((member) => {
    const totalSaved = member.savings.reduce((sum, saving) => sum + Number(saving.amount), 0);
    return {
      id: member.id,
      name: member.name,
      memberNumber: member.memberNumber,
      totalSaved: totalSaved.toFixed(2),
    };
  });

  res.json({
    totalGroupSavings: formatter(totalSavingsData._sum.amount),
    members: memberSummaries,
  });
});

module.exports = router;
