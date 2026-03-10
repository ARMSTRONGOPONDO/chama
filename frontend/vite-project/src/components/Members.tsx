import { useState } from 'react';
import { API_BASE } from '../config';

type Member = {
    id: string;
    memberNumber: string;
    name: string;
    email?: string | null;
    phone: string;
    nationalId: string;
    role: string;
}

type MemberForm = {
    name: string;
    email: string;
    phone: string;
    nationalId: string;
    dateJoined: string;
    memberNumber: string;
    role: string;
}

type MembersProps = {
    members: Member[];
    isLoading: boolean;
    alert: string | null;
    memberForm: MemberForm;
    setMemberForm: React.Dispatch<React.SetStateAction<MemberForm>>;
    handleMemberSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function Members({ members, isLoading, memberForm, setMemberForm, handleMemberSubmit }: MembersProps) {
    return (
        <section className="form-grid">
            <article className="card form-card">
                <h3>Register a Member</h3>
                <form onSubmit={handleMemberSubmit} className="form-stack">
                    <label>
                        Full name
                        <input
                            value={memberForm.name}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))}
                            required
                            minLength={3}
                        />
                    </label>
                    <label>
                        Email (for login)
                        <input
                            type="email"
                            value={memberForm.email}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, email: event.target.value }))}
                            placeholder="member@test.com"
                        />
                    </label>
                    <label>
                        Role
                        <select
                            value={memberForm.role}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, role: event.target.value }))}
                            required
                        >
                            <option value="MEMBER">Member</option>
                            <option value="OFFICER">Officer</option>
                            <option value="VERIFIER">Verifier</option>
                            <option value="APPROVER">Approver</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </label>
                    <label>
                        Phone
                        <input
                            value={memberForm.phone}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, phone: event.target.value }))}
                            required
                            minLength={8}
                        />
                    </label>
                    <label>
                        National ID
                        <input
                            value={memberForm.nationalId}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, nationalId: event.target.value }))}
                            required
                            minLength={6}
                        />
                    </label>
                    <label>
                        Date joined
                        <input
                            type="date"
                            value={memberForm.dateJoined}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, dateJoined: event.target.value }))}
                            required
                        />
                    </label>
                    <label>
                        Member No.
                        <input
                            value={memberForm.memberNumber}
                            onChange={(event) => setMemberForm((prev) => ({ ...prev, memberNumber: event.target.value }))}
                            required
                            minLength={3}
                        />
                    </label>
                    <button type="submit">Save member</button>
                </form>
            </article>
            <article className="card">
                <h3>Existing Members</h3>
                {isLoading ? (
                    <p className="muted">Loading members…</p>
                ) : members.length === 0 ? (
                    <p className="muted">No members registered yet.</p>
                ) : (
                    <ul className="member-list">
                        {members.map((member) => {
                            return (
                                <li key={member.id} className="member-list-item">
                                    <div className="member-list-main">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="member-list-name">{member.name}</span>
                                            <span className="loan-pill">{member.role}</span>
                                        </div>
                                        <span className="member-list-number">{member.memberNumber}</span>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>ID: {member.id}</div>
                                    </div>
                                    <div className="member-list-meta">
                                        <span>{member.email || 'No email'}</span>
                                        <span>{member.phone}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </article>
        </section>
    );
}
