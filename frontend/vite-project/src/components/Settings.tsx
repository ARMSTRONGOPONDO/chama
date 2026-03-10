import { useState } from 'react';
import { API_BASE } from '../config';
import type { Member } from '../types';

type SettingsProps = {
    members: Member[];
    currentUser: Member | null;
    refreshMembers: () => Promise<void>;
    setAlert: React.Dispatch<React.SetStateAction<string | null>>;
};

export function Settings({
    members,
    currentUser,
    refreshMembers,
    setAlert,
}: SettingsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsLoading] = useState(false);

    const isAdmin = currentUser?.role === 'ADMIN';

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/members/${editingMember.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.id}`
                },
                body: JSON.stringify(editingMember),
            });

            if (!response.ok) throw new Error('Failed to update profile');
            
            setAlert('Profile updated successfully.');
            refreshMembers();
            setEditingMember(null);
        } catch (error) {
            setAlert('Error updating profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (memberId: string) => {
        if (!newPassword || newPassword.length < 6) {
            setAlert("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/members/${memberId}/password`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.id}`
                },
                body: JSON.stringify({ password: newPassword }),
            });

            if (!response.ok) throw new Error('Failed to update password');
            
            setAlert('Password changed successfully.');
            setNewPassword('');
        } catch (error) {
            setAlert('Error changing password.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <article className="card">
                <h3>My Profile & Security</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Account Information</h4>
                        <div className="muted" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Name: <b>{currentUser?.name}</b></span>
                            <span>Email: {currentUser?.email || 'N/A'}</span>
                            <span>Phone: {currentUser?.phone}</span>
                            <span>Account: {currentUser?.accountNumber}</span>
                            <span>Role: <span className="loan-pill">{currentUser?.role}</span></span>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Change My Password</h4>
                        <div className="form-stack">
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                value={currentUser?.id === editingMember?.id ? '' : newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button 
                                onClick={() => currentUser && handleChangePassword(currentUser.id)}
                                disabled={isSaving}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            </article>

            {isAdmin && (
                <article className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Administrative: Member Settings</h3>
                        <input 
                            type="text" 
                            placeholder="Find member..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.4rem', width: '200px' }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border-soft)' }}>
                                    <th style={{ padding: '0.5rem' }}>Member</th>
                                    <th style={{ padding: '0.5rem' }}>Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {m.memberNumber} | {m.role}</div>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#f3f4f6', color: '#374151' }}
                                                    onClick={() => setEditingMember(m)}
                                                >
                                                    Edit Profile
                                                </button>
                                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                    <input 
                                                        type="password" 
                                                        placeholder="New Pass" 
                                                        style={{ width: '100px', padding: '0.2rem', fontSize: '0.75rem' }}
                                                        onBlur={(e) => setNewPassword(e.target.value)}
                                                    />
                                                    <button 
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                                        onClick={() => handleChangePassword(m.id)}
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            )}

            {editingMember && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <article className="card" style={{ width: '400px', background: 'white' }}>
                        <h3>Edit Profile: {editingMember.name}</h3>
                        <form onSubmit={handleUpdateProfile} className="form-stack">
                            <label>Name
                                <input value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} />
                            </label>
                            <label>Email
                                <input value={editingMember.email || ''} onChange={e => setEditingMember({...editingMember, email: e.target.value})} />
                            </label>
                            <label>Phone
                                <input value={editingMember.phone} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} />
                            </label>
                            <label>Role
                                <select value={editingMember.role} onChange={e => setEditingMember({...editingMember, role: e.target.value})}>
                                    <option value="MEMBER">Member</option>
                                    <option value="OFFICER">Officer</option>
                                    <option value="VERIFIER">Verifier</option>
                                    <option value="APPROVER">Approver</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" style={{ flex: 1 }}>Save Changes</button>
                                <button type="button" onClick={() => setEditingMember(null)} style={{ flex: 1, background: '#e5e7eb', color: '#374151' }}>Cancel</button>
                            </div>
                        </form>
                    </article>
                </div>
            )}
        </div>
    );
}
