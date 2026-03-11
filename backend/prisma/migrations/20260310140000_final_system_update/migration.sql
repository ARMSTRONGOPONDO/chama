-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "dailyRepaymentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'temp';

-- AlterTable
ALTER TABLE "Repayment" ADD COLUMN "remainingBalance" DECIMAL(12,2);
