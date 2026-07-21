'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../(auth)/AuthContext';
import './settings.css';

export default function SettingsPage() {
    const router = useRouter();
    const { user, logout } = useAuth();

    // Default to 'profile' tab
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile form state
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profilePhone, setProfilePhone] = useState('');

    // Sync profile state when user object loads
    useEffect(() => {
        if (user) {
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
        }
    }, [user]);

    return (
        <div className="settings-container">
            {/* Header */}
            <header className="settings-header">
                <div className="settings-search-wrapper">
                    <span className="material-symbols-outlined settings-search-icon">search</span>
                    <input
                        className="settings-search-input"
                        placeholder="Search settings, keys, users..."
                        type="text"
                    />
                </div>
                <div className="settings-actions">
                    <button className="settings-icon-btn">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="badge-dot" style={{ backgroundColor: '#316bf3' }}></span>
                    </button>
                    <button className="settings-add-btn" onClick={() => window.dispatchEvent(new Event('open-add-entry'))}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                        Add Entry
                    </button>
                    <div className="profile-avatar">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqWA3TER4hYkzVRLD4fdfWyWg2cIFud32cVorFld9XQtRqMlL6DnUfWtprBUmRNYlboKEB1tRlkRrV2Uci-ezw5C67nyL4PuBJa9WF7_KxSzBZb84O2_1JN6b5xh0sPVHssKQyDLlJkPpbDS7ZX0HAG5SxIXpOSreerEMiuGZ6ZP4fPU9SBVcU3tmWvKi1g90-FxoevYEN9J-_WHAtsjtnpkCo8UcNmtBVP4b2S-NaC28iWHd-iCIC"
                            alt="User Profile"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="settings-main">
                <div className="settings-title-section">
                    <h2 className="settings-title">Settings</h2>
                    <p className="settings-desc">Manage your account security, application behavior, and integrations.</p>
                </div>

                {/* Settings Grid */}
                <div className="settings-grid">
                    {/* Left Column: Navigation Tabs */}
                    <div className="settings-sidebar-nav">
                        <button
                            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : undefined }}>account_circle</span>
                            <span className="font-body-md">My Profile</span>
                        </button>
                        <button
                            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'security' ? "'FILL' 1" : undefined }}>security</span>
                            <span className="font-body-md">Account Security</span>
                        </button>


                        <button
                            className="settings-tab-btn logout-tab-btn"
                            onClick={logout}
                            style={{ color: '#ba1a1a', marginTop: '16px' }}
                        >
                            <span className="material-symbols-outlined" style={{ color: '#ba1a1a' }}>logout</span>
                            <span className="font-body-md" style={{ fontWeight: 600 }}>Log Out</span>
                        </button>
                    </div>

                    {/* Right Column: Content */}
                    <div className="settings-content-wrapper">
                        {/* Section: My Profile */}
                        {activeTab === 'profile' && (
                            <section className="settings-section-card">
                                <div className="section-card-header">
                                    <h3 className="section-card-title">My Profile</h3>
                                    <p className="section-card-subtitle">Manage your personal information and profile settings.</p>
                                </div>
                                <div className="section-card-content">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Avatar display */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #316bf3' }}>
                                                <img
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqWA3TER4hYkzVRLD4fdfWyWg2cIFud32cVorFld9XQtRqMlL6DnUfWtprBUmRNYlboKEB1tRlkRrV2Uci-ezw5C67nyL4PuBJa9WF7_KxSzBZb84O2_1JN6b5xh0sPVHssKQyDLlJkPpbDS7ZX0HAG5SxIXpOSreerEMiuGZ6ZP4fPU9SBVcU3tmWvKi1g90-FxoevYEN9J-_WHAtsjtnpkCo8UcNmtBVP4b2S-NaC28iWHd-iCIC"
                                                    alt="User Profile"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{profileName}</h4>
                                                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{profileEmail}</p>
                                                <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', backgroundColor: 'rgba(49, 107, 243, 0.1)', color: '#316bf3', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                                    PREMIUM VAULT ACCOUNT
                                                </span>
                                            </div>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={(e) => { e.preventDefault(); alert('Profile settings saved successfully.'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                                                <input
                                                    type="text"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                    className="settings-select"
                                                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
                                                <input
                                                    type="email"
                                                    value={profileEmail}
                                                    disabled
                                                    className="settings-select"
                                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'not-allowed' }}
                                                />
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email address is linked to your vault account and cannot be modified.</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={profilePhone}
                                                    onChange={(e) => setProfilePhone(e.target.value)}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="settings-select"
                                                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                                                />
                                            </div>

                                            <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                                                <button type="submit" className="row-item-action-btn" style={{ border: 'none', backgroundColor: '#316bf3', color: '#ffffff' }}>
                                                    Save Changes
                                                </button>
                                                <button
                                                    type="button"
                                                    className="row-item-action-btn secondary-btn"
                                                    onClick={() => {
                                                        setProfileName(user?.name || '');
                                                        setProfilePhone('');
                                                    }}
                                                >
                                                    Reset Fields
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section: Account Security */}
                        {activeTab === 'security' && (
                            <section className="settings-section-card">
                                <div className="section-card-header">
                                    <h3 className="section-card-title">Account Security</h3>
                                    <p className="section-card-subtitle">Configure how you access and protect your vault data.</p>
                                </div>
                                <div className="section-card-content">
                                    {/* Change Password */}
                                    <div className="settings-row-item">
                                        <div className="row-item-info">
                                            <h4 className="row-item-title">Master Password</h4>
                                            <p className="row-item-desc">Change your master password to update your encryption key. We recommend updating your master password periodically for maximum security.</p>
                                        </div>
                                        <button className="row-item-action-btn" onClick={() => alert('Password modification is handled through auth provider (mock)')}>
                                            Change Password
                                        </button>
                                    </div>
                                    {/* 2FA Setup */}
                                    <div className="settings-row-item">
                                        <div className="row-item-info">
                                            <h4 className="row-item-title">Two-Factor Authentication (2FA)</h4>
                                            <p className="row-item-desc">Add an extra layer of security to your vault by configuring an Authenticator App (TOTP).</p>
                                        </div>
                                        <button className="row-item-action-btn secondary-btn" onClick={() => alert('2FA configuration details (mock)')}>
                                            Configure 2FA
                                        </button>
                                    </div>
                                    {/* Emergency Access */}
                                    <div className="settings-row-item">
                                        <div className="row-item-info">
                                            <h4 className="row-item-title">Emergency Access</h4>
                                            <p className="row-item-desc">Grant trusted contacts access to your vault in case of an emergency after a verification wait period.</p>
                                        </div>
                                        <button className="row-item-action-btn secondary-btn" onClick={() => alert('Emergency contact configuration (mock)')}>
                                            Set Up Contact
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}


                    </div>
                </div>
            </main>
        </div>
    );
}
