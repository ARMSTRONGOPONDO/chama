const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prismaClient");
const { requireRole } = require("../middleware/auth");
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

const baseLoanSchema = z.object({
	memberId: z.string().min(1),
	principal: z.preprocess((val) => Number(val), z.number().positive()),
	purpose: z.string().min(3),
	interestRate: z.preprocess((val) => (val ? Number(val) : undefined), z.number().positive().optional()),
	dailyRepaymentAmount: z.preprocess((val) => (val ? Number(val) : undefined), z.number().positive().optional()),
	issuedAt: z.string().optional(),
	dueDate: z.string().optional(),
});

const shortTermLoanSchema = baseLoanSchema.extend({
	type: z.literal("SHORT_TERM"),
});

const sixMonthLoanSchema = baseLoanSchema.extend({
	type: z.literal("SIX_MONTH"),
	guarantorIds: z.preprocess((val) => {
		if (typeof val === "string") return JSON.parse(val);
		return val;
	}, z.array(z.string().min(1)).min(1)),
});

const createLoanSchema = z.discriminatedUnion("type", [shortTermLoanSchema, sixMonthLoanSchema]);

router.get("/", async (req, res) => {
	try {
		const loans = await prisma.loan.findMany({
			include: {
				member: {
					select: { id: true, name: true, memberNumber: true, accountNumber: true },
				},
				guarantors: {
					include: {
						member: { select: { id: true, name: true, memberNumber: true } },
					},
				},
				repayments: {
					orderBy: { paidAt: "desc" }
				},
				documents: true,
				officer: { select: { id: true, name: true, memberNumber: true } },
				verifiedBy: { select: { id: true, name: true, memberNumber: true } },
				approvedBy: { select: { id: true, name: true, memberNumber: true } },
			},
			orderBy: { issuedAt: "desc" },
		});

		const shaped = loans.map((loan) => {
			const principalNum = Number(loan.principal ?? 0);
			const interestNum = Number(loan.interestAmount ?? 0);
			const totalRepaid = loan.repayments.reduce((sum, repayment) => sum + Number(repayment.amount ?? 0), 0);
			const totalDue = principalNum + interestNum;
			const outstanding = Math.max(totalDue - totalRepaid, 0);

			return {
				id: loan.id,
				member: loan.member,
				principal: principalNum.toFixed(2),
				interestAmount: interestNum.toFixed(2),
				interestRate: Number(loan.interestRate ?? 0).toFixed(2),
				totalDue: totalDue.toFixed(2),
				dailyRepaymentAmount: Number(loan.dailyRepaymentAmount ?? 0).toFixed(2),
				monthlyInstallment: Number(loan.monthlyInstallment ?? 0).toFixed(2),
				termMonths: loan.termMonths,
				purpose: loan.purpose,
				status: loan.status,
				type: loan.type,
				issuedAt: loan.issuedAt,
				dueDate: loan.dueDate,
				guarantors: loan.guarantors.map((g) => g.member),
				repayments: loan.repayments,
				documents: loan.documents,
				totalRepaid: totalRepaid.toFixed(2),
				outstanding: outstanding.toFixed(2),
				repaymentProgress: totalDue > 0 ? ((totalRepaid / totalDue) * 100).toFixed(1) : "0.0",
				officer: loan.officer,
				verifiedBy: loan.verifiedBy,
				approvedBy: loan.approvedBy,
			};
		});

		res.json(shaped);
	} catch (error) {
		console.error("Failed to list loans", error);
		res.status(500).json({ error: "Unable to load loans" });
	}
});

router.post("/", requireRole("OFFICER"), upload.array("documents", 5), async (req, res) => {
	try {
		const parsed = createLoanSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({ errors: parsed.error.errors });
		}

		const { 
            memberId, principal, purpose, type, 
            interestRate: customRate, 
            dailyRepaymentAmount: customDaily,
            issuedAt: customIssuedAt,
            dueDate: customDueDate
        } = parsed.data;

		const interestRate = customRate ?? (type === "SHORT_TERM" ? 10 : 12);
		const termMonths = type === "SHORT_TERM" ? 1 : 6;
		const interestAmount = (Number(principal) * interestRate) / 100;
		const totalDue = Number(principal) + interestAmount;
		const monthlyInstallment = totalDue / termMonths;
		
        const issuedAt = customIssuedAt ? new Date(customIssuedAt) : new Date();
        let dueDate;
        if (customDueDate) {
            dueDate = new Date(customDueDate);
        } else {
            dueDate = new Date(issuedAt);
            if (type === "SHORT_TERM") {
                dueDate.setDate(dueDate.getDate() + 30);
            } else {
                dueDate.setMonth(dueDate.getMonth() + 6);
            }
        }

        // Calculate days for daily repayment
        const diffTime = Math.abs(dueDate.getTime() - issuedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
		
		// Auto-calculate daily if not provided
		const dailyRepaymentAmount = customDaily ?? (totalDue / diffDays);

		const loan = await prisma.$transaction(async (tx) => {
			const createdLoan = await tx.loan.create({
				data: {
					memberId,
					principal: principal.toFixed(2),
					interestRate,
					interestAmount: interestAmount.toFixed(2),
					monthlyInstallment: monthlyInstallment.toFixed(2),
					dailyRepaymentAmount: dailyRepaymentAmount.toFixed(2),
					termMonths,
					purpose,
					type,
					issuedAt,
					dueDate,
					status: "PENDING",
					officerId: req.user.id,
				},
			});

			if (type === "SIX_MONTH") {
				const { guarantorIds } = parsed.data;
				if (guarantorIds?.length) {
					await tx.loanGuarantor.createMany({
						data: guarantorIds.map((gid) => ({
							loanId: createdLoan.id,
							memberId: gid,
						})),
						skipDuplicates: true,
					});
				}
			}

			if (req.files && req.files.length > 0) {
				await tx.loanDocument.createMany({
					data: req.files.map((file) => ({
						loanId: createdLoan.id,
						name: file.originalname,
						url: file.filename,
						type: file.mimetype,
					})),
				});
			}

			return createdLoan;
		});

		res.status(201).json(loan);
	} catch (error) {
		console.error("Failed to create loan", error);
		res.status(500).json({ error: "Unable to create loan" });
	}
});

// Record a repayment
router.post("/:id/repayments", async (req, res) => {
	const { id } = req.params;
	const { amount, note } = req.body;

	if (!amount || Number(amount) <= 0) {
		return res.status(400).json({ error: "Invalid repayment amount" });
	}

	try {
		const loan = await prisma.loan.findUnique({
			where: { id },
			include: { repayments: true }
		});

		if (!loan) return res.status(404).json({ error: "Loan not found" });

		const totalRepaidBefore = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
		const totalDue = Number(loan.principal) + Number(loan.interestAmount);
		const amountNum = Number(amount);
		const remainingBalance = Math.max(totalDue - (totalRepaidBefore + amountNum), 0);

		const repayment = await prisma.$transaction(async (tx) => {
			const r = await tx.repayment.create({
				data: {
					loanId: id,
					amount: amountNum.toFixed(2),
					remainingBalance: remainingBalance.toFixed(2),
					note: note || `Daily repayment`
				}
			});

			// If fully repaid, update status
			if (remainingBalance <= 0) {
				await tx.loan.update({
					where: { id },
					data: { status: "PAID" }
				});
			}

			return r;
		});

		res.status(201).json(repayment);
	} catch (error) {
		console.error("Repayment error:", error);
		res.status(500).json({ error: "Failed to record repayment" });
	}
});

// Route to serve files
router.get("/documents/:filename", (req, res) => {
	const filename = req.params.filename;
	const filepath = path.join(__dirname, "../../uploads", filename);
	if (fs.existsSync(filepath)) {
		res.sendFile(filepath);
	} else {
		res.status(404).json({ error: "File not found" });
	}
});

router.put("/:id/verify", requireRole("VERIFIER"), async (req, res) => {
	const { id } = req.params;
	try {
		const loan = await prisma.loan.update({
			where: { id },
			data: {
				status: "VERIFIED",
				verifiedById: req.user.id,
			},
		});
		res.json(loan);
	} catch (error) {
		console.error("Failed to verify loan", error);
		res.status(500).json({ error: "Unable to verify loan" });
	}
});

router.put("/:id/approve", requireRole("APPROVER"), async (req, res) => {
	const { id } = req.params;
	try {
		const loan = await prisma.loan.update({
			where: { id },
			data: {
				status: "APPROVED",
				approvedById: req.user.id,
			},
		});
		res.json(loan);
	} catch (error) {
		console.error("Failed to approve loan", error);
		res.status(500).json({ error: "Unable to approve loan" });
	}
});

router.put("/:id/reject", requireRole(["VERIFIER", "APPROVER"]), async (req, res) => {
	const { id } = req.params;
	try {
		const loan = await prisma.loan.update({
			where: { id },
			data: {
				status: "REJECTED",
			},
		});
		res.json(loan);
	} catch (error) {
		console.error("Failed to reject loan", error);
		res.status(500).json({ error: "Unable to reject loan" });
	}
});

module.exports = router;
