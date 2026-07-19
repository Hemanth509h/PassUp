'use client';

import React, { useState } from 'react';

interface VaultCardProps {
    logoUrl: string;
    title: string;
    subtitle: string;
    strength: 'Strong' | 'Medium' | 'Weak';
    passwordLength?: number;
    password?: string;
}

export default function VaultCard({ 
    logoUrl, 
    title, 
    subtitle, 
    strength, 
    passwordLength = 8,
    password = ''
}: VaultCardProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    const badgeClass = 
        strength === 'Strong' 
            ? 'badge-strong' 
            : strength === 'Medium' 
                ? 'badge-medium' 
                : 'badge-weak';

    const displayPassword = showPassword ? password : '•'.repeat(passwordLength);

    const handleCopy = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy password:', err);
        }
    };

    return (
        <div className="vault-card">
            <div className="card-top">
                <div className="card-logo">
                    <img src={logoUrl} alt={`${title} Logo`} />
                </div>
                <div className="card-top-right">
                    <span className={`card-badge ${badgeClass}`}>
                        {strength}
                    </span>
                    <button className="card-menu-btn">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                    </button>
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title">{title}</h3>
                <p className="card-subtitle">{subtitle}</p>
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
                        onClick={() => setShowPassword(!showPassword)}
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
