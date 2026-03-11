import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';
import type { Member, Group } from '../types';
import { Calendar } from './Calendar';

type SavingsProps = {
    currentUser: Member | null;
    setAlert: React.Dispatch<React.SetStateAction<string | null>>;
    refreshSummary: () => Promise<void>;
}

type BulkSavingEntry = {
    memberId: string;
    name: string;
    amount: string;
    transactionReference: string;
    note: string;
}

export function Savings({ currentUser, setAlert, refreshSummary }: SavingsProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    
    // Exact Date Picker
    const [contributionDate, setContributionDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [isDateCalendarOpen, setIsDateCalendarOpen] = useState(false);
    
    const [bulkEntries, setBulkEntries] = useState<BulkSavingEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const dateCalendarRef = useRef<HTMLDivElement>(null);

    // Helper to format date without timezone shift
    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/groups`, {
                    headers: { 'Authorization': `Bearer ${currentUser?.id}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setGroups(data);
                }
            } catch (error) {
                console.error("Failed to fetch groups", error);
            }
        };
        if (currentUser) fetchGroups();
    }, [currentUser]);

    // Initialize bulk entries when group is selected
    useEffect(() => {
        if (selectedGroupId) {
            const group = groups.find(g => g.id === selectedGroupId);
            if (group) {
                setSelectedGroup(group);
                setBulkEntries(group.members.map(m => {
                    const existing = bulkEntries.find(e => e.memberId === m.id);
                    return {
                        memberId: m.id,
                        name: m.name,
                        amount: existing?.amount || '',
                        transactionReference: existing?.transactionReference || '',
                        note: existing?.note || ''
                    };
                }));
            }
        } else {
            setSelectedGroup(null);
            setBulkEntries([]);
        }
    }, [selectedGroupId, groups]);

    // Close calendars on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dateCalendarRef.current && !dateCalendarRef.current.contains(event.target as Node)) {
                setIsDateCalendarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEntryChange = (memberId: string, field: keyof BulkSavingEntry, value: string) => {
        setBulkEntries(prev => prev.map(entry => 
            entry.memberId === memberId ? { ...entry, [field]: value } : entry
        ));
    };

    const handleBulkSubmit = async () => {
        const entriesToSubmit = bulkEntries.filter(e => e.amount && Number(e.amount) > 0);
        if (entriesToSubmit.length === 0) {
            setAlert("Please enter at least one saving amount.");
            return;
        }

        setIsLoading(true);
        let successCount = 0;
        let failCount = 0;

        // Automatically derive Reporting Month (YYYY-MM-01) from Contribution Date
        const derivedMonth = `${contributionDate.substring(0, 7)}-01`;

        for (const entry of entriesToSubmit) {
            try {
                const response = await fetch(`${API_BASE}/api/savings`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentUser?.id}`
                    },
                    body: JSON.stringify({
                        memberId: entry.memberId,
                        amount: entry.amount,
                        month: derivedMonth,
                        contributionDate: contributionDate,
                        transactionReference: entry.transactionReference,
                        note: entry.note
                    }),
                });

                if (response.ok) successCount++;
                else failCount++;
            } catch (error) {
                failCount++;
            }
        }

        setIsLoading(false);
        if (failCount === 0) {
            setAlert(`Successfully recorded ${successCount} savings.`);
            setBulkEntries(prev => prev.map(e => ({ ...e, amount: '', transactionReference: '', note: '' })));
            refreshSummary();
        } else {
            setAlert(`Recorded ${successCount} savings, but ${failCount} failed.`);
        }
    };

    return (
        <section className="form-grid">
            <article className="card" style={{ maxWidth: '100%' }}>
                <div style={{ 
                    background: '#f8fafc', 
                    padding: '1.25rem', 
                    borderRadius: '0.75rem', 
                    border: '1px solid var(--color-border-soft)',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Group Bulk Savings</h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Record contributions by exact date</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {/* Exact Date Picker */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }} ref={dateCalendarRef}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Contribution Date</span>
                            <div 
                                onClick={() => setIsDateCalendarOpen(!isDateCalendarOpen)}
                                style={{ 
                                    padding: '0.5rem', 
                                    width: '220px', 
                                    background: 'white', 
                                    border: '1px solid var(--color-primary)', 
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.1)'
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{contributionDate}</span>
                                <span>📅</span>
                            </div>
                            {isDateCalendarOpen && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, marginTop: '8px' }}>
                                    <Calendar 
                                        selectedDate={new Date(contributionDate)} 
                                        onChange={(date) => {
                                            setContributionDate(formatLocalDate(date));
                                            setIsDateCalendarOpen(false);
                                        }} 
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Target Group</span>
                            <select 
                                value={selectedGroupId} 
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                style={{ padding: '0.5rem', minWidth: '240px', background: 'white', border: '1px solid var(--color-border-soft)' }}
                            >
                                <option value="">Select a Group...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {!selectedGroup ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f1f5f9', borderRadius: '0.75rem', border: '2px dashed #cbd5e1' }}>
                        <p style={{ color: '#64748b', fontWeight: 500 }}>Select a group and contribution date above to start recording.</p>
                    </div>
                ) : (
                    <div className="bulk-savings-table-container" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border-soft)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Member</th>
                                    <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Amount (KSh)</th>
                                    <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>MPESA Details / Ref</th>
                                    <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bulkEntries.map((entry) => (
                                    <tr key={entry.memberId} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.name}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input 
                                                type="number" 
                                                placeholder="0.00"
                                                value={entry.amount}
                                                onChange={(e) => handleEntryChange(entry.memberId, 'amount', e.target.value)}
                                                style={{ width: '120px', padding: '0.5rem', background: 'white' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Enter MPESA code..."
                                                value={entry.transactionReference}
                                                onChange={(e) => handleEntryChange(entry.memberId, 'transactionReference', e.target.value)}
                                                style={{ width: '100%', minWidth: '180px', padding: '0.5rem', background: 'white' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Add comment..."
                                                value={entry.note}
                                                onChange={(e) => handleEntryChange(entry.memberId, 'note', e.target.value)}
                                                style={{ width: '100%', minWidth: '180px', padding: '0.5rem', background: 'white' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            <button 
                                onClick={handleBulkSubmit}
                                disabled={isLoading}
                                style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            >
                                {isLoading ? 'Processing Entry...' : 'Record All Group Savings'}
                            </button>
                        </div>
                    </div>
                )}
            </article>
        </section>
    );
}
