import type { Member } from '../types';

type SavingForm = {
    memberId: string;
    amount: string;
    month: string;
    note: string;
}

type SavingsProps = {
    members: Member[];
    savingForm: SavingForm;
    setSavingForm: React.Dispatch<React.SetStateAction<SavingForm>>;
    handleSavingSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function Savings({ members, savingForm, setSavingForm, handleSavingSubmit }: SavingsProps) {
    return (
        <section className="form-grid">
            <article className="card form-card">
                <h3>Record Monthly Savings</h3>
                <form onSubmit={handleSavingSubmit} className="form-stack">
                    <label>
                        Member
                        <select
                            value={savingForm.memberId}
                            onChange={(event) => setSavingForm((prev) => ({ ...prev, memberId: event.target.value }))}
                            required
                        >
                            <option value="" disabled>
                                Select a member
                            </option>
                            {members.map((member) => (
                                <option value={member.id} key={member.id}>
                                    {member.name} ({member.memberNumber})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Amount
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={savingForm.amount}
                            onChange={(event) => setSavingForm((prev) => ({ ...prev, amount: event.target.value }))}
                            required
                        />
                    </label>
                    <label>
                        Month
                        <input
                            type="month"
                            value={savingForm.month}
                            onChange={(event) => setSavingForm((prev) => ({ ...prev, month: event.target.value }))}
                            required
                        />
                    </label>
                    <label>
                        Note (optional)
                        <input
                            value={savingForm.note}
                            onChange={(event) => setSavingForm((prev) => ({ ...prev, note: event.target.value }))}
                        />
                    </label>
                    <button type="submit">Record saving</button>
                </form>
            </article>
        </section>
    );
}
