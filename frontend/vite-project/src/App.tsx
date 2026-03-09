import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type Member = {
  id: string
  memberNumber: string
  name: string
  phone: string
  nationalId: string
  role: string
}

type SavingSummary = {
  totalGroupSavings: string
  members: {
    id: string
    name: string
    memberNumber: string
    totalSaved: string
  }[]
}

function App() {
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState<SavingSummary | null>(null)
  const [alert, setAlert] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    nationalId: '',
    dateJoined: '',
    memberNumber: '',
  })
  const [savingForm, setSavingForm] = useState({ memberId: '', amount: '', month: '', note: '' })

  const refreshMembers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/members`)
      const data = await response.json()
      setMembers(data)
      if (!savingForm.memberId && data.length > 0) {
        setSavingForm((prev) => ({ ...prev, memberId: data[0].id }))
      }
    } catch (error) {
      console.error(error)
      setAlert('Unable to load members right now.')
    }
  }, [savingForm.memberId])

  const refreshSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/savings/summary`)
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error(error)
      setAlert('Unable to load savings summary.')
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([refreshMembers(), refreshSummary()]).finally(() => setIsLoading(false))
  }, [refreshMembers, refreshSummary])

  const handleMemberSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAlert(null)

    try {
      const response = await fetch(`${API_BASE}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      })

      if (!response.ok) {
        throw new Error('Unable to register member')
      }

      setMemberForm({ name: '', phone: '', nationalId: '', dateJoined: '', memberNumber: '' })
      await refreshMembers()
      await refreshSummary()
      setAlert('Member registered successfully.')
    } catch (error) {
      console.error(error)
      setAlert('Failed to register member.')
    }
  }

  const handleSavingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAlert(null)

    try {
      const { memberId, amount, month, note } = savingForm
      const response = await fetch(`${API_BASE}/api/savings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, amount, month, note }),
      })

      if (!response.ok) {
        throw new Error('Unable to record saving')
      }

      setSavingForm((prev) => ({ ...prev, amount: '', note: '' }))
      await refreshSummary()
      setAlert('Saving recorded. Keep the momentum going!')
    } catch (error) {
      console.error(error)
      setAlert('Failed to record saving.')
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Chama Ops • Minimal MVP</p>
        <h1>Group Treasury Command Center</h1>
        <p>
          Track members, savings, and simple loan readiness. This layout is ready to grow toward role-based
          dashboards, loan workflows, and Railway deployment.
        </p>
      </header>

      <section className="summary-grid">
        <article className="card">
          <header>
            <h2>Group Savings</h2>
            <span className="status">Live</span>
          </header>
          <p className="metric">
            {summary?.totalGroupSavings ? `KSh ${summary.totalGroupSavings}` : '--'}
          </p>
          <p className="muted">Aggregated across all members</p>
        </article>
        <article className="card">
          <header>
            <h2>Members</h2>
          </header>
          <p className="metric">{members.length}</p>
          <p className="muted">Active profiles stored</p>
        </article>
        <article className="card">
          <header>
            <h2>Average Save</h2>
          </header>
          <p className="metric">
            {summary?.members.length
              ? `KSh ${(
                  summary.members.reduce((acc, member) => acc + Number(member.totalSaved), 0) /
                  summary.members.length
                ).toFixed(2)}`
              : '--'}
          </p>
          <p className="muted">Rolling average per member</p>
        </article>
      </section>

      {alert && <div className="alert">{alert}</div>}

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
              />
            </label>
            <label>
              Phone
              <input
                value={memberForm.phone}
                onChange={(event) => setMemberForm((prev) => ({ ...prev, phone: event.target.value }))}
                required
              />
            </label>
            <label>
              National ID
              <input
                value={memberForm.nationalId}
                onChange={(event) => setMemberForm((prev) => ({ ...prev, nationalId: event.target.value }))}
                required
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
              />
            </label>
            <button type="submit">Save member</button>
          </form>
        </article>
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
    </div>
  )
}

export default App
