import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import type { Member, Group } from '../types';

type GroupForm = {
    name: string;
    description: string;
    createdById: string;
    memberIds: string[];
}

type GroupsProps = {
    members: Member[];
    currentUser: Member | null;
    setAlert: React.Dispatch<React.SetStateAction<string | null>>;
}

export function Groups({ members, currentUser, setAlert }: GroupsProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [groupForm, setGroupForm] = useState<GroupForm>({
        name: '',
        description: '',
        createdById: currentUser?.id || '',
        memberIds: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    const refreshGroups = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE}/api/groups`, {
                headers: {
                    'Authorization': `Bearer ${currentUser?.id}`,
                },
            });
            if (!response.ok) {
                throw new Error('Unable to load groups');
            }
            const data = await response.json();
            setGroups(data);
        } catch (error) {
            console.error(error);
            setAlert('Unable to load groups.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            refreshGroups();
        }
    }, [currentUser]);

    const handleGroupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAlert(null);

        if (!currentUser || currentUser.role !== 'ADMIN') {
            setAlert('Only admins can create groups.');
            return;
        }

        try {
            const body = {
                ...groupForm,
                createdById: currentUser.id,
            };

            const response = await fetch(`${API_BASE}/api/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.id}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                let message = 'Unable to create group.';
                try {
                    const data = (await response.json()) as {
                        error?: string;
                        errors?: { message?: string }[];
                    };
                    if (Array.isArray(data?.errors) && data.errors.length > 0) {
                        const fieldMessages = data.errors
                            .map((err) => err.message)
                            .filter(Boolean)
                            .join(' ');
                        if (fieldMessages) {
                            message = fieldMessages;
                        }
                    } else if (typeof data?.error === 'string') {
                        message = data.error;
                    }
                } catch (parseError) {
                    console.error('Failed to parse group creation error response', parseError);
                }
                setAlert(message);
                return;
            }

            setGroupForm({ name: '', description: '', createdById: currentUser.id, memberIds: [] });
            refreshGroups();
            setAlert('Group created successfully.');
        } catch (error) {
            console.error(error);
            setAlert('Failed to create group.');
        }
    };

    const toggleMemberInGroup = (memberId: string) => {
        setGroupForm((prev) => {
            const isSelected = prev.memberIds.includes(memberId);
            return {
                ...prev,
                memberIds: isSelected
                    ? prev.memberIds.filter((id) => id !== memberId)
                    : [...prev.memberIds, memberId],
            };
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <article className="card form-card">
                <h3>Create New Group</h3>
                <form onSubmit={handleGroupSubmit} className="form-stack">
                    <label>
                        Group Name
                        <input
                            value={groupForm.name}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                            required
                            minLength={3}
                        />
                    </label>
                    <label>
                        Description (optional)
                        <textarea
                            value={groupForm.description ?? ''}
                            onChange={(event) => setGroupForm((prev) => ({ ...prev, description: event.target.value }))}
                            rows={2}
                        />
                    </label>
                    
                    <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select Members for this Group:</h4>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--color-border-soft)', borderRadius: '0.5rem', background: '#fff' }}>
                            {members.map((member) => {
                                const isSelected = groupForm.memberIds.includes(member.id);
                                return (
                                    <div 
                                        key={member.id} 
                                        onClick={() => toggleMemberInGroup(member.id)}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            padding: '0.6rem 1rem', 
                                            borderBottom: '1px solid var(--color-border-soft)',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? 'var(--color-gray-soft)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => {}} 
                                            style={{ width: 'auto', marginRight: '1rem' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{member.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                                {member.memberNumber} • Acc: {member.accountNumber}
                                            </div>
                                        </div>
                                        <span className="loan-pill" style={{ fontSize: '0.6rem' }}>{member.role}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <button type="submit" style={{ marginTop: '1rem' }}>Create Group with Selected Members</button>
                </form>
            </article>

            <article className="card" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Manage Groups</h3>
                {isLoading ? (
                    <p className="muted">Loading groups…</p>
                ) : groups.length === 0 ? (
                    <p className="muted">No groups created yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border-soft)' }}>
                                <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Group Details</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Capacity</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Metadata</th>
                                <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Member List</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr key={group.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{group.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{group.description || 'No description'}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 600 }}>{group.members.length} Members</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                            By: {group.createdBy?.name || 'Admin'}<br/>
                                            {new Date(group.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '250px' }}>
                                            {group.members.slice(0, 5).map(m => (
                                                <span key={m.id} className="loan-pill" style={{ fontSize: '0.65rem' }}>{m.name}</span>
                                            ))}
                                            {group.members.length > 5 && (
                                                <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>+{group.members.length - 5} more</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </article>
        </div>
    );
}
