import { useState, useMemo } from 'react';
import { API_BASE } from '../config';
import type { Member, Loan } from '../types';
import { Calendar } from './Calendar';
import type { DayStatus } from './Calendar';

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
    const [repaymentFiles, setRepaymentFiles] = useState<FileList | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedLoanForCalendar, setSelectedLoanForCalendar] = useState<Loan | null>(null);

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
            const formData = new FormData();
            formData.append('amount', repaymentAmount);
            formData.append('note', repaymentNote);
            
            if (repaymentFiles) {
                for (let i = 0; i < repaymentFiles.length; i++) {
                    formData.append('documents', repaymentFiles[i]);
                }
            }

            const response = await fetch(`${API_BASE}/api/loans/${loanId}/repayments`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${currentUser?.id}`
                },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to record repayment');
            }

            setAlert('Repayment recorded successfully.');
            setRepaymentAmount('');
            setRepaymentNote('');
            setRepaymentFiles(null);
            await refreshLoans();
            
            if (selectedLoanForCalendar && selectedLoanForCalendar.id === loanId) {
                const updated = loans.find(l => l.id === loanId);
                if (updated) setSelectedLoanForCalendar(updated);
            }
        } catch (error: any) {
            console.error(error);
            setAlert(error.message || 'Failed to record repayment.');
        } finally {
            setProcessingId(null);
        }
    };

    const calendarData = useMemo(() => {
        if (!selectedLoanForCalendar) return { statuses: {}, summary: null };

        const statuses: Record<string, DayStatus> = {};
        const startDate = new Date(selectedLoanForCalendar.issuedAt);
        const endDate = new Date(selectedLoanForCalendar.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const repayments = selectedLoanForCalendar.repayments || [];
        const dailyRequired = Number(selectedLoanForCalendar.dailyRepaymentAmount);

        let current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        
        let missedCount = 0;
        let nextPaymentDate: Date | null = null;

        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            
            const paidOnDay = repayments
                .filter(r => new Date(r.paidAt).toISOString().split('T')[0] === dateStr)
                .reduce((sum, r) => sum + Number(r.amount), 0);

            if (current < today) {
                if (paidOnDay >= dailyRequired) {
                    statuses[dateStr] = 'paid';
                } else if (paidOnDay > 0) {
                    statuses[dateStr] = 'late';
                } else {
                    statuses[dateStr] = 'missed';
                    missedCount++;
                }
            } else if (current.getTime() === today.getTime()) {
                if (paidOnDay >= dailyRequired) {
                    statuses[dateStr] = 'paid';
                } else {
                    statuses[dateStr] = 'today';
                    if (!nextPaymentDate) nextPaymentDate = new Date(current);
                }
            } else {
                statuses[dateStr] = 'upcoming';
                if (!nextPaymentDate && !statuses[dateStr]) nextPaymentDate = new Date(current);
            }

            current.setDate(current.getDate() + 1);
        }

        return { 
            statuses, 
            summary: {
                missedCount,
                nextPaymentDate: nextPaymentDate?.toLocaleDateString() || 'Loan Completed'
            } 
        };
    }, [selectedLoanForCalendar]);

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
                                <th style={{ padding: '0.75rem' }}>Overview</th>
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
                                            <button 
                                                onClick={() => setSelectedLoanForCalendar(loan)}
                                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', marginTop: '0.4rem', background: '#f3f4f6', color: 'var(--color-primary)', border: '1px solid var(--color-border-soft)' }}
                                            >
                                                📅 View Calendar
                                            </button>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>Due: <b>KSh {loan.totalDue}</b></div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>Daily: KSh {loan.dailyRepaymentAmount}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>Paid: KSh {loan.totalRepaid}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 700 }}>Bal: KSh {loan.outstanding}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                                                <div style={{ width: `${loan.repaymentProgress}%`, height: '100%', background: '#7c3aed' }}></div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{loan.repaymentProgress}%</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Amount" 
                                                        style={{ width: '90px', padding: '0.3rem', fontSize: '0.85rem' }}
                                                        onBlur={(e) => setRepaymentAmount(e.target.value)}
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
                                                    type="file" 
                                                    multiple 
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    style={{ width: '165px', fontSize: '0.65rem' }}
                                                    onChange={(e) => setRepaymentFiles(e.target.files)}
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

            {selectedLoanForCalendar && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                    <article className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'white', position: 'relative' }}>
                        <button 
                            onClick={() => setSelectedLoanForCalendar(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ✕
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Repayment Tracking: {selectedLoanForCalendar.member.name}</h3>
                                <p className="muted" style={{ fontSize: '0.85rem' }}>
                                    Loan Type: <b>{selectedLoanForCalendar.type}</b> | 
                                    Principal: <b>KSh {selectedLoanForCalendar.principal}</b>
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>KSh {selectedLoanForCalendar.totalRepaid}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Remaining</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>KSh {selectedLoanForCalendar.outstanding}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Recent History & Receipts</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedLoanForCalendar.repayments?.slice(0, 5).map(r => (
                                            <div key={r.id} style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{new Date(r.paidAt).toLocaleDateString()}</span>
                                                    <span style={{ fontWeight: 600, color: '#059669' }}>+KSh {r.amount}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    {r.documents?.map(doc => (
                                                        <a key={doc.id} href={`${API_BASE}/api/loans/documents/${doc.url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                                                            View Receipt 📄
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedLoanForCalendar.repayments || selectedLoanForCalendar.repayments.length === 0) && (
                                            <p className="muted" style={{ fontSize: '0.8rem' }}>No payments recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                                <Calendar 
                                    selectedDate={new Date()} 
                                    dayStatuses={calendarData.statuses}
                                    mode="status"
                                />
                            </div>
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}
