'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/(auth)/AuthContext';
import './css/keyentry.css';

export default function Keyentry() {
    const [isopen, setIsOpen] = useState(false);
    const [masterKey, setMasterKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { logout } = useAuth();
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('key-entry', handleOpen);
        return () => window.removeEventListener('key-entry', handleOpen);
    }, [])



    if (!isopen) return null;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!masterKey) {
            setError('Please enter your Master Key.');
            return;
        }

        if (masterKey.length < 4) {
            setError('Master Key must be at least 4 characters.');
            return;
        }
        localStorage.setItem('masterkey', masterKey);
        setMasterKey('');
        setIsOpen(false);
    };

    return (
        <div className="key-entry-overlay">
            <div className="key-entry-card">
                {/* Glowing lock header */}
                <div className="key-entry-header">
                    <div className="key-entry-icon-wrapper">
                        <span className="material-symbols-outlined key-entry-icon">lock</span>
                    </div>
                    <h2 className="key-entry-title">Unlock Your Vault</h2>
                    <p className="key-entry-subtitle">
                        Enter your Master Key to decrypt and access your credentials.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="key-entry-form" autoComplete="off">
                    <div className="key-entry-input-group">
                        <label className="key-entry-label">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>vpn_key</span>
                            Master Key
                        </label>
                        <div className="key-entry-input-wrapper">
                            <input
                                className="key-entry-input"
                                type={showKey ? 'text' : 'password'}
                                placeholder="Enter Master Key"
                                value={masterKey}
                                onChange={(e) => setMasterKey(e.target.value)}
                                autoComplete="new-password"
                                required
                                autoFocus
                            />
                            <button
                                className="key-entry-toggle"
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                title={showKey ? "Hide key" : "Show key"}
                            >
                                <span className="material-symbols-outlined">
                                    {showKey ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="key-entry-error">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                            {error}
                        </div>
                    )}

                    <div className="key-entry-actions">
                        <button className="key-entry-submit" type="submit">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>key</span>
                            Unlock Vault
                        </button>
                        <button
                            className="key-entry-logout"
                            type="button"
                            onClick={() => { setIsOpen(false); }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                            Log Out
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
