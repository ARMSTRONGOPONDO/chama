export type Member = {
  id: string
  memberNumber: string
  name: string
  email: string | null
  phone: string
  nationalId: string
  role: string
}

export type MemberForm = {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  dateJoined: string;
  memberNumber: string;
  role: string;
}

export type SavingSummary = {
  totalGroupSavings: string
  members: {
    id: string
    name: string
    memberNumber: string
    totalSaved: string
  }[]
}

export type LoanType = 'SHORT_TERM' | 'SIX_MONTH'

export type Loan = {
	id: string
	member: { id: string; name: string; memberNumber: string }
	principal: string
	interestAmount: string
	monthlyInstallment: string
	termMonths: number
	purpose: string
	status: string
	type: LoanType
	issuedAt: string
	dueDate: string
	guarantors: { id: string; name: string; memberNumber: string }[]
	repayments: { id: string; amount: string; paidAt: string; note: string | null }[]
	totalRepaid: string
	outstanding: string
	officer?: { id: string; name: string; memberNumber: string };
	verifiedBy?: { id: string; name: string; memberNumber: string };
	approvedBy?: { id: string; name: string; memberNumber: string };
}

export type LoanForm = {
    memberId: string;
    principal: string;
    purpose: string;
    type: LoanType;
    guarantorIds: string[];
}

// Runtime export to ensure Vite treats this as a module
export const APP_VERSION = '1.0.0';
