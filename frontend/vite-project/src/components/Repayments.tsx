import { useState } from 'react';
import { API_BASE } from '../config';
import type { Member, Loan } from '../types';

type RepaymentsProps = {
    loans: Loan[];
    isLoansLoading: boolean;
    currentUser: Member | null;
    refreshLoans: () => Promise<void>;
    setAlert: React.Dispatch<React.SetStateAction<string | null>>;
};

export function Repayments({
    loans,
    isLoansLoading,
    currentUser,
    refreshLoans,
    setAlert,
}: RepaymentsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [repaymentNote, setRepaymentNote] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const activeLoans = loans.filter(loan => 
        (loan.status === 'APPROVED' || loan.status === 'VERIFIED' || loan.status === 'PAID') &&
        (loan.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         loan.member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleRecordRepayment = async (loanId: string) => {
        if (!repaymentAmount || Number(repaymentAmount) <= 0) {
            setAlert("Please enter a valid amount.");
            return;
        }

        setProcessingId(loanId);
        try {
            const response = await fetch(`${API_BASE}/api/loans/${loanId}/repayments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.id}`
                },
                body: JSON.stringify({
                    amount: repaymentAmount,
                    note: repaymentNote
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to record repayment');
            }

            setAlert('Repayment recorded successfully.');
            setRepaymentAmount('');
            setRepaymentNote('');
            refreshLoans();
        } catch (error: any) {
            console.error(error);
            setAlert(error.message || 'Failed to record repayment.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <article className="card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Loan Repayments</h3>
                        <p className="muted" style={{ margin: '0.25rem 0 0' }}>Track daily payments and loan progress</p>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by member name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-soft)', width: '250px' }}
                    />
                </div>

                {isLoansLoading ? (
                    <p className="muted">Refreshing loan data…</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-soft)' }}>
                                <th style={{ padding: '0.75rem' }}>Borrower</th>
                                <th style={{ padding: '0.75rem' }}>Loan Overview</th>
                                <th style={{ padding: '0.75rem' }}>Repayment Stats</th>
                                <th style={{ padding: '0.75rem' }}>Progress</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Record Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeLoans.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }} className="muted">No active loans found matching "{searchTerm}"</td></tr>
                            ) : (
                                activeLoans.map((loan) => (
                                    <tr key={loan.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 600 }}>{loan.member.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Acc: {loan.member.accountNumber}</div>
                                            <div style={{ fontSize: '0.7rem' }}><span className="loan-pill">{loan.type}</span></div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>Principal: <b>KSh {loan.principal}</b></div>
                                            <div style={{ fontSize: '0.85rem' }}>Total Due: <b>KSh {loan.totalDue}</b></div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>Daily: KSh {loan.dailyRepaymentAmount}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>Paid: KSh {loan.totalRepaid}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 700 }}>Balance: KSh {loan.outstanding}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                                                <div style={{ width: `${loan.repaymentProgress}%`, height: '100%', background: '#7c3aed' }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{loan.repaymentProgress}% Complete</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Amount" 
                                                        style={{ width: '100px', padding: '0.3rem', fontSize: '0.85rem' }}
                                                        onChange={(e) => setRepaymentAmount(e.target.value)}
                                                        disabled={loan.status === 'PAID'}
                                                    />
                                                    <button 
                                                        onClick={() => handleRecordRepayment(loan.id)}
                                                        disabled={processingId === loan.id || loan.status === 'PAID'}
                                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                                    >
                                                        {processingId === loan.id ? '...' : 'Pay'}
                                                    </button>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Add note (optional)" 
                                                    style={{ width: '165px', padding: '0.3rem', fontSize: '0.75rem' }}
                                                    onChange={(e) => setRepaymentNote(e.target.value)}
                                                    disabled={loan.status === 'PAID'}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </article>

            {/* Repayment History would go here if needed as a separate article */}
        </div>
    );
}
