import type { Member, SavingSummary } from '../types';
import { useState } from 'react';

type OverviewProps = {
    members: Member[];
    summary: SavingSummary | null;
    isLoading: boolean;
}

export function Overview({ members, summary, isLoading }: OverviewProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBalances = summary?.members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section className="summary-grid">
                <article className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="muted" style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Group Savings</div>
                    <p className="metric" style={{ margin: '0.5rem 0', color: '#065f46' }}>
                        {summary?.totalGroupSavings ? `KSh ${summary.totalGroupSavings}` : 'KSh 0.00'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="status" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>Active</span>
                        <span className="muted" style={{ fontSize: '0.7rem' }}>Cumulative balance</span>
                    </div>
                </article>

                <article className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="muted" style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Members</div>
                    <p className="metric" style={{ margin: '0.5rem 0', color: '#1e40af' }}>{members.length}</p>
                    <div className="muted" style={{ fontSize: '0.7rem' }}>Active profiles in system</div>
                </article>

                <article className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="muted" style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Savings</div>
                    <p className="metric" style={{ margin: '0.5rem 0', color: '#92400e' }}>
                        {summary?.members.length
                            ? `KSh ${(
                                summary.members.reduce((acc, member) => acc + Number(member.totalSaved), 0) /
                                summary.members.length
                            ).toFixed(2)}`
                            : 'KSh 0.00'}
                    </p>
                    <div className="muted" style={{ fontSize: '0.7rem' }}>Contribution per member</div>
                </article>
            </section>

            <section className="card" style={{ padding: '1.5rem', maxWidth: '100%', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Member Balances</h3>
                        <p className="muted" style={{ margin: '0.25rem 0 0' }}>Detailed breakdown of individual contributions</p>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Filter by name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-soft)', width: '250px' }}
                    />
                </div>

                {isLoading ? (
                    <p className="muted">Refreshing data…</p>
                ) : !summary?.members.length ? (
                    <p className="muted" style={{ textAlign: 'center', padding: '2rem' }}>Register the first member to see balances.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-soft)' }}>
                                <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Member</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Account Details</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>Total Saved</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBalances.length === 0 ? (
                                <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }} className="muted">No matches for "{searchTerm}"</td></tr>
                            ) : (
                                filteredBalances.map((member) => {
                                    const fullMember = members.find(m => m.id === member.id);
                                    return (
                                        <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontWeight: 600 }}>{member.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {member.memberNumber}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Acc: {fullMember?.accountNumber || 'N/A'}</div>
                                                <span className="loan-pill" style={{ fontSize: '0.65rem' }}>{fullMember?.role || 'MEMBER'}</span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#059669' }}>KSh {member.totalSaved}</div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
