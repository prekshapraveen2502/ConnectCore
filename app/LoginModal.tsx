"use client";

import { useState } from 'react';
import styles from './LoginModal.module.css';

interface LoginModalProps {
    onLoginSuccess: (loginType: 'admin' | 'customer') => void;
}

type ModalView = 'login' | 'signup' | 'forgot';

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
    const [view, setView] = useState<ModalView>('login');
    const [loginType, setLoginType] = useState<'admin' | 'customer'>('admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Signup fields
    const [signupName, setSignupName] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupDob, setSignupDob] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    // Forgot password fields
    const [forgotEmail, setForgotEmail] = useState('');
    const [debugLink, setDebugLink] = useState<string | null>(null);

    const clearForm = () => {
        setUsername('');
        setPassword('');
        setSignupName('');
        setSignupPhone('');
        setSignupDob('');
        setSignupEmail('');
        setSignupPassword('');
        setForgotEmail('');
        setDebugLink(null);
        setError('');
        setSuccess('');
    };

    const switchView = (newView: ModalView) => {
        clearForm();
        setView(newView);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = loginType === 'admin' ? '/api/login' : '/api/customer-login';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                if (loginType === 'admin') {
                    sessionStorage.setItem('isAdmin', 'true');
                    sessionStorage.removeItem('customerId');
                } else {
                    sessionStorage.setItem('customerId', data.customerId);
                    sessionStorage.removeItem('isAdmin');
                }
                onLoginSuccess(loginType);
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('/api/customer-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    CustomerName: signupName,
                    PhoneNumber: signupPhone,
                    DOB: signupDob,
                    Email: signupEmail,
                    Password: signupPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                setTimeout(() => switchView('login'), 3000);
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setDebugLink(null);
        setLoading(true);

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                // If backend sent a debug link (dev mode only), save it to state
                if (data.debugLink) {
                    console.log('Debug Link:', data.debugLink);
                    setDebugLink(data.debugLink);
                }
            } else {
                setError(data.error || 'Failed to send reset email');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderTitle = () => {
        if (view === 'signup') return 'Customer';
        if (view === 'forgot') return 'Forgot';
        return loginType === 'admin' ? 'Admin' : 'Customer';
    };

    const renderTitleAccent = () => {
        if (view === 'signup') return 'Sign Up';
        if (view === 'forgot') return 'Password';
        return 'Login';
    };

    return (
        <div className={styles.overlay}>
            <div className={`card ${styles.modalCard}`}>
                <h1 className={styles.title}>
                    {renderTitle()}{' '}
                    <span className={styles.titleAccent}>{renderTitleAccent()}</span>
                </h1>

                {/* Toggle buttons — only on login view */}
                {view === 'login' && (
                    <div className={styles.toggleContainer}>
                        <button
                            onClick={() => setLoginType('admin')}
                            className={`${styles.toggleButton} ${loginType === 'admin' ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => setLoginType('customer')}
                            className={`${styles.toggleButton} ${loginType === 'customer' ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
                        >
                            Customer
                        </button>
                    </div>
                )}

                {error && <div className={styles.errorBox}>{error}</div>}

                {success && (
                    <div className={styles.successBox}>
                        {success}
                        {debugLink && (
                            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                <p style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Development Mode Only:</p>
                                <a
                                    href={debugLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#fff', textDecoration: 'underline', fontWeight: 'bold' }}
                                >
                                    Open Reset Password Link
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== LOGIN VIEW ========== */}
                {view === 'login' && (
                    <form onSubmit={handleLogin} className={styles.form}>
                        <div>
                            <label className={styles.label}>
                                {loginType === 'admin' ? 'Username' : 'Username (Name + ID)'}
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder={loginType === 'customer' ? 'e.g. JohnDoe101' : ''}
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={styles.input}
                            />
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitButton}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>

                        {loginType === 'customer' && (
                            <div className={styles.linksContainer}>
                                <button
                                    type="button"
                                    onClick={() => switchView('forgot')}
                                    className={styles.linkButton}
                                >
                                    Forgot Password?
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchView('signup')}
                                    className={styles.linkButton}
                                >
                                    Create an Account
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {/* ========== SIGNUP VIEW ========== */}
                {view === 'signup' && (
                    <form onSubmit={handleSignup} className={styles.form}>
                        <div>
                            <label className={styles.label}>Full Name</label>
                            <input
                                type="text"
                                value={signupName}
                                onChange={(e) => setSignupName(e.target.value)}
                                required
                                placeholder="John Doe"
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                type="tel"
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(e.target.value)}
                                required
                                placeholder="555-123-4567"
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Date of Birth</label>
                            <input
                                type="date"
                                value={signupDob}
                                onChange={(e) => setSignupDob(e.target.value)}
                                required
                                className={styles.input}
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Password</label>
                            <input
                                type="password"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Min. 6 characters"
                                className={styles.input}
                            />
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitButton}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                        <div className={styles.linksContainer}>
                            <button
                                type="button"
                                onClick={() => switchView('login')}
                                className={styles.linkButton}
                            >
                                Already have an account? Sign In
                            </button>
                        </div>
                    </form>
                )}

                {/* ========== FORGOT PASSWORD VIEW ========== */}
                {view === 'forgot' && (
                    <form onSubmit={handleForgotPassword} className={styles.form}>
                        <p className={styles.helperText}>
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                        <div>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className={styles.input}
                            />
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitButton}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <div className={styles.linksContainer}>
                            <button
                                type="button"
                                onClick={() => switchView('login')}
                                className={styles.linkButton}
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
