import { API_BASE } from '../config';
import type { Member, Loan, LoanForm } from '../types';
import { useState } from 'react';

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
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredLoans = loans.filter(loan => 
        loan.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <article className="card form-card">
                <h3>Create Loan</h3>
                <form onSubmit={handleLoanSubmit} className="form-stack">
                    <label>
                        Member
                        <select
                            value={loanForm.memberId}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setLoanForm((prev: any) => ({ ...prev, memberId: event.target.value }))}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label>
                            Principal amount
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={loanForm.principal}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLoanForm((prev: any) => ({ ...prev, principal: event.target.value }))}
                                required
                            />
                        </label>
                        <label>
                            Interest Rate (%)
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={(loanForm as any).interestRate || ''}
                                placeholder="Default (10% or 12%)"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLoanForm((prev: any) => ({ ...prev, interestRate: event.target.value }))}
                            />
                        </label>
                    </div>
                    <label>
                        Purpose
                        <input
                            value={loanForm.purpose}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLoanForm((prev: any) => ({ ...prev, purpose: event.target.value }))}
                            required
                            minLength={3}
                        />
                    </label>
                    <label>
                        Loan type
                        <select
                            value={loanForm.type}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                setLoanForm((prev: any) => ({
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
                    
                    {loanForm.type === 'SIX_MONTH' && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Guarantors:</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border-soft)', borderRadius: '0.5rem' }}>
                                {members
                                    .filter((m) => m.id !== loanForm.memberId)
                                    .map((member) => {
                                        const isSelected = loanForm.guarantorIds.includes(member.id);
                                        return (
                                            <div 
                                                key={member.id}
                                                onClick={() => {
                                                    setLoanForm((prev: any) => {
                                                        const alreadySelected = prev.guarantorIds.includes(member.id);
                                                        return {
                                                            ...prev,
                                                            guarantorIds: alreadySelected
                                                                ? prev.guarantorIds.filter((id: string) => id !== member.id)
                                                                : [...prev.guarantorIds, member.id],
                                                        };
                                                    });
                                                }}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    padding: '0.5rem 1rem', 
                                                    borderBottom: '1px solid var(--color-border-soft)',
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? 'var(--color-gray-soft)' : 'transparent',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <input type="checkbox" checked={isSelected} readOnly style={{ width: 'auto', marginRight: '0.75rem' }} />
                                                <span>{member.name} ({member.memberNumber})</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    <label style={{ marginTop: '0.5rem' }}>
                        Supporting Documents
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                setLoanForm((prev: any) => ({ ...prev, documents: event.target.files }));
                            }}
                        />
                    </label>
                    <button type="submit">Create Loan Application</button>
                </form>
            </article>

            <article className="card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Issued Loans</h3>
                    <input 
                        type="text" 
                        placeholder="Search by name or purpose..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-soft)', width: '250px' }}
                    />
                </div>
                
                {isLoansLoading ? (
                    <p className="muted">Refreshing loans…</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-soft)' }}>
                                <th style={{ padding: '0.75rem' }}>Member</th>
                                <th style={{ padding: '0.75rem' }}>Financials</th>
                                <th style={{ padding: '0.75rem' }}>Status & Workflow</th>
                                <th style={{ padding: '0.75rem' }}>Documents</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLoans.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }} className="muted">No loans found matching "{searchTerm}"</td></tr>
                            ) : (
                                filteredLoans.map((loan) => (
                                    <tr key={loan.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 600 }}>{loan.member.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{loan.member.memberNumber}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>"{loan.purpose}"</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 700 }}>KSh {loan.principal}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Rate: {loan.interestRate}%</div>
                                            <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>O/S: KSh {loan.outstanding}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ marginBottom: '0.25rem' }}>
                                                <span className="loan-pill" style={{ 
                                                    backgroundColor: loan.status === 'APPROVED' ? '#dcfce7' : loan.status === 'REJECTED' ? '#fee2e2' : '#fef9c3',
                                                    color: loan.status === 'APPROVED' ? '#166534' : loan.status === 'REJECTED' ? '#991b1b' : '#854d0e',
                                                    borderColor: 'transparent'
                                                }}>
                                                    {loan.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                                Off: {loan.officer?.memberNumber || 'N/A'}<br/>
                                                Ver: {loan.verifiedBy?.memberNumber || 'N/A'}<br/>
                                                App: {loan.approvedBy?.memberNumber || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                {loan.documents && loan.documents.length > 0 ? (
                                                    loan.documents.map(doc => (
                                                        <a key={doc.id} href={`${API_BASE}/api/loans/documents/${doc.url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                                                            {doc.name.length > 15 ? doc.name.substring(0, 12) + '...' : doc.name}
                                                        </a>
                                                    ))
                                                ) : <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>None</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                {loan.status === 'PENDING' && currentUser?.role === 'VERIFIER' && (
                                                    <button onClick={() => handleVerifyLoan(loan.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>Verify</button>
                                                )}
                                                {loan.status === 'VERIFIED' && currentUser?.role === 'APPROVER' && (
                                                    <button onClick={() => handleApproveLoan(loan.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#16a34a' }}>Approve</button>
                                                )}
                                                {(loan.status === 'PENDING' || loan.status === 'VERIFIED') && (currentUser?.role === 'VERIFIER' || currentUser?.role === 'APPROVER') && (
                                                    <button onClick={() => handleRejectLoan(loan.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#dc2626' }}>Reject</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </article>
        </div>
    );
}
