import type { Member, MemberForm } from '../types';
import { API_BASE } from '../config';

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
                    // Response is not JSON (e.g. 404 Not Found)
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
                                    <div className="member-list-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span>{member.email || 'No email'}</span>
                                        <span>{member.phone}</span>
                                        
                                        {currentUser?.role === 'ADMIN' && member.role !== 'ADMIN' && (
                                            <button 
                                                className="delete-btn" 
                                                onClick={() => handleDeleteMember(member.id, member.name)}
                                                style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '0.25rem', cursor: 'pointer' }}
                                            >
                                                Delete Member
                                            </button>
                                        )}
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
