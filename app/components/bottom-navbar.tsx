'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../ThemeContext';
import './bottom-navbar.css';

export default function BottomNavBar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bottom-nav">
            {/* Vault Tab */}
            <Link 
                className={`bottom-nav-item ${isActive('/dashboard') ? 'active' : ''}`} 
                href="/dashboard"
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/dashboard') ? "'FILL' 1" : undefined }}>lock</span>
                <span className="bottom-nav-label">Vault</span>
            </Link>

            {/* Add Entry Tab (Triggers Popup) */}
            <button 
                className="bottom-nav-item bottom-nav-action-btn"
                onClick={() => window.dispatchEvent(new Event('open-add-entry'))}
                type="button"
            >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="bottom-nav-label">Add</span>
            </button>

            {/* Security Tab */}
            <Link 
                className={`bottom-nav-item ${isActive('/security') ? 'active' : ''}`} 
                href="/security"
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/security') ? "'FILL' 1" : undefined }}>verified_user</span>
                <span className="bottom-nav-label">Security</span>
            </Link>

            {/* Settings Tab */}
            <Link 
                className={`bottom-nav-item ${isActive('/settings') ? 'active' : ''}`} 
                href="/settings"
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('/settings') ? "'FILL' 1" : undefined }}>settings</span>
                <span className="bottom-nav-label">Settings</span>
            </Link>

            {/* Theme Tab */}
            <button 
                className="bottom-nav-item"
                onClick={toggleTheme}
                type="button"
            >
                <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                <span className="bottom-nav-label">Theme</span>
            </button>
        </nav>
    );
}
