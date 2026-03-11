const express = require("express");
const { z } = require("zod");
const { prisma, Prisma } = require("../lib/prismaClient");
const { requireRole } = require("../middleware/auth");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = path.join(__dirname, "../../uploads");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
	},
});

const upload = multer({
	storage: storage,
	fileFilter: (req, file, cb) => {
		const allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
		const ext = path.extname(file.originalname).toLowerCase();
		if (allowedTypes.includes(ext)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and images are allowed."));
		}
	},
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const memberSchema = z.object({
  name: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")), // Allow optional or empty string
  password: z.string().min(6).optional(), // Optional password field
  phone: z.string().min(8),
  nationalId: z.string().min(6),
  dateJoined: z.string().refine((val) => !Number.isNaN(Date.parse(val))),
  memberNumber: z.string().min(3),
  role: z.enum(["ADMIN", "TREASURER", "MEMBER", "OFFICER", "VERIFIER", "APPROVER"]).optional(),
});

async function generateAccountNumber() {
  let isUnique = false;
  let accNum = "";
  while (!isUnique) {
    accNum = Math.floor(10000000 + Math.random() * 90000000).toString();
    const existing = await prisma.member.findUnique({ where: { accountNumber: accNum } });
    if (!existing) isUnique = true;
  }
  return accNum;
}

router.post("/", requireRole("ADMIN"), upload.array("documents", 5), async (req, res) => {
  const parseResult = memberSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors });
  }

  try {
    const { role, email, password, ...memberData } = parseResult.data;
    const accountNumber = await generateAccountNumber();
    const hashedPassword = await bcrypt.hash(password || "123456", 10);
    
    const member = await prisma.$transaction(async (tx) => {
        const createdMember = await tx.member.create({
            data: {
                ...memberData,
                accountNumber,
                email: email && email.trim() !== "" ? email.trim() : null,
                password: hashedPassword,
                dateJoined: new Date(memberData.dateJoined),
                role: role || "MEMBER",
            },
        });

        if (req.files && req.files.length > 0) {
            await tx.memberDocument.createMany({
                data: req.files.map((file) => ({
                    memberId: createdMember.id,
                    name: file.originalname,
                    url: file.filename,
                    type: file.mimetype,
                })),
            });
        }
        return createdMember;
    });

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

// Update member profile (Admin only)
router.put("/:id", requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, nationalId, role } = req.body;

  try {
    const updated = await prisma.member.update({
      where: { id },
      data: { name, email, phone, nationalId, role }
    });
    res.json(updated);
  } catch (error) {
    console.error("Member update error:", error);
    res.status(500).json({ error: "Failed to update member details" });
  }
});

// Change password (User or Admin)
router.put("/:id/password", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Security: only self or admin
  if (req.user.id !== id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Unauthorized to change this password" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.member.update({
      where: { id },
      data: { password: hashedPassword }
    });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

router.get("/", async (req, res) => {
  const members = await prisma.member.findMany({
    include: { savings: true, loans: true, documents: true },
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
