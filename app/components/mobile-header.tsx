'use client';

import React from 'react';
import { useAuth } from '../(auth)/AuthContext';
import './css/mobile-header.css';

export default function MobileHeader() {
    const { logout } = useAuth();

    return (
        <header className="mobile-header">
            <div className="mobile-logo-container">
                <img
                    alt="VaultGuard Logo"
                    className="mobile-logo-img"
                    src="/logo.png"
                />
                <span className="mobile-logo-title">VaultGuard</span>
            </div>
            <button className="mobile-header-logout" onClick={logout} aria-label="Log Out">
                <span className="material-symbols-outlined">logout</span>
            </button>
        </header>
    );
}
