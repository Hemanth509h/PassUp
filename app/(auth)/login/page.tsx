'use client';

import Link from "next/link";
import '../Auth.css';
import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(form.email, form.password);
      if (res.status === 'error') {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
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
    <>
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

          <div className="auth-title">Welcome back</div>
          <div className="auth-subtitle">
            Sign in to your account to continue
          </div>

          {error && (
            <div className="auth-error" style={{ margin: '10px 0' }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
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
                autoFocus
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label>Password</label>

                <Link href="/forgot-password" className="auth-link-btn">
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              <span>{loading ? "Signing in..." : "Sign in"}</span>
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account? <Link href="/register">Create one</Link>
          </div>
        </div>
      </div>
    </>
  );
}