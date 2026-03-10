const express = require("express");
const { z } = require("zod");
const { prisma, Prisma } = require("../lib/prismaClient");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const memberSchema = z.object({
  name: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")), // Allow optional or empty string
  phone: z.string().min(8),
  nationalId: z.string().min(6),
  dateJoined: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  memberNumber: z.string().min(3),
  role: z.enum(["ADMIN", "TREASURER", "MEMBER", "OFFICER", "VERIFIER", "APPROVER"]).optional(),
});

router.post("/", requireRole("ADMIN"), async (req, res) => {
  console.log("POST /api/members - body:", req.body);
  const parseResult = memberSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors });
  }

  try {
    const { role, email, ...memberData } = parseResult.data;
    const member = await prisma.member.create({
      data: {
        ...memberData,
        email: email && email.trim() !== "" ? email.trim() : null, // Convert empty or whitespace strings to null
        dateJoined: new Date(memberData.dateJoined),
        role: role || "MEMBER",
      },
    });
    console.log("Created member:", member);
    res.status(201).json(member);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(400).json({ error: "Member number, phone, or national ID already exists" });
    }
    console.error("Failed to create member", error);
    res.status(500).json({ error: "Unable to create member" });
  }
});

router.put("/:id/role", requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !z.enum(["ADMIN", "TREASURER", "MEMBER", "OFFICER", "VERIFIER", "APPROVER"]).safeParse(role).success) {
    return res.status(400).json({ error: "Invalid role provided." });
  }

  try {
    const updatedMember = await prisma.member.update({
      where: { id },
      data: { role },
    });
    res.json(updatedMember);
  } catch (error) {
    console.error("Failed to update member role", error);
    res.status(500).json({ error: "Unable to update member role." });
  }
});

router.get("/", async (req, res) => {
  const members = await prisma.member.findMany({
    include: { savings: true, loans: true },
  });
  res.json(members);
});

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params;

  try {
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    if (member.role === "ADMIN") {
      return res.status(403).json({ error: "Protection: Admin accounts cannot be deleted." });
    }

    await prisma.member.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete member:", error);
    res.status(500).json({ error: "Unable to delete member. They may have active loans or savings records." });
  }
});

module.exports = router;
