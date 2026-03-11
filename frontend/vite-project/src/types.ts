export type Member = {
  id: string
  memberNumber: string
  accountNumber: string
  name: string
  email: string | null
  phone: string
  nationalId: string
  role: string
  documents?: MemberDocument[];
}

export type MemberForm = {
  name: string;
  email: string;
  password?: string;
  phone: string;
  nationalId: string;
  dateJoined: string;
  memberNumber: string;
  role: string;
  documents?: FileList | null;
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

export type LoanDocument = {
  id: string;
  loanId: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export type MemberDocument = {
  id: string;
  memberId: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export type RepaymentDocument = {
  id: string;
  repaymentId: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export type Repayment = {
	id: string;
	loanId: string;
	amount: string;
	remainingBalance: string;
	paidAt: string;
	note: string | null;
	documents?: RepaymentDocument[];
}

export type Loan = {
	id: string
	member: { id: string; name: string; memberNumber: string; accountNumber: string }
	principal: string
	interestRate: string
	interestAmount: string
	totalDue: string;
	dailyRepaymentAmount: string;
	monthlyInstallment: string
	termMonths: number
	purpose: string
	status: string
	type: LoanType
	issuedAt: string
	dueDate: string
	guarantors: { id: string; name: string; memberNumber: string }[]
	repayments: Repayment[]
	totalRepaid: string
	outstanding: string
	repaymentProgress: string;
	documents: LoanDocument[];
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
    interestRate?: string;
    dailyRepaymentAmount?: string;
    documents?: FileList | null;
    issuedAt?: string;
    dueDate?: string;
}

export type Group = {
    id: string;
    name: string;
    description?: string;
    members: Member[];
    createdBy: Member;
    createdAt: string;
}

// Runtime export to ensure Vite treats this as a module
export const APP_VERSION = '1.0.0';
