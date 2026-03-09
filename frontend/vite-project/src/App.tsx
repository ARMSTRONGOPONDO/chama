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

	type LoanType = 'SHORT_TERM' | 'SIX_MONTH'

type Loan = {
	id: string
	member: { id: string; name: string; memberNumber: string }
	principal: string
	interestAmount: string
	monthlyInstallment: string
	termMonths: number
	purpose: string
	status: string
	type: LoanType
	issuedAt: string
	dueDate: string
	guarantors: { id: string; name: string; memberNumber: string }[]
	repayments: { id: string; amount: string; paidAt: string; note: string | null }[]
	totalRepaid: string
	outstanding: string
}

function App() {
	const [members, setMembers] = useState<Member[]>([])
	const [summary, setSummary] = useState<SavingSummary | null>(null)
	const [alert, setAlert] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [activeSection, setActiveSection] = useState<'overview' | 'members' | 'savings' | 'loans'>('overview')
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    nationalId: '',
    dateJoined: '',
    memberNumber: '',
  })
  const [savingForm, setSavingForm] = useState({ memberId: '', amount: '', month: '', note: '' })
	const [loanForm, setLoanForm] = useState({
		memberId: '',
		principal: '',
		purpose: '',
		type: 'SHORT_TERM' as LoanType,
		guarantorIds: [] as string[],
	})
	const [loans, setLoans] = useState<Loan[]>([])
	const [isLoansLoading, setIsLoansLoading] = useState(false)

	const refreshMembers = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE}/api/members`)
			const data = await response.json()
			setMembers(data)
			if (data.length > 0) {
				if (!savingForm.memberId) {
					setSavingForm((prev) => ({ ...prev, memberId: data[0].id }))
				}
				if (!loanForm.memberId) {
					setLoanForm((prev) => ({ ...prev, memberId: data[0].id }))
				}
			}
		} catch (error) {
			console.error(error)
			setAlert('Unable to load members right now.')
		}
	}, [savingForm.memberId, loanForm.memberId])

	const refreshLoans = useCallback(async () => {
		try {
			setIsLoansLoading(true)
			const response = await fetch(`${API_BASE}/api/loans`)
			if (!response.ok) {
				throw new Error('Unable to load loans')
			}
			const data = (await response.json()) as Loan[]
			setLoans(data)
		} catch (error) {
			console.error(error)
			setAlert((prev) => prev ?? 'Unable to load loans.')
		} finally {
			setIsLoansLoading(false)
		}
	}, [])

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
	    Promise.all([refreshMembers(), refreshSummary(), refreshLoans()]).finally(() => setIsLoading(false))
	  }, [refreshMembers, refreshSummary, refreshLoans])

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
        let message = 'Failed to register member.'

        try {
          const data = (await response.json()) as {
            error?: string
            errors?: { message?: string }[]
          }

          if (Array.isArray(data?.errors) && data.errors.length > 0) {
            const fieldMessages = data.errors
              .map((err) => err.message)
              .filter(Boolean)
              .join(' ')
            if (fieldMessages) {
              message = `Please fix: ${fieldMessages}`
            }
          } else if (typeof data?.error === 'string') {
            message = data.error
          }
        } catch (parseError) {
          console.error('Failed to parse member registration error response', parseError)
        }

        setAlert(message)
        return
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

	const handleLoanSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setAlert(null)

		try {
			if (!loanForm.memberId) {
				setAlert('Please select a member for this loan.')
				return
			}
			if (!loanForm.principal || Number(loanForm.principal) <= 0) {
				setAlert('Please enter a positive principal amount.')
				return
			}
			if (!loanForm.purpose.trim()) {
				setAlert('Please enter a loan purpose.')
				return
			}
			if (loanForm.type === 'SIX_MONTH' && loanForm.guarantorIds.length === 0) {
				setAlert('Please select at least one guarantor for a six month loan.')
				return
			}

			const body = {
				memberId: loanForm.memberId,
				principal: loanForm.principal,
				purpose: loanForm.purpose,
				type: loanForm.type,
				guarantorIds: loanForm.type === 'SIX_MONTH' ? loanForm.guarantorIds : undefined,
			}

			const response = await fetch(`${API_BASE}/api/loans`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			if (!response.ok) {
				let message = 'Unable to create loan.'
				try {
					const data = (await response.json()) as {
						error?: string
						errors?: { message?: string }[]
					}
					if (Array.isArray(data?.errors) && data.errors.length > 0) {
						const fieldMessages = data.errors
							.map((err) => err.message)
							.filter(Boolean)
							.join(' ')
						if (fieldMessages) {
							message = fieldMessages
						}
					} else if (typeof data?.error === 'string') {
						message = data.error
					}
				} catch (parseError) {
					console.error('Failed to parse loan creation error response', parseError)
				}
				setAlert(message)
				return
			}

			setLoanForm((prev) => ({ ...prev, principal: '', purpose: '', guarantorIds: [] }))
			await refreshLoans()
			setAlert('Loan created successfully.')
		} catch (error) {
			console.error(error)
			setAlert('Failed to create loan.')
		}
	}

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<div className="sidebar-title">Chama Manager</div>
				<nav className="sidebar-nav">
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'overview' ? 'active' : ''}`}
						onClick={() => setActiveSection('overview')}
					>
						Overview
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'members' ? 'active' : ''}`}
						onClick={() => setActiveSection('members')}
					>
						Members
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'savings' ? 'active' : ''}`}
						onClick={() => setActiveSection('savings')}
					>
						Savings
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'loans' ? 'active' : ''}`}
						onClick={() => setActiveSection('loans')}
					>
						Loans
					</button>
				</nav>
			</aside>
			<div className="main-column">
				<header className="topbar">
					<div className="topbar-left">
						<div className="topbar-brand">Group Treasury</div>
						<p className="topbar-subtitle">Lightweight command center for your chama</p>
					</div>
				</header>
				<header className="hero">
					<p className="eyebrow">Chama Ops • Minimal MVP</p>
					<h1>Group Treasury Command Center</h1>
					<p>
						Track members, savings, and simple loan readiness. This layout is ready to grow toward role-based
						dashboards, loan workflows, and Railway deployment.
					</p>
				</header>

				{activeSection === 'overview' && (
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
				)}

		      {alert && <div className="alert">{alert}</div>}

				{activeSection === 'members' && (
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
		                const summaryForMember = summary?.members.find((m) => m.id === member.id)
		                const totalSavedForMember = summaryForMember?.totalSaved ?? '0.00'
		                return (
		                  <li key={member.id} className="member-list-item">
		                    <div className="member-list-main">
		                      <span className="member-list-name">{member.name}</span>
		                      <span className="member-list-number">{member.memberNumber}</span>
		                    </div>
		                    <div className="member-list-meta">
		                      <span>{member.phone}</span>
		                      <span>KSh {totalSavedForMember}</span>
		                    </div>
		                  </li>
		                )
		              })}
		            </ul>
		          )}
		        </article>
		      </section>
				)}

				{activeSection === 'savings' && (
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
				)}
		
				{activeSection === 'loans' && (
		      <section className="loan-form-grid">
		        <article className="card form-card">
		          <h3>Create Loan</h3>
		          <form onSubmit={handleLoanSubmit} className="form-stack">
		            <label>
		              Member
		              <select
		                value={loanForm.memberId}
		                onChange={(event) => setLoanForm((prev) => ({ ...prev, memberId: event.target.value }))}
		                required
		              >
		                <option value="" disabled>
		                  Select a member
		                </option>
		                {members.map((member) => (
		                  <option key={member.id} value={member.id}>
		                    {member.name} ({member.memberNumber})
		                  </option>
		                ))}
		              </select>
		            </label>
		            <label>
		              Principal amount
		              <input
		                type="number"
		                min="0"
		                step="0.01"
		                value={loanForm.principal}
		                onChange={(event) => setLoanForm((prev) => ({ ...prev, principal: event.target.value }))}
		                required
		              />
		            </label>
		            <label>
		              Purpose
		              <input
		                value={loanForm.purpose}
		                onChange={(event) => setLoanForm((prev) => ({ ...prev, purpose: event.target.value }))}
		                required
		                minLength={3}
		              />
		            </label>
		            <label>
		              Loan type
		              <select
		                value={loanForm.type}
		                onChange={(event) =>
		                  setLoanForm((prev) => ({
		                    ...prev,
		                    type: event.target.value as LoanType,
		                    guarantorIds: event.target.value === 'SIX_MONTH' ? prev.guarantorIds : [],
		                  }))
		                }
		              >
		                <option value="SHORT_TERM">Short term (30 days)</option>
		                <option value="SIX_MONTH">Six month (with guarantors)</option>
		              </select>
		            </label>
		            <button type="submit">Create loan</button>
		          </form>
		        </article>
		        {loanForm.type === 'SIX_MONTH' && (
		          <article className="card form-card">
		            <h3>Select guarantors</h3>
		            <p className="muted">Choose one or more members to act as guarantors.</p>
		            <p className="guarantor-hint">
		              Click a member card below to toggle them as a guarantor. Selected cards are highlighted.
		              Currently selected: {loanForm.guarantorIds.length}
		            </p>
		            <div className="member-list guarantor-list">
		              {members
		                .filter((m) => m.id !== loanForm.memberId)
		                .map((member) => {
		                  const isSelected = loanForm.guarantorIds.includes(member.id)
		                  return (
		                    <button
		                      key={member.id}
		                      type="button"
		                      className={`member-list-item ${isSelected ? 'active' : ''}`}
		                      onClick={() => {
		                        setLoanForm((prev) => {
		                          const alreadySelected = prev.guarantorIds.includes(member.id)
		                          return {
		                            ...prev,
		                            guarantorIds: alreadySelected
		                              ? prev.guarantorIds.filter((id) => id !== member.id)
		                              : [...prev.guarantorIds, member.id],
		                          }
		                        })
		                      }}
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
		                  )
		                })}
		            </div>
		          </article>
		        )}
		      </section>
				)}

				{activeSection === 'loans' && (
		      <section className="loan-table">
		        <header>
		          <h3>Issued Loans</h3>
		          {isLoansLoading && <span className="muted">Refreshing loans…</span>}
		        </header>
		        {loans.length === 0 ? (
		          <p className="muted">No loans recorded yet.</p>
		        ) : (
		          <div className="loan-grid">
		            {loans.map((loan) => (
		              <article key={loan.id} className="loan-card">
		                <div className="loan-card-main">
		                  <div>
		                    <h4>{loan.member.name}</h4>
		                    <p className="muted">{loan.member.memberNumber}</p>
		                  </div>
		                  <div className="loan-amounts">
		                    <p className="metric">KSh {loan.principal}</p>
		                    <p className="muted">Outstanding: KSh {loan.outstanding}</p>
		                  </div>
		                </div>
		                <div className="loan-card-meta">
		                  <span className="loan-pill loan-pill-type">{loan.type === 'SHORT_TERM' ? 'Short term' : 'Six month'}</span>
		                  <span className="loan-pill loan-pill-status">{loan.status}</span>
		                  <span className="loan-pill">Term: {loan.termMonths} mo</span>
		                </div>
		                {loan.guarantors.length > 0 && (
		                  <div className="loan-guarantors">
		                    <span className="muted">Guarantors:</span>
		                    <div className="loan-guarantor-chips">
		                      {loan.guarantors.map((g) => (
		                        <span key={g.id} className="loan-guarantor-chip">
		                          {g.name} ({g.memberNumber})
		                        </span>
		                      ))}
		                    </div>
		                  </div>
		                )}
		              </article>
		            ))}
		          </div>
		        )}
		      </section>
				)}

				{activeSection === 'overview' && (
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
				)}
			</div>
		</div>
	)
}

export default App
