import React, { useState } from 'react';
import Api from '../__api/api';

interface VaultCardProps {
    id: string;
    logoUrl: string;
    title: string;
    subtitle?: string;
    username?: string;
    email?: string;
    strength: 'Strong' | 'Medium' | 'Weak';
    passwordLength?: number;
    password?: string;
    url?: string;
    notes?: string;
    tags?: string[];
}

export default function VaultCard({ 
    id,
    logoUrl, 
    title, 
    subtitle = '',
    username = '',
    email = '',
    strength, 
    passwordLength = 8,
    password = '',
    url = '',
    notes = '',
    tags = []
}: VaultCardProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const badgeClass = 
        strength === 'Strong' 
            ? 'badge-strong' 
            : strength === 'Medium' 
                ? 'badge-medium' 
                : 'badge-weak';

    const displayPassword = showPassword ? password : '•'.repeat(passwordLength);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy password:', err);
        }
    };

    const handleOpenDetails = () => {
        window.dispatchEvent(new CustomEvent('open-view-entry', {
            detail: { id, title, username, email, password, url, notes, tags, strength }
        }));
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                const res = await Api.deleteEntry(id);
                if (res && res.status === 'success') {
                    window.dispatchEvent(new Event('refresh-vault-entries'));
                } else {
                    alert(res.message || 'Failed to delete entry');
                }
            } catch (err) {
                alert(err instanceof Error ? err.message : String(err));
            }
        }
    };

    return (
        <div className="vault-card" onClick={handleOpenDetails} style={{ position: 'relative' }}>
            <div className="card-top">
                <div className="card-logo">
                    <img src={logoUrl} alt={`${title} Logo`} />
                </div>
                <div className="card-top-right" style={{ position: 'relative' }}>
                    <span className={`card-badge ${badgeClass}`}>
                        {strength}
                    </span>
                    <button 
                        className="card-menu-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                    </button>

                    {menuOpen && (
                        <div 
                            className="card-dropdown" 
                            style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                zIndex: 100,
                                minWidth: '150px',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '6px 0',
                                overflow: 'hidden'
                            }}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    handleOpenDetails();
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    width: '100%'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-button-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                View Details
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'none',
                                    color: '#ba1a1a',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    width: '100%',
                                    borderTop: '1px solid var(--border-color)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(186, 26, 26, 0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ba1a1a' }}>delete</span>
                                Delete Entry
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title">{title}</h3>
                {username && (
                    <p className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', opacity: 0.7 }}>person</span>
                        {username}
                    </p>
                )}
                {email && (
                    <p className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: username ? '2px' : '0px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', opacity: 0.7 }}>alternate_email</span>
                        {email}
                    </p>
                )}
                {!username && !email && subtitle && (
                    <p className="card-subtitle">{subtitle}</p>
                )}
            </div>
            <div className="card-password-container">
                <code className="password-dots" style={{ letterSpacing: showPassword ? '0px' : '3px' }}>
                    {displayPassword}
                </code>
                <div className="password-actions">
                    <button 
                        className="password-action-btn" 
                        onClick={handleCopy}
                        title="Copy Password"
                        style={{ color: copied ? '#0c9488' : undefined }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {copied ? 'check' : 'content_copy'}
                        </span>
                    </button>
                    <button 
                        className="password-action-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPassword(!showPassword);
                        }}
                        title={showPassword ? "Hide Password" : "Show Password"}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
