import { useCallback, useEffect, useState } from 'react'
import './App.css'
import './components/Login.css'
import { API_BASE } from './config';
import { Overview } from './components/Overview';
import { Members } from './components/Members';
import { Savings } from './components/Savings';
import { Loans } from './components/Loans';
import { Groups } from './components/Groups';
import { Login } from './components/Login';
import type { Member, MemberForm, SavingSummary, Loan, LoanForm } from './types';

function App() {
	const [members, setMembers] = useState<Member[]>([])
	const [summary, setSummary] = useState<SavingSummary | null>(null)
	const [alert, setAlert] = useState<string | null>(null)

	useEffect(() => {
		if (alert) {
			const timer = setTimeout(() => {
				setAlert(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [alert]);
	const [isLoading, setIsLoading] = useState(false)
	const [activeSection, setActiveSection] = useState<'overview' | 'members' | 'savings' | 'loans' | 'groups'>('overview')
  const [memberForm, setMemberForm] = useState<MemberForm>({
    name: '',
    email: '',
    password: '',
    phone: '',
    nationalId: '',
    dateJoined: '',
    memberNumber: '',
    role: 'MEMBER',
  })
	const [loanForm, setLoanForm] = useState<LoanForm>({
		memberId: '',
		principal: '',
		purpose: '',
		type: 'SHORT_TERM',
		guarantorIds: [] as string[],
	})
	const [loans, setLoans] = useState<Loan[]>([])
	const [isLoansLoading, setIsLoansLoading] = useState(false)
	const [currentUser, setCurrentUser] = useState<Member | null>(null);

	const refreshMembers = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE}/api/members`)
			const data = await response.json()
			setMembers(data)
			if (data.length > 0) {
				if (!loanForm.memberId) {
					setLoanForm((prev: LoanForm) => ({ ...prev, memberId: data[0].id }))
				}
			}
		} catch (error) {
			console.error(error)
			setAlert('Unable to load members right now.')
		}
	}, [loanForm.memberId])

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
	    if (currentUser) {
	      setIsLoading(true)
	      Promise.all([refreshMembers(), refreshSummary(), refreshLoans()]).finally(() => setIsLoading(false))
	    }
	  }, [refreshMembers, refreshSummary, refreshLoans, currentUser])

	const handleLogin = async (identifier: string, password?: string) => {
		setAlert(null);
		try {
			const response = await fetch(`${API_BASE}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ identifier, password }),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to login.');
			}
			const member = await response.json();
			setCurrentUser(member);
			setAlert('Login successful!');
		} catch (error: any) {
			console.error('Login error:', error);
			setAlert(error.message || 'Login failed.');
		}
	};


  const handleMemberSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAlert(null)

		if (!currentUser || currentUser.role !== 'ADMIN') {
			setAlert('Only admins can register members.')
			return;
		}

    try {
      const response = await fetch(`${API_BASE}/api/members`, {
        method: 'POST',
        headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${currentUser.id}`,
				},
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

      setMemberForm({ name: '', email: '', password: '', phone: '', nationalId: '', dateJoined: '', memberNumber: '', role: 'MEMBER' })
      await refreshMembers()
      await refreshSummary()
      setAlert('Member registered successfully.')
    } catch (error) {
      console.error(error)
      setAlert('Failed to register member.')
    }
  }

	const handleLoanSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setAlert(null)

		if (!currentUser || currentUser.role !== 'OFFICER') {
			setAlert('Only officers can create loans.')
			return;
		}

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

			const formData = new FormData();
			formData.append('memberId', loanForm.memberId);
			formData.append('principal', loanForm.principal);
			formData.append('purpose', loanForm.purpose);
			formData.append('type', loanForm.type);
			
			if ((loanForm as any).interestRate) {
				formData.append('interestRate', (loanForm as any).interestRate);
			}

			if (loanForm.type === 'SIX_MONTH') {
				formData.append('guarantorIds', JSON.stringify(loanForm.guarantorIds));
			}

			if (loanForm.documents) {
				for (let i = 0; i < loanForm.documents.length; i++) {
					formData.append('documents', loanForm.documents[i]);
				}
			}

			const response = await fetch(`${API_BASE}/api/loans`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${currentUser.id}`,
				},
				body: formData,
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

			setLoanForm({ memberId: '', principal: '', purpose: '', type: 'SHORT_TERM', guarantorIds: [] })
			await refreshLoans()
			setAlert('Loan created successfully.')
		} catch (error) {
			console.error(error)
			setAlert('Failed to create loan.')
		}
	}

	const handleSectionClick = (section: 'overview' | 'members' | 'savings' | 'loans' | 'groups') => {
		setActiveSection(section)
	}

	if (!currentUser) {
		return <Login handleLogin={handleLogin} alert={alert} />;
	}

	return (
		<div className="app-shell">
			<aside className="sidebar">
				<div className="sidebar-title">STEVEN CHAMA PROJECT</div>
				<nav className="sidebar-nav">
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'overview' ? 'active' : ''}`}
						onClick={() => handleSectionClick('overview')}
					>
						Overview
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'members' ? 'active' : ''}`}
						onClick={() => handleSectionClick('members')}
					>
						Members
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'savings' ? 'active' : ''}`}
						onClick={() => handleSectionClick('savings')}
					>
						Savings
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'loans' ? 'active' : ''}`}
						onClick={() => handleSectionClick('loans')}
					>
						Loans
					</button>
					<button
						type="button"
						className={`sidebar-link ${activeSection === 'groups' ? 'active' : ''}`}
						onClick={() => handleSectionClick('groups')}
					>
						Groups
					</button>
				</nav>
			</aside>
			<div className="main-column">
				<header className="topbar">
					<div className="topbar-left">
						<div className="topbar-brand">STEVEN CHAMA PROJECT</div>
						<p className="topbar-subtitle">Lightweight command center for your chama</p>
					</div>
					<div className="topbar-right">
						<div className="user-profile">
							<span className="user-name">{currentUser.name}</span>
							<span className="user-role">{currentUser.role}</span>
							<button className="logout-btn" onClick={() => setCurrentUser(null)}>Logout</button>
						</div>
					</div>
				</header>


				{alert && <div className="alert">{alert}</div>}

				{activeSection === 'overview' && (
					<Overview members={members} summary={summary} isLoading={isLoading} />
				)}

				{activeSection === 'members' && (
					<Members
						members={members}
						isLoading={isLoading}
						memberForm={memberForm}
						setMemberForm={setMemberForm}
						handleMemberSubmit={handleMemberSubmit}
						currentUser={currentUser}
						refreshMembers={refreshMembers}
						setAlert={setAlert}
					/>
				)}

				{activeSection === 'savings' && (
					<Savings
						currentUser={currentUser}
						setAlert={setAlert}
						refreshSummary={refreshSummary}
					/>
				)}
		
				{activeSection === 'loans' && (
					<Loans
						members={members}
						loans={loans}
						isLoansLoading={isLoansLoading}
						loanForm={loanForm}
						setLoanForm={setLoanForm}
						handleLoanSubmit={handleLoanSubmit}
						refreshLoans={refreshLoans}
						currentUser={currentUser}
						setAlert={setAlert}
					/>
				)}

				{activeSection === 'groups' && (
					<Groups members={members} currentUser={currentUser} setAlert={setAlert} />
				)}
			</div>
		</div>
	)
}

export default App
