'use client';

import React, { useState, useEffect } from 'react';
import Api from '../__api/api';
import './css/add-entry-drawer.css';

export default function AddEntryDrawer() {
    const [isOpen, setIsOpen] = useState(false);

    // Form fields state
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>(['Work']);
    const [showPassword, setShowPassword] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Listen to global open event
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-add-entry', handleOpen);
        return () => window.removeEventListener('open-add-entry', handleOpen);
    }, []);

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
                color: '#316bf3',
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

    // Close and reset form
    const handleClose = () => {
        setIsOpen(false);
        setTitle('');
        setUrl('');
        setUsername('');
        setEmail('');
        setPassword('');
        setNotes('');
        setSelectedTags(['Work']);
        setShowPassword(false);
        setError(null);
        setSubmitting(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!username && !email) {
            setError('Please enter either a Username or Email address.');
            setSubmitting(false);
            return;
        }

        const masterKey = localStorage.getItem('masterkey');
        if (!masterKey) {
            setError('Vault is locked. Please configure or enter your Master Key.');
            window.dispatchEvent(new Event('key-entry'));
            setSubmitting(false);
            return;
        }
        const entryID = Math.random().toString(18);
        try {
            const strengthLabel = strength.label === 'None' ? 'Medium' : strength.label.includes('Superior') ? 'Strong' : strength.label.includes('Very Strong') ? 'Strong' : strength.label;

            const res = await Api.addEntry({
                entryID: entryID,
                title,
                url,
                username,
                email,
                password,
                notes,
                tags: selectedTags,
                strength: strengthLabel
            }, masterKey);

            if (res && res.status === 'success') {
                handleClose();
                window.dispatchEvent(new Event('refresh-vault-entries'));
            } else {
                setError(res.message || 'Failed to save entry');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={handleClose}>
            <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
                {/* Drag Handle Indicator for Mobile */}
                <div className="drawer-drag-handle" onClick={handleClose}></div>

                <div className="drawer-header">
                    <div>
                        <h2 className="drawer-title">Add New Entry</h2>
                        <p className="drawer-subtitle">Create a new cryptographic vault entry for your credentials.</p>
                    </div>
                    <button className="drawer-close-btn" onClick={handleClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="drawer-form-content" autoComplete="off">
                    <div className="drawer-scroll-area">
                        {/* Title / Name */}
                        <div className="drawer-form-group">
                            <label className="drawer-label">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>label</span>
                                Title / Name
                            </label>
                            <input
                                className="drawer-input"
                                placeholder="e.g. Netflix, Personal Gmail"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>

                        {/* Website URL */}
                        <div className="drawer-form-group">
                            <label className="drawer-label">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>language</span>
                                Website URL
                            </label>
                            <div className="drawer-input-wrapper">
                                <input
                                    className="drawer-input"
                                    placeholder="https://example.com"
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    autoComplete="off"
                                />
                                <span className="material-symbols-outlined drawer-input-icon">link</span>
                            </div>
                        </div>

                        {/* Username & Email Row */}
                        <div className="drawer-form-row">
                            <div className="drawer-form-group">
                                <label className="drawer-label">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                                    Username
                                </label>
                                <input
                                    className="drawer-input"
                                    placeholder="john_doe"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>

                            <div className="drawer-form-group">
                                <label className="drawer-label">
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>alternate_email</span>
                                    Email
                                </label>
                                <input
                                    className="drawer-input"
                                    placeholder="john.doe@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="drawer-form-group">
                            <label className="drawer-label">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
                                Password
                            </label>
                            <div className="drawer-password-row">
                                <div className="drawer-input-wrapper">
                                    <input
                                        className="drawer-input mono-font"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        className="drawer-password-toggle"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                <button
                                    className="drawer-refresh-btn"
                                    type="button"
                                    onClick={handleGeneratePassword}
                                    title="Generate Password"
                                >
                                    <span className="material-symbols-outlined">refresh</span>
                                </button>
                            </div>

                            {/* Strength Meter */}
                            <div className="drawer-strength-wrapper">
                                <div className="drawer-strength-track">
                                    <div
                                        className="drawer-strength-bar"
                                        style={{
                                            width: `${strength.percent}%`,
                                            backgroundColor: strength.color
                                        }}
                                    ></div>
                                </div>
                                <div className="drawer-strength-labels">
                                    <span>Strength: {strength.label}</span>
                                    <span>Encrypted (AES-256)</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="drawer-form-group">
                            <label className="drawer-label">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notes</span>
                                Notes
                            </label>
                            <textarea
                                className="drawer-textarea"
                                placeholder="Add recovery codes or additional context..."
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Category Tags */}
                        <div className="drawer-form-group">
                            <label className="drawer-label">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_offer</span>
                                Category Tags
                            </label>
                            <div className="drawer-tags-list">
                                {(['Work', 'Personal', 'Finance'] as const).map(tag => (
                                    <span
                                        key={tag}
                                        className={`drawer-tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                        onClick={() => handleToggleTag(tag)}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                            {tag === 'Work' ? 'work' : tag === 'Personal' ? 'person' : 'finance'}
                                        </span>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Zero-Knowledge storage badge */}
                        <div className="drawer-badge-card">
                            <div className="drawer-badge-icon-wrapper">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                            </div>
                            <div>
                                <p className="drawer-badge-title">Zero-Knowledge Storage</p>
                                <p className="drawer-badge-desc">Your data is encrypted locally before it ever leaves your device.</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="drawer-actions-panel">
                        {error && (
                            <div style={{ color: '#ba1a1a', backgroundColor: 'rgba(186, 26, 26, 0.1)', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '8px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        <button className="drawer-submit-btn" type="submit" disabled={submitting}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {submitting ? 'hourglass_empty' : 'task_alt'}
                            </span>
                            {submitting ? 'Saving...' : 'Secure and Save Entry'}
                        </button>
                        <button className="drawer-cancel-btn" type="button" onClick={handleClose} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
