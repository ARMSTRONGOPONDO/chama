export interface Member {
  id: string
  memberNumber: string
  name: string
  email: string | null
  phone: string
  nationalId: string
  role: string
}

export interface MemberForm {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  dateJoined: string;
  memberNumber: string;
  role: string;
}

export interface SavingSummary {
  totalGroupSavings: string
  members: {
    id: string
    name: string
    memberNumber: string
    totalSaved: string
  }[]
}

export type LoanType = 'SHORT_TERM' | 'SIX_MONTH'

export interface Loan {
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

export interface LoanForm {
    memberId: string;
    principal: string;
    purpose: string;
    type: LoanType;
    guarantorIds: string[];
}

// Dummy constant to ensure the module is treated as a runtime module by Vite/ESM
export const VERSION = '1.0.0';
