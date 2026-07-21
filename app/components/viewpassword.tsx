'use client';

import React, { useState, useEffect } from 'react';
import './viewpassword.css';
import Api from '../__api/api';

export default function ViewPassword() {
    const [isopen, setIsOpen] = useState(false);
    const [showPassword, setShowPassword] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        const handleOpen = async (event: Event) => {
            const customEvent = event as CustomEvent<{
                id: string;
                username: string;
                email: string;
            }>;

            const { id, username, email } = customEvent.detail;

            setIsOpen(true);

            const masterKey = localStorage.getItem('masterkey') || '';
            try {
                const response = await Api.getpassword(id, masterKey);
                if (response && response.status === 'success') {
                    setShowPassword(response.data);
                } else {
                    console.error(response?.message || 'Failed to fetch password');
                }
            } catch (error) {
                console.error(error);
            }
        };

        window.addEventListener("viewpassword", handleOpen);

        return () => {
            window.removeEventListener("viewpassword", handleOpen);
        };
    }, []);

    if (!isopen) return null;

    return (
        <div className="viewpassword-overlay" onClick={() => setIsOpen(false)}>
            <div className="viewpassword" onClick={(e) => e.stopPropagation()}>
                <div className="key-entry-header">
                    <div className="key-entry-icon-wrapper">
                        <span className="material-symbols-outlined key-entry-icon">lock</span>
                    </div>
                    <h2 className="key-entry-title">Your Password</h2>
                    <p className="key-entry-subtitle">
                        To access you account
                    </p>
                </div>

                <div className="key-entry-input-wrapper">
                    <input
                        className="key-entry-input"
                        type={showKey ? 'text' : 'password'}
                        placeholder="Enter Master Key"
                        value={showPassword}
                        onChange={(e) => setShowPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        autoFocus
                    />
                    <button
                        className="key-entry-toggle"
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        title={showKey ? 'Hide key' : 'Show key'}
                    >
                        <span className="material-symbols-outlined">
                            {showKey ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}