import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

type SavingSummary = {
  totalGroupSavings: string
  members: {
    id: string
    name: string
    memberNumber: string
    totalSaved: string
  }[]
}

type Member = {
    id: string;
    name: string;
    memberNumber: string;
    phone: string;
    nationalId: string;
    role: string;
}

type OverviewProps = {
    members: Member[];
    summary: SavingSummary | null;
    isLoading: boolean;
    alert: string | null;
}

export function Overview({ members, summary, isLoading, alert }: OverviewProps) {
    return (
        <>
            {alert && <div className="alert">{alert}</div>}
            <section className="summary-grid">
                <article className="card">
                    <header>
                        <h2>Group savings</h2>
                        <span className="status">Live</span>
                    </header>
                    <p className="metric">
                        {summary?.totalGroupSavings ? `KSh ${summary.totalGroupSavings}` : '--'}
                    </p>
                    <p className="muted">Across all registered members</p>
                </article>
                <article className="card">
                    <header>
                        <h2>Members</h2>
                    </header>
                    <p className="metric">{members.length}</p>
                    <p className="muted">Currently active profiles</p>
                </article>
                <article className="card">
                    <header>
                        <h2>Average save</h2>
                    </header>
                    <p className="metric">
                        {summary?.members.length
                            ? `KSh ${(
                                summary.members.reduce((acc, member) => acc + Number(member.totalSaved), 0) /
                                summary.members.length
                            ).toFixed(2)}`
                            : '--'}
                    </p>
                    <p className="muted">Per member, simple average</p>
                </article>
            </section>

            <section className="member-table">
                <header>
                    <h3>Member Balances</h3>
                    {isLoading && <span className="muted">Refreshing data…</span>}
                </header>
                {summary?.members.length ? (
                    <div className="member-grid">
                        {summary.members.map((member) => (
                            <article key={member.id} className="member-card">
                                <div>
                                    <h4>{member.name}</h4>
                                    <p className="muted">{member.memberNumber}</p>
                                </div>
                                <p className="metric">KSh {member.totalSaved}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="muted">Register the first member to see balances.</p>
                )}
            </section>
        </>
    );
}
