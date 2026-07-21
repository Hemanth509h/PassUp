'use client';
import Link from "next/link";
import '../Auth.css';

export default function ForgotPasswordPage() {

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

                <div className="auth-alert-warning">
                    <p className="auth-alert-warning-title">
                        ⚠️ Under Maintenance
                    </p>
                    <p className="auth-alert-warning-text">
                        If you need to change your password, please contact the admin at{' '}
                        <a href="mailto:phemanthkumar746@gmail.com">
                            phemanthkumar746@gmail.com
                        </a>
                    </p>
                </div>

                <div className="auth-title">Reset your password</div>
                <div className="auth-subtitle">Enter your email and a new password to reset your account.</div>

                <form className="auth-form" onSubmit={() => { }} autoComplete="off">

                    <div className="auth-field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            autoComplete="off"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="auth-field">
                        <label>New password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button className="auth-btn" type="submit" >
                        <span>Reset password</span>
                    </button>
                </form>

                <div className="auth-switch">
                    Remembered your password? <Link href="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}