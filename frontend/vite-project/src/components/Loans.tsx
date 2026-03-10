import { API_BASE } from '../config';
import type { Member, Loan, LoanForm } from '../types';

type LoansProps = {
    members: Member[];
    loans: Loan[];
    isLoansLoading: boolean;
    loanForm: LoanForm;
    setLoanForm: React.Dispatch<React.SetStateAction<LoanForm>>;
    handleLoanSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    refreshLoans: () => Promise<void>;
    currentUser: Member | null;
    setAlert: React.Dispatch<React.SetStateAction<string | null>>;
};

export function Loans({
    members,
    loans,
    isLoansLoading,
    loanForm,
    setLoanForm,
    handleLoanSubmit,
    refreshLoans,
    currentUser,
    setAlert,
}: LoansProps) {
    const handleVerifyLoan = async (loanId: string) => {
        if (!currentUser || currentUser.role !== 'VERIFIER') {
            setAlert('Only verifiers can verify loans.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/loans/${loanId}/verify`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser.id}` },
            });
            if (!response.ok) {
                throw new Error('Failed to verify loan');
            }
            refreshLoans();
            setAlert('Loan verified successfully.');
        } catch (error) {
            console.error(error);
            setAlert('Failed to verify loan.');
        }
    };

    const handleApproveLoan = async (loanId: string) => {
        if (!currentUser || currentUser.role !== 'APPROVER') {
            setAlert('Only approvers can approve loans.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/loans/${loanId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser.id}` },
            });
            if (!response.ok) {
                throw new Error('Failed to approve loan');
            }
            refreshLoans();
            setAlert('Loan approved successfully.');
        } catch (error) {
            console.error(error);
            setAlert('Failed to approve loan.');
        }
    };

    const handleRejectLoan = async (loanId: string) => {
        if (!currentUser || (currentUser.role !== 'VERIFIER' && currentUser.role !== 'APPROVER')) {
            setAlert('Only verifiers or approvers can reject loans.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/loans/${loanId}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser.id}` },
            });
            if (!response.ok) {
                throw new Error('Failed to reject loan');
            }
            refreshLoans();
            setAlert('Loan rejected successfully.');
        } catch (error) {
            console.error(error);
            setAlert('Failed to reject loan.');
        }
    };


    return (
        <>
            <section className="loan-form-grid">
                <article className="card form-card">
                    <h3>Create Loan</h3>
                    <form onSubmit={handleLoanSubmit} className="form-stack">
                        <label>
                            Member
                            <select
                                value={loanForm.memberId}
                                onChange={(event) => setLoanForm((prev) => ({ ...prev, memberId: event.target.value }))}
                                required
                            >
                                <option value="" disabled>
                                    Select a member
                                </option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} ({member.memberNumber})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Principal amount
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={loanForm.principal}
                                onChange={(event) => setLoanForm((prev) => ({ ...prev, principal: event.target.value }))}
                                required
                            />
                        </label>
                        <label>
                            Purpose
                            <input
                                value={loanForm.purpose}
                                onChange={(event) => setLoanForm((prev) => ({ ...prev, purpose: event.target.value }))}
                                required
                                minLength={3}
                            />
                        </label>
                        <label>
                            Loan type
                            <select
                                value={loanForm.type}
                                onChange={(event) =>
                                    setLoanForm((prev) => ({
                                        ...prev,
                                        type: event.target.value as any,
                                        guarantorIds: event.target.value === 'SIX_MONTH' ? prev.guarantorIds : [],
                                    }))
                                }
                            >
                                <option value="SHORT_TERM">Short term (30 days)</option>
                                <option value="SIX_MONTH">Six month (with guarantors)</option>
                            </select>
                        </label>
                        <button type="submit">Create loan</button>
                    </form>
                </article>
                {loanForm.type === 'SIX_MONTH' && (
                    <article className="card form-card">
                        <h3>Select guarantors</h3>
                        <p className="muted">Choose one or more members to act as guarantors.</p>
                        <p className="guarantor-hint">
                            Click a member card below to toggle them as a guarantor. Selected cards are highlighted.
                            Currently selected: {loanForm.guarantorIds.length}
                        </p>
                        <div className="member-list guarantor-list">
                            {members
                                .filter((m) => m.id !== loanForm.memberId)
                                .map((member) => {
                                    const isSelected = loanForm.guarantorIds.includes(member.id);
                                    return (
                                        <button
                                            key={member.id}
                                            type="button"
                                            className={`member-list-item ${isSelected ? 'active' : ''}`}
                                            onClick={() => {
                                                setLoanForm((prev) => {
                                                    const alreadySelected = prev.guarantorIds.includes(member.id);
                                                    return {
                                                        ...prev,
                                                        guarantorIds: alreadySelected
                                                            ? prev.guarantorIds.filter((id) => id !== member.id)
                                                            : [...prev.guarantorIds, member.id],
                                                    };
                                                });
                                            }}
                                        >
                                            <div className="member-list-main">
                                                <span className="member-list-name">{member.name}</span>
                                                <span className="member-list-number">{member.memberNumber}</span>
                                            </div>
                                            <div className="member-list-meta">
                                                <span>{member.phone}</span>
                                                <span>{member.nationalId}</span>
                                                {isSelected && <span className="guarantor-badge">Selected</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </article>
                )}
            </section>

            <section className="loan-table">
                <header>
                    <h3>Issued Loans</h3>
                    {isLoansLoading && <span className="muted">Refreshing loans…</span>}
                </header>
                {loans.length === 0 ? (
                    <p className="muted">No loans recorded yet.</p>
                ) : (
                    <div className="loan-grid">
                        {loans.map((loan) => (
                            <article key={loan.id} className="loan-card">
                                <div className="loan-card-main">
                                    <div>
                                        <h4>{loan.member.name}</h4>
                                        <p className="muted">{loan.member.memberNumber}</p>
                                    </div>
                                    <div className="loan-amounts">
                                        <p className="metric">KSh {loan.principal}</p>
                                        <p className="muted">Outstanding: KSh {loan.outstanding}</p>
                                    </div>
                                </div>
                                <div className="loan-card-meta">
                                    <span className="loan-pill loan-pill-type">
                                        {loan.type === 'SHORT_TERM' ? 'Short term' : 'Six month'}
                                    </span>
                                    <span className="loan-pill loan-pill-status">{loan.status}</span>
                                    <span className="loan-pill">Term: {loan.termMonths} mo</span>
                                    {loan.officer && <span className="loan-pill">Officer: {loan.officer.memberNumber}</span>}
                                    {loan.verifiedBy && <span className="loan-pill">Verified: {loan.verifiedBy.memberNumber}</span>}
                                    {loan.approvedBy && <span className="loan-pill">Approved: {loan.approvedBy.memberNumber}</span>}
                                </div>
                                {loan.guarantors.length > 0 && (
                                    <div className="loan-guarantors">
                                        <span className="muted">Guarantors:</span>
                                        <div className="loan-guarantor-chips">
                                            {loan.guarantors.map((g) => (
                                                <span key={g.id} className="loan-guarantor-chip">
                                                    {g.name} ({g.memberNumber})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="loan-actions">
                                    {loan.status === 'PENDING' && currentUser?.role === 'VERIFIER' && (
                                        <button onClick={() => handleVerifyLoan(loan.id)}>Verify</button>
                                    )}
                                    {loan.status === 'VERIFIED' && currentUser?.role === 'APPROVER' && (
                                        <>
                                            <button onClick={() => handleApproveLoan(loan.id)}>Approve</button>
                                            <button onClick={() => handleRejectLoan(loan.id)}>Reject</button>
                                        </>
                                    )}
                                    {(loan.status === 'PENDING' || loan.status === 'VERIFIED') && (currentUser?.role === 'VERIFIER' || currentUser?.role === 'APPROVER') && (
                                        <button onClick={() => handleRejectLoan(loan.id)}>Reject</button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
