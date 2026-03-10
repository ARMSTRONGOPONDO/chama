import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

type Member = {
    id: string;
    name: string;
    memberNumber: string;
}

type Group = {
    id: string;
    name: string;
    description?: string;
    members: Member[];
    createdBy: Member;
    createdAt: string;
}

type GroupForm = {
    name: string;
    description: string;
    createdById: string;
    memberIds: string[];
}

type GroupsProps = {
    members: Member[];
    alert: string | null;
    currentUser: Member | null; // New prop for current user
    setAlert: React.Dispatch<React.SetStateAction<string | null>>; // New prop for setAlert
}

export function Groups({ members, alert, currentUser, setAlert }: GroupsProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [groupForm, setGroupForm] = useState<GroupForm>({
        name: '',
        description: '',
        createdById: currentUser?.id || '', // Use currentUser.id
        memberIds: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    const refreshGroups = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE}/api/groups`, {
                headers: {
                    'Authorization': `Bearer ${currentUser?.id}`, // Send token for fetching groups
                },
            });
            if (!response.ok) {
                throw new Error('Unable to load groups');
            }
            const data = await response.json();
            setGroups(data);
        } catch (error) {
            console.error(error);
            setAlert('Unable to load groups.'); // Use setAlert for error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log("Groups component useEffect - currentUser:", currentUser);
        if (currentUser) { // Only fetch groups if a user is logged in
            refreshGroups();
        }
    }, [currentUser]); // Re-fetch when currentUser changes

    const handleGroupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log("handleGroupSubmit - currentUser:", currentUser);
        console.log("handleGroupSubmit - groupForm:", groupForm);
        setAlert(null); // Clear previous alerts

        if (!currentUser || currentUser.role !== 'ADMIN') {
            console.warn("Group creation prevented: User is not an ADMIN or not logged in.");
            setAlert('Only admins can create groups.'); // Use setAlert
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
                    'Authorization': `Bearer ${currentUser.id}`, // Send token for creating group
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                console.error("Group creation failed with response status:", response.status);
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
                setAlert(message); // Use setAlert
                return;
            }

            setGroupForm({ name: '', description: '', createdById: currentUser.id, memberIds: [] });
            refreshGroups();
            console.log("Group created successfully.");
            setAlert('Group created successfully.'); // Use setAlert
        } catch (error) {
            console.error("Error during group creation:", error);
            setAlert('Failed to create group.'); // Use setAlert
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
        <section className="form-grid">
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
                            rows={3}
                        />
                    </label>
                    <button type="submit">Create Group</button>
                </form>
            </article>

            <article className="card form-card">
                <h3>Manage Groups</h3>
                {isLoading ? (
                    <p className="muted">Loading groups…</p>
                ) : groups.length === 0 ? (
                    <p className="muted">No groups created yet.</p>
                ) : (
                    <ul className="member-list">
                        {groups.map((group) => (
                            <li key={group.id} className="member-list-item">
                                <div className="member-list-main">
                                    <span className="member-list-name">{group.name}</span>
                                    <span className="member-list-number">Members: {group.members.length}</span>
                                </div>
                                <div className="member-list-meta">
                                    <span>Created by: {group.createdBy?.name ?? 'N/A'}</span>
                                    <span>Created at: {new Date(group.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="loan-guarantors" style={{ marginTop: '0.5rem' }}>
                                    <span className="muted">Group Members:</span>
                                    <div className="loan-guarantor-chips">
                                        {group.members.map((member) => (
                                            <span key={member.id} className="loan-guarantor-chip">
                                                {member.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </article>

            <article className="card form-card">
                <h3>Add/Remove Members from Group</h3>
                <p className="muted">Select a group and then select members to add/remove.</p>
                {/* Simplified for now, this would ideally have group selection and member selection UI */}
                <h4>Select Members:</h4>
                <div className="member-list guarantor-list">
                    {members.map((member) => {
                        const isSelected = groupForm.memberIds.includes(member.id);
                        return (
                            <button
                                key={member.id}
                                type="button"
                                className={`member-list-item ${isSelected ? 'active' : ''}`}
                                onClick={() => toggleMemberInGroup(member.id)}
                            >
                                <div className="member-list-main">
                                    <span className="member-list-name">{member.name}</span>
                                    <span className="member-list-number">{member.memberNumber}</span>
                                </div>
                                <div className="member-list-meta">
                                    <span>{member.phone}</span>
                                    <span>{member.nationalId}</span>
                                    {isSelected && <span className="guarantor-badge">Selected</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
                {/* This button would apply changes to a selected group */}
                {/* <button type="button" onClick={handleUpdateGroupMembers}>Update Group Members</button> */}
            </article>
        </section>
    );
}
