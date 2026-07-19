'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../(auth)/AuthContext';
import './settings.css';

export default function SettingsPage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    
    // Default to 'profile' tab
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'extensions' | 'shared' | 'audit'>('profile');
    
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

    // Preference toggles
    const [autofillEnabled, setAutofillEnabled] = useState(true);
    const [promptToSave, setPromptToSave] = useState(true);
    const [autoLockTimer, setAutoLockTimer] = useState('5 minutes of inactivity');

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
                        <span className="badge-dot" style={{ backgroundColor: '#0051d5' }}></span>
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
                            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'preferences' ? "'FILL' 1" : undefined }}>tune</span>
                            <span className="font-body-md">App Preferences</span>
                        </button>
                        <button 
                            className={`settings-tab-btn ${activeTab === 'extensions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('extensions')}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'extensions' ? "'FILL' 1" : undefined }}>extension</span>
                            <span className="font-body-md">Browser Extensions</span>
                        </button>
                        <button 
                            className={`settings-tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shared')}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'shared' ? "'FILL' 1" : undefined }}>groups</span>
                            <span className="font-body-md">Shared Vaults</span>
                        </button>
                        <button 
                            className={`settings-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('audit')}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === 'audit' ? "'FILL' 1" : undefined }}>history</span>
                            <span className="font-body-md">Audit Log</span>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '24px', borderBottom: '1px solid rgba(198, 198, 205, 0.3)' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0051d5' }}>
                                                <img 
                                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqWA3TER4hYkzVRLD4fdfWyWg2cIFud32cVorFld9XQtRqMlL6DnUfWtprBUmRNYlboKEB1tRlkRrV2Uci-ezw5C67nyL4PuBJa9WF7_KxSzBZb84O2_1JN6b5xh0sPVHssKQyDLlJkPpbDS7ZX0HAG5SxIXpOSreerEMiuGZ6ZP4fPU9SBVcU3tmWvKi1g90-FxoevYEN9J-_WHAtsjtnpkCo8UcNmtBVP4b2S-NaC28iWHd-iCIC" 
                                                    alt="User Profile" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#000000' }}>{profileName}</h4>
                                                <p style={{ margin: '4px 0 0 0', color: '#45464d', fontSize: '14px' }}>{profileEmail}</p>
                                                <span style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', backgroundColor: 'rgba(0, 81, 213, 0.1)', color: '#0051d5', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                                    PREMIUM VAULT ACCOUNT
                                                </span>
                                            </div>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={(e) => { e.preventDefault(); alert('Profile settings saved successfully.'); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 600, color: '#45464d' }}>Full Name</label>
                                                <input 
                                                    type="text" 
                                                    value={profileName} 
                                                    onChange={(e) => setProfileName(e.target.value)} 
                                                    className="settings-select"
                                                    style={{ backgroundColor: '#ffffff' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 600, color: '#45464d' }}>Email Address</label>
                                                <input 
                                                    type="email" 
                                                    value={profileEmail} 
                                                    disabled
                                                    className="settings-select"
                                                    style={{ backgroundColor: '#eceef0', color: '#76777d', cursor: 'not-allowed' }}
                                                />
                                                <span style={{ fontSize: '12px', color: '#76777d' }}>Email address is linked to your vault account and cannot be modified.</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '14px', fontWeight: 600, color: '#45464d' }}>Phone Number</label>
                                                <input 
                                                    type="tel" 
                                                    value={profilePhone} 
                                                    onChange={(e) => setProfilePhone(e.target.value)} 
                                                    placeholder="+1 (555) 000-0000"
                                                    className="settings-select"
                                                    style={{ backgroundColor: '#ffffff' }}
                                                />
                                            </div>

                                            <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                                                <button type="submit" className="row-item-action-btn" style={{ border: 'none', backgroundColor: '#0051d5', color: '#ffffff' }}>
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

                        {/* Section: App Preferences */}
                        {activeTab === 'preferences' && (
                            <section className="preferences-grid">
                                {/* Autofill Card */}
                                <div className="preference-card">
                                    <div className="pref-card-icon blue-bg">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                    </div>
                                    <h4 className="pref-card-title">Autofill Behavior</h4>
                                    <p className="pref-card-desc">Automatically fill credentials on recognized domains and mobile apps.</p>
                                    
                                    <div className="pref-card-options">
                                        <div className="toggle-label" onClick={() => setAutofillEnabled(!autofillEnabled)}>
                                            <span className="toggle-text">Enable Autofill</span>
                                            <div className={`switch-toggle ${autofillEnabled ? 'on' : 'off'}`}>
                                                <span className="switch-circle"></span>
                                            </div>
                                        </div>
                                        <div className="toggle-label" onClick={() => setPromptToSave(!promptToSave)}>
                                            <span className="toggle-text">Prompt to Save</span>
                                            <div className={`switch-toggle ${promptToSave ? 'on' : 'off'}`}>
                                                <span className="switch-circle"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Policy Card */}
                                <div className="preference-card">
                                    <div className="pref-card-icon teal-bg">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
                                    </div>
                                    <h4 className="pref-card-title">Auto-Lock Settings</h4>
                                    <p className="pref-card-desc">Set the inactivity timer before the vault requires your master password again.</p>
                                    
                                    <div className="pref-card-options">
                                        <select 
                                            className="settings-select"
                                            value={autoLockTimer}
                                            onChange={(e) => setAutoLockTimer(e.target.value)}
                                        >
                                            <option value="Immediately">Immediately</option>
                                            <option value="On browser close">On browser close</option>
                                            <option value="5 minutes of inactivity">5 minutes of inactivity</option>
                                            <option value="15 minutes of inactivity">15 minutes of inactivity</option>
                                            <option value="1 hour of inactivity">1 hour of inactivity</option>
                                            <option value="Never (Not recommended)">Never (Not recommended)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section: Browser Extensions */}
                        {activeTab === 'extensions' && (
                            <section className="extension-banner-card">
                                <div className="extension-banner-bg-glow"></div>
                                <div className="extension-banner-layout">
                                    <div className="extension-banner-info">
                                        <h3 className="ext-banner-title">Universal Extension</h3>
                                        <p className="ext-banner-desc">Access your vault directly from your browser. Seamlessly fill passwords, credit cards, and addresses with one click.</p>
                                    </div>
                                    <div className="extension-downloads">
                                        <a href="#" className="download-link-btn chrome">
                                            <img 
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMzk3n_DFwZ_clnwiSByH0O81BBWUp6TNo-5Ew1lMxgqnQG2vXd_4iihNLv9od7fRkGlfw4zsi_3aEvrGkdWzgI5JikymUbCteJvTTb9sAavgLaq5-tL16huaboo9yEgtbGEPHwnYIoCUpuS8IYueivRsG7vQX1jYuDflq6yc-bJ7zDE9oXyaxDzn9MvEe1xoeTf9OtSbxtkaFYbY-3Ooj85y6pGwiHlLhViFbm947wY4Qap1C-qDw" 
                                                alt="Chrome Logo" 
                                            />
                                            <span>Chrome Store</span>
                                        </a>
                                        <a href="#" className="download-link-btn firefox">
                                            <img 
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP-UUsB_s1DF_BIpgBfg5TuQsfcjPj4gluCwL-ZV4EIAUBU7oj_SLbNYvk-gWSfg3AQBZ_oANtROGHFAra5kKgjL4DF67Cf54qfODCMdT3iV496rRZD-GrDtPmPuED0uahSoLcbVjDM86u4oROUOz4qspPrx8wrghBSr2LNWa_lbcCeD_pZsRzY2UrH6ez-KQLNdAtXiXojkJFDSgm5pca1ulggTGOFDhk6HzjIAQpcRGg0JYR3DYm" 
                                                alt="Firefox Logo" 
                                            />
                                            <span>Firefox Add-ons</span>
                                        </a>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section: Shared Vaults */}
                        {activeTab === 'shared' && (
                            <section className="settings-section-card">
                                <div className="section-card-header">
                                    <h3 className="section-card-title">Shared Vaults</h3>
                                    <p className="section-card-subtitle">Manage collaborative vaults and team access permissions.</p>
                                </div>
                                <div className="section-card-content">
                                    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#45464d' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', color: '#76777d' }}>groups</span>
                                        <p style={{ margin: 0, fontSize: '16px' }}>No shared vaults configured yet. Upgrade to a Family or Team plan to share passwords securely.</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section: Audit Log */}
                        {activeTab === 'audit' && (
                            <section className="settings-section-card">
                                <div className="section-card-header">
                                    <h3 className="section-card-title">Audit Log</h3>
                                    <p className="section-card-subtitle">Track security actions, access logs, and modification history.</p>
                                </div>
                                <div className="section-card-content">
                                    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#45464d' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', color: '#76777d' }}>history</span>
                                        <p style={{ margin: 0, fontSize: '16px' }}>Audit logging is active. No security anomalies or unauthorized access attempts detected.</p>
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
