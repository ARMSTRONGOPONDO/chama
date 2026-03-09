const express = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prismaClient");

const router = express.Router();

const baseLoanSchema = z.object({
	memberId: z.string().min(1),
	principal: z.preprocess((val) => Number(val), z.number().positive()),
	purpose: z.string().min(3),
});

const shortTermLoanSchema = baseLoanSchema.extend({
	type: z.literal("SHORT_TERM"),
});

const sixMonthLoanSchema = baseLoanSchema.extend({
	type: z.literal("SIX_MONTH"),
	guarantorIds: z.array(z.string().min(1)).min(1),
});

const createLoanSchema = z.discriminatedUnion("type", [shortTermLoanSchema, sixMonthLoanSchema]);

router.get("/", async (req, res) => {
	try {
		const loans = await prisma.loan.findMany({
			include: {
				member: {
					select: { id: true, name: true, memberNumber: true },
				},
				guarantors: {
					include: {
						member: { select: { id: true, name: true, memberNumber: true } },
					},
				},
				repayments: true,
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
				monthlyInstallment: Number(loan.monthlyInstallment ?? 0).toFixed(2),
				termMonths: loan.termMonths,
				purpose: loan.purpose,
				status: loan.status,
				type: loan.type,
				issuedAt: loan.issuedAt,
				dueDate: loan.dueDate,
				guarantors: loan.guarantors.map((g) => g.member),
				repayments: loan.repayments,
				totalRepaid: totalRepaid.toFixed(2),
				outstanding: outstanding.toFixed(2),
			};
		});

		res.json(shaped);
	} catch (error) {
		console.error("Failed to list loans", error);
		res.status(500).json({ error: "Unable to load loans" });
	}
});

router.post("/", async (req, res) => {
	const parsed = createLoanSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ errors: parsed.error.errors });
	}

	try {
		const { memberId, principal, purpose, type } = parsed.data;

		// basic interest / terms
		const interestRate = type === "SHORT_TERM" ? 10 : 12; // percent
		const termMonths = type === "SHORT_TERM" ? 1 : 6;
		const interestAmount = (Number(principal) * interestRate) / 100;
		const monthlyInstallment = (Number(principal) + interestAmount) / termMonths;

		const issuedAt = new Date();
		const dueDate = new Date(issuedAt);
		if (type === "SHORT_TERM") {
			// 30 days from now
			dueDate.setDate(dueDate.getDate() + 30);
		} else {
			// 6 months from now
			dueDate.setMonth(dueDate.getMonth() + 6);
		}

		const loan = await prisma.$transaction(async (tx) => {
			const createdLoan = await tx.loan.create({
				data: {
					memberId,
					principal: principal.toFixed(2),
					interestRate,
					interestAmount: interestAmount.toFixed(2),
					monthlyInstallment: monthlyInstallment.toFixed(2),
					termMonths,
					purpose,
					type,
					issuedAt,
					dueDate,
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

			return createdLoan;
		});

		res.status(201).json(loan);
	} catch (error) {
		console.error("Failed to create loan", error);
		res.status(500).json({ error: "Unable to create loan" });
	}
});

module.exports = router;
