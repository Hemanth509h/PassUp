'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './add-entry.css';

export default function AddEntryPage() {
    const router = useRouter();

    // Form fields state
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>(['Work']);
    const [showPassword, setShowPassword] = useState(false);

    // Password generation helper
    const handleGeneratePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let pass = "";
        for (let i = 0; i < 18; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
        setShowPassword(true);

        // Temporarily reveal password for 2 seconds
        setTimeout(() => {
            setShowPassword(false);
        }, 2000);
    };

    // Calculate password strength characteristics dynamically
    const getStrengthDetails = () => {
        const len = password.length;
        if (len === 0) {
            return {
                label: 'None',
                percent: 0,
                color: '#eceef0',
                isSecure: false
            };
        }
        if (len < 8) {
            return {
                label: 'Weak',
                percent: 25,
                color: '#ba1a1a',
                isSecure: false
            };
        }
        if (len < 12) {
            return {
                label: 'Medium',
                percent: 55,
                color: '#0051d5',
                isSecure: false
            };
        }
        if (len < 16) {
            return {
                label: 'Very Strong',
                percent: 85,
                color: '#0c9488',
                isSecure: true
            };
        }
        return {
            label: `Superior (${len} chars)`,
            percent: 100,
            color: '#0c9488',
            isSecure: true
        };
    };

    const strength = getStrengthDetails();

    // Toggling selected tags list
    const handleToggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    // Form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Redirect back to dashboard on successful save simulation
        router.push('/dashboard');
    };

    return (
        <div className="add-entry-container">
            {/* Header */}
            <header className="add-entry-header">
                {/* Mobile top app bar items */}
                <div className="add-entry-header-left-mobile">
                    <button 
                        aria-label="Go back" 
                        className="material-symbols-outlined back-arrow-btn"
                        onClick={() => router.push('/dashboard')}
                    >
                        arrow_back
                    </button>
                    <h1 className="mobile-brand-title">VaultGuard</h1>
                </div>

                {/* Desktop search bar */}
                <div className="add-entry-search-wrapper desktop-only">
                    <span className="material-symbols-outlined add-entry-search-icon">search</span>
                    <input 
                        className="add-entry-search-input" 
                        placeholder="Search entries..." 
                        type="text" 
                    />
                </div>

                {/* Actions */}
                <div className="add-entry-actions">
                    <div className="add-entry-header-icons desktop-only">
                        <button className="add-entry-icon-btn">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    </div>
                    <div className="profile-avatar">
                        <img 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqWA3TER4hYkzVRLD4fdfWyWg2cIFud32cVorFld9XQtRqMlL6DnUfWtprBUmRNYlboKEB1tRlkRrV2Uci-ezw5C67nyL4PuBJa9WF7_KxSzBZb84O2_1JN6b5xh0sPVHssKQyDLlJkPpbDS7ZX0HAG5SxIXpOSreerEMiuGZ6ZP4fPU9SBVcU3tmWvKi1g90-FxoevYEN9J-_WHAtsjtnpkCo8UcNmtBVP4b2S-NaC28iWHd-iCIC" 
                            alt="User Profile" 
                        />
                    </div>
                    <button className="add-entry-submit-top-btn desktop-only" onClick={handleSubmit}>
                        <span className="material-symbols-outlined">add</span>
                        Add Entry
                    </button>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="add-entry-main">
                {/* Mobile Title block */}
                <div className="mobile-only mobile-title-block">
                    <h2 className="mobile-title">Add New Entry</h2>
                    <p className="mobile-subtitle">Securely store a new credential in your encrypted vault.</p>
                </div>

                <div className="add-entry-layout-grid">
                    {/* Main Form Column */}
                    <div className="form-column">
                        <div className="form-card">
                            <div className="form-card-header desktop-only">
                                <div>
                                    <h2 className="form-card-title">Add New Entry</h2>
                                    <p className="form-card-subtitle">Create a new cryptographic vault entry for your credentials.</p>
                                </div>
                                <span className="material-symbols-outlined form-card-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    enhanced_encryption
                                </span>
                            </div>

                            <form onSubmit={handleSubmit} className="form-fields-stack">
                                {/* Basic Information */}
                                <div className="form-row-grid">
                                    <div className="form-group-item">
                                        <label className="form-group-label">
                                            <span className="material-symbols-outlined label-icon">label</span>
                                            Title / Name
                                        </label>
                                        <div className="input-relative-wrapper">
                                            <input 
                                                className="form-input-field" 
                                                placeholder="e.g. Netflix, Personal Gmail" 
                                                type="text" 
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-item">
                                        <label className="form-group-label">
                                            <span className="material-symbols-outlined label-icon">language</span>
                                            Website URL
                                        </label>
                                        <div className="input-relative-wrapper">
                                            <input 
                                                className="form-input-field" 
                                                placeholder="https://example.com" 
                                                type="url" 
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                            />
                                            <span className="material-symbols-outlined input-trailing-icon">link</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Credentials */}
                                <div className="form-group-item">
                                    <label className="form-group-label">
                                        <span className="material-symbols-outlined label-icon">alternate_email</span>
                                        Username / Email
                                    </label>
                                    <div className="input-relative-wrapper">
                                        <input 
                                            className="form-input-field" 
                                            placeholder="john.doe@example.com" 
                                            type="text" 
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group-item">
                                    <div className="password-label-row">
                                        <label className="form-group-label">
                                            <span className="material-symbols-outlined label-icon">lock_open</span>
                                            Password
                                        </label>
                                        <button 
                                            className="generate-pwd-link-btn desktop-only" 
                                            type="button"
                                            onClick={handleGeneratePassword}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
                                            Generate Strong Password
                                        </button>
                                    </div>
                                    <div className="password-input-row">
                                        <div className="input-relative-wrapper flex-grow">
                                            <input 
                                                className="form-input-field password-input" 
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button 
                                                className="password-toggle-btn" 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <span className="material-symbols-outlined">
                                                    {showPassword ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                        <button 
                                            className="password-refresh-icon-btn" 
                                            type="button"
                                            onClick={handleGeneratePassword}
                                            title="Generate Password"
                                        >
                                            <span className="material-symbols-outlined">refresh</span>
                                        </button>
                                    </div>

                                    {/* Strength Meter */}
                                    <div className="strength-meter-container">
                                        <div className="strength-meter-track">
                                            <div 
                                                className="strength-meter-bar-fill" 
                                                style={{ 
                                                    width: `${strength.percent}%`,
                                                    backgroundColor: strength.color 
                                                }}
                                            ></div>
                                        </div>
                                        <div className="strength-meter-label-row">
                                            <span className="strength-meter-text">Strength: {strength.label}</span>
                                            <span className="strength-meter-text">Encrypted (AES-256)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Zero-Knowledge storage badge */}
                                <div className="security-badge-card">
                                    <div className="security-badge-icon-wrapper">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                                    </div>
                                    <div>
                                        <p className="security-badge-title">Zero-Knowledge Storage</p>
                                        <p className="security-badge-desc">Your data is encrypted locally before it ever leaves your device.</p>
                                    </div>
                                </div>

                                {/* Advanced Options Accordion */}
                                <div className="advanced-accordion-wrapper">
                                    <details className="advanced-accordion">
                                        <summary className="accordion-summary">
                                            <span className="accordion-summary-left">
                                                <span className="material-symbols-outlined">settings_suggest</span>
                                                Advanced Options
                                            </span>
                                            <span className="material-symbols-outlined accordion-arrow">expand_more</span>
                                        </summary>
                                        <div className="accordion-details-content">
                                            <div className="form-group-item">
                                                <label className="form-group-label">Notes</label>
                                                <textarea 
                                                    className="form-textarea-field" 
                                                    placeholder="Add recovery codes or additional context..." 
                                                    rows={3}
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group-item">
                                                <label className="form-group-label">Category Tags</label>
                                                <div className="tags-wrapper">
                                                    {(['Work', 'Personal', 'Finance'] as const).map(tag => (
                                                        <span 
                                                            key={tag}
                                                            className={`tag-select-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                                            onClick={() => handleToggleTag(tag)}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                                {tag === 'Work' ? 'work' : tag === 'Personal' ? 'person' : 'finance'}
                                                            </span> 
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    <button className="add-tag-dashed-btn" type="button">+ Add Tag</button>
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                {/* Submit / Cancel Buttons */}
                                <div className="form-footer-actions">
                                    <button className="form-submit-save-btn" type="submit">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                                        Secure and Save Entry
                                    </button>
                                    <button 
                                        className="form-cancel-btn" 
                                        type="button"
                                        onClick={() => router.push('/dashboard')}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Info Sidebar Column */}
                    <div className="guide-column desktop-only">
                        <div className="tips-card">
                            <div className="tips-card-header">
                                <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>lightbulb</span>
                                <h3 className="tips-card-title">Security Tips</h3>
                            </div>
                            <ul className="tips-list">
                                <li className="tips-list-item">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                                    <span>Use at least 16 characters for critical passwords.</span>
                                </li>
                                <li className="tips-list-item">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                                    <span>Mix symbols, numbers, and case-sensitive letters.</span>
                                </li>
                                <li className="tips-list-item">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                                    <span>Avoid using common names or dates of birth.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="guide-stats-card">
                            <div className="guide-stats-bg-icon">
                                <span className="material-symbols-outlined">fingerprint</span>
                            </div>
                            <h4 className="guide-stats-title">Vault Statistics</h4>
                            <div className="guide-stats-list">
                                <div className="guide-stats-row">
                                    <span className="guide-stats-label">Total Entries</span>
                                    <span className="guide-stats-value">124</span>
                                </div>
                                <div className="guide-stats-row">
                                    <span className="guide-stats-label">Compromised</span>
                                    <span className="guide-stats-value error-color">0</span>
                                </div>
                                <div className="guide-stats-row">
                                    <span className="guide-stats-label">Last Backup</span>
                                    <span className="guide-stats-value success-color">2m ago</span>
                                </div>
                            </div>
                        </div>

                        <div className="system-log-card">
                            <h4 className="system-log-title">System Log</h4>
                            <div className="system-log-list">
                                <div className="system-log-row">
                                    <span>Encryp. Algorithm</span>
                                    <span className="system-log-value">AES-256-GCM</span>
                                </div>
                                <div className="system-log-row">
                                    <span>Sync Status</span>
                                    <span className="system-log-value success-color">Cloud Synced</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
