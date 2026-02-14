"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                // Determine if we need to set a standardized "logged in" state for the client
                // For now, we rely on the cookie set by the server. 
                // We can also set a localStorage flag for easy client-side checks if needed.
                sessionStorage.setItem('isAdmin', 'true');
                router.push('/');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <main style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        }}>
            <div className="card" style={{ width: '400px', padding: '40px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
                    Admin <span style={{ color: 'var(--accent-color)' }}>Login</span>
                </h1>

                {error && (
                    <div style={{
                        background: 'rgba(255, 99, 71, 0.2)', color: '#ff6347',
                        padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--card-border)',
                                background: 'rgba(255,255,255,0.05)', color: 'white'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--card-border)',
                                background: 'rgba(255,255,255,0.05)', color: 'white'
                            }}
                        />
                    </div>
                    <button type="submit" style={{
                        marginTop: '10px', padding: '12px', borderRadius: '8px',
                        background: 'var(--accent-color)', color: 'black', fontWeight: 'bold',
                        border: 'none', cursor: 'pointer', fontSize: '1rem'
                    }}>
                        Sign In
                    </button>
                </form>
            </div>
        </main>
    );
}
