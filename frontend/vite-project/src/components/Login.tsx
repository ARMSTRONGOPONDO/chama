import React, { useState } from 'react';

type LoginProps = {
    handleLogin: (email: string) => Promise<void>;
    alert: string | null;
}

export function Login({ handleLogin, alert }: LoginProps) {
    const [email, setEmail] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleLogin(email);
    };

    return (
        <div className="login-container">
            <div className="card">
                <h2>Group Treasury Login</h2>
                {alert && <div className="alert">{alert}</div>}
                <form onSubmit={handleSubmit} className="form-stack">
                    <label>
                        Stakeholder Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="unityinactioncbo@gmail.com"
                            required
                        />
                    </label>
                    <button type="submit">Login to Dashboard</button>
                </form>
            </div>
        </div>
    );
}