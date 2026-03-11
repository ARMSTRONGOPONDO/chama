-- CreateTable
CREATE TABLE "MemberDocument" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentDocument" (
    "id" TEXT NOT NULL,
    "repaymentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepaymentDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberDocument" ADD CONSTRAINT "MemberDocument_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentDocument" ADD CONSTRAINT "RepaymentDocument_repaymentId_fkey" FOREIGN KEY ("repaymentId") REFERENCES "Repayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
