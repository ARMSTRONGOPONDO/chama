import type { Member, MemberForm } from '../types';
import { API_BASE } from '../config';
import { useState } from 'react';

type MembersProps = {
    members: Member[];
    isLoading: boolean;
    memberForm: MemberForm;
    setMemberForm: React.Dispatch<React.SetStateAction<MemberForm>>;
    handleMemberSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    currentUser: Member | null;
    refreshMembers: () => Promise<void>;
    setAlert: React.Dispatch<React.SetStateAction<string | null>>;
}

export function Members({ 
    members, 
    isLoading, 
    memberForm, 
    setMemberForm, 
    handleMemberSubmit, 
    currentUser, 
    refreshMembers,
    setAlert 
}: MembersProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteMember = async (memberId: string, memberName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser?.id}`
                }
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete member.';
                try {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                } catch (e) {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            setAlert('Member deleted successfully.');
            refreshMembers();
        } catch (error: any) {
            console.error('Delete error:', error);
            setAlert(error.message || 'Failed to delete member.');
        }
    };

    const filteredMembers = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label>
                            Email
                            <input
                                type="email"
                                value={memberForm.email}
                                onChange={(event) => setMemberForm((prev) => ({ ...prev, email: event.target.value }))}
                                placeholder="member@test.com"
                            />
                        </label>
                        <label>
                            Initial Password
                            <input
                                type="password"
                                value={memberForm.password || ''}
                                onChange={(event) => setMemberForm((prev) => ({ ...prev, password: event.target.value }))}
                                placeholder="123456"
                            />
                        </label>
                    </div>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                    </div>
                    <button type="submit">Save member</button>
                </form>
            </article>

            <article className="card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Existing Members</h3>
                    <input 
                        type="text" 
                        placeholder="Search by ID, Name or Acc..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-soft)', width: '250px' }}
                    />
                </div>
                
                {isLoading ? (
                    <p className="muted">Loading members…</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-soft)' }}>
                                <th style={{ padding: '0.75rem' }}>Member Info</th>
                                <th style={{ padding: '0.75rem' }}>Account & Role</th>
                                <th style={{ padding: '0.75rem' }}>Contact</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }} className="muted">No members found matching "{searchTerm}"</td></tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 600 }}>{member.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>No: {member.memberNumber}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>Acc: {member.accountNumber}</div>
                                            <span className="loan-pill" style={{ fontSize: '0.65rem' }}>{member.role}</span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.8rem' }}>{member.phone}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{member.email || 'No email'}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            {currentUser?.role === 'ADMIN' && member.role !== 'ADMIN' && (
                                                <button 
                                                    onClick={() => handleDeleteMember(member.id, member.name)}
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '0.4rem', cursor: 'pointer' }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </article>
        </section>
    );
}
