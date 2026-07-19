'use client';

import Link from 'next/link';
import '../Auth.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { register, user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (form.password !== form.confirm) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const res = await register(form.name, form.email, form.password);

            if (res.status === 'error') {
                setError(res.message || 'Registration failed');
                setLoading(false);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    // While checking auth state, show a clean background
    if (authLoading || user) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0b0d', color: '#fff' }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-blobs">
                <div className="auth-blob auth-blob-1"></div>
                <div className="auth-blob auth-blob-2"></div>
                <div className="auth-blob auth-blob-3"></div>
            </div>
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/logo.png" alt="PassUp" />
                    <h2>PassUp</h2>
                </div>
                <div className="auth-title">Create your account</div>
                <div className="auth-subtitle">Sign up and start your journey</div>
                {error && (
                    <div className="auth-error" style={{ margin: '10px 0' }}>
                        {error}
                    </div>
                )}
                <form className="auth-form" onSubmit={handleRegister}>
                    <div className="auth-field">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Your name"
                            autoComplete="name"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="auth-field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="auth-field">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            required
                        />
                    </div>
                    <div className="auth-field">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirm"
                            value={form.confirm}
                            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            required
                        />
                    </div>
                    <button className="auth-btn" type="submit" disabled={loading}>
                        <span>{loading ? "Creating account..." : "Create account"}</span>
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account?{' '}
                    <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}