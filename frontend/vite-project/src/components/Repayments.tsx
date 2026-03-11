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
                if (paidOnDay >= dailyRequired) statuses[dateStr] = 'paid';
                else if (paidOnDay > 0) statuses[dateStr] = 'late';
                else { statuses[dateStr] = 'missed'; missedCount++; }
            } else if (current.getTime() === today.getTime()) {
                if (paidOnDay >= dailyRequired) statuses[dateStr] = 'paid';
                else { statuses[dateStr] = 'today'; if (!nextPaymentDate) nextPaymentDate = new Date(current); }
            } else {
                statuses[dateStr] = 'upcoming';
                if (!nextPaymentDate) nextPaymentDate = new Date(current);
            }
            current.setDate(current.getDate() + 1);
        }

        return { statuses, summary: { missedCount, nextPaymentDate: nextPaymentDate?.toLocaleDateString() || 'Loan Completed' } };
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
                        placeholder="Search borrower..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-soft)', width: '250px' }}
                    />
                </div>

                {isLoansLoading ? (
                    <p className="muted">Refreshing data…</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-soft)' }}>
                                <th style={{ padding: '0.75rem' }}>Borrower</th>
                                <th style={{ padding: '0.75rem' }}>Daily Target</th>
                                <th style={{ padding: '0.75rem' }}>Stats</th>
                                <th style={{ padding: '0.75rem' }}>Progress</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Record</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeLoans.map((loan) => (
                                <tr key={loan.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 600 }}>{loan.member.name}</div>
                                        <button 
                                            onClick={() => setSelectedLoanForCalendar(loan)}
                                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', marginTop: '0.4rem', background: '#f3f4f6', border: '1px solid #e5e7eb' }}
                                        >
                                            📅 View Calendar
                                        </button>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700 }}>KSh {loan.dailyRepaymentAmount}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>Bal: KSh {loan.outstanding}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${loan.repaymentProgress}%`, height: '100%', background: '#7c3aed' }}></div>
                                        </div>
                                        <div style={{ fontSize: '0.7rem' }}>{loan.repaymentProgress}%</div>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                                            <input 
                                                type="number" 
                                                placeholder="KSh" 
                                                style={{ width: '70px', padding: '0.25rem', fontSize: '0.8rem' }}
                                                onBlur={(e) => setRepaymentAmount(e.target.value)}
                                                disabled={loan.status === 'PAID'}
                                            />
                                            <button 
                                                onClick={() => handleRecordRepayment(loan.id)}
                                                disabled={processingId === loan.id || loan.status === 'PAID'}
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                            >
                                                Pay
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </article>

            {selectedLoanForCalendar && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
                    <article className="card" style={{ width: '100%', maxWidth: '800px', background: 'white', position: 'relative', marginTop: '2rem' }}>
                        <button 
                            onClick={() => setSelectedLoanForCalendar(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', zIndex: 10 }}
                        >
                            ✕
                        </button>

                        <div className="responsive-modal-grid">
                            <div className="modal-content-left">
                                <h3 style={{ marginBottom: '0.5rem' }}>{selectedLoanForCalendar.member.name}</h3>
                                <p className="muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Repayment Health Analysis</p>

                                <div className="modal-stats-grid">
                                    <div className="modal-stat-box">
                                        <label>MISSES</label>
                                        <div className="stat-val red">{calendarData.summary?.missedCount} Days</div>
                                    </div>
                                    <div className="modal-stat-box">
                                        <label>NEXT DUE</label>
                                        <div className="stat-val blue">{calendarData.summary?.nextPaymentDate}</div>
                                    </div>
                                    <div className="modal-stat-box">
                                        <label>PAID SO FAR</label>
                                        <div className="stat-val green">KSh {selectedLoanForCalendar.totalRepaid}</div>
                                    </div>
                                    <div className="modal-stat-box">
                                        <label>REMAINING</label>
                                        <div className="stat-val orange">KSh {selectedLoanForCalendar.outstanding}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem' }}>
                                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>Recent Activity</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedLoanForCalendar.repayments?.slice(0, 3).map(r => (
                                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                                                <span style={{ fontWeight: 600 }}>{new Date(r.paidAt).toLocaleDateString()}</span>
                                                <span style={{ color: '#059669', fontWeight: 700 }}>+KSh {r.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-content-right">
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
