import React, { useState } from 'react';

type LoginProps = {
    handleLogin: (identifier: string, password?: string) => Promise<void>;
    alert: string | null;
}

export function Login({ handleLogin, alert }: LoginProps) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleLogin(identifier, password);
    };

    return (
        <div className="login-container">
            <div className="card">
                <h2>CHAMA Manager Login</h2>
                {alert && <div className="alert">{alert}</div>}
                <form onSubmit={handleSubmit} className="form-stack">
                    <label>
                        Email or Account Number
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Email or 8-digit Account #"
                            required
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </label>
                    <button type="submit">Login to Dashboard</button>
                </form>
            </div>
        </div>
    );
}
