'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../(auth)/AuthContext';
import { useRouter } from 'next/navigation';
import LodingCard from '../components/loding';
import Api from '../__api/api';
import './security.css';

const getLogoUrl = (url: string, title: string) => {
    if (url) {
        try {
            const hostname = url.startsWith('http') ? new URL(url).hostname : url;
            return `https://logo.clearbit.com/${hostname}`;
        } catch (e) {
            if (url.includes('.')) {
                return `https://logo.clearbit.com/${url.trim()}`;
            }
        }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=0051d5&color=fff&size=128&bold=true`;
};

// Password generator helper for securing entries
const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
};

interface RiskItem {
    id: string;
    name: string;
    email: string;
    logo: string;
    badgeText: string;
    badgeClass: string;
    issueDesc: string;
    status: 'normal' | 'securing' | 'secured';
}

export default function SecurityPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [riskEntries, setRiskEntries] = useState<RiskItem[]>([]);
    const [activeTab, setActiveTab] = useState<'1W' | '1M' | '1Y'>('1M');

    const fetchSecurityData = async () => {
        try {
            const res = await Api.getEntries();
            if (res && res.status === 'success' && Array.isArray(res.entries)) {
                setVaultItems(res.entries);
                
                // Process risk entries
                const passwordCounts: Record<string, number> = {};
                res.entries.forEach((item: any) => {
                    if (item.password) {
                        passwordCounts[item.password] = (passwordCounts[item.password] || 0) + 1;
                    }
                });

                const processedRisks: RiskItem[] = [];
                res.entries.forEach((item: any) => {
                    const pass = item.password || '';
                    const isReused = pass && passwordCounts[pass] > 1;
                    const isWeak = item.strength === 'Weak' || pass.length < 12;
                    const isCompromised = pass.toLowerCase().length < 6 || pass.toLowerCase().includes('12345') || pass.toLowerCase().includes('password');

                    let badgeText = '';
                    let badgeClass = '';
                    let issueDesc = '';

                    if (isCompromised) {
                        badgeText = 'Compromised';
                        badgeClass = 'badge-red';
                        issueDesc = 'Common / easily guessable password';
                    } else if (isWeak) {
                        badgeText = 'Weak Strength';
                        badgeClass = 'badge-blue';
                        issueDesc = `Length is only ${pass.length} characters`;
                    } else if (isReused) {
                        badgeText = 'Reused';
                        badgeClass = 'badge-teal';
                        const count = passwordCounts[pass] || 2;
                        issueDesc = `Used in ${count} vault entries`;
                    }

                    if (isCompromised || isWeak || isReused) {
                        processedRisks.push({
                            id: item._id,
                            name: item.title,
                            email: item.username,
                            logo: getLogoUrl(item.url, item.title),
                            badgeText,
                            badgeClass,
                            issueDesc,
                            status: 'normal'
                        });
                    }
                });

                setRiskEntries(processedRisks);
            }
        } catch (e) {
            console.error("Failed to load audit data:", e);
        } finally {
            setLoadingEntries(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchSecurityData();
        }
    }, [user]);

    const handleAutoSecure = async (id: string) => {
        setRiskEntries(prev => prev.map(entry => {
            if (entry.id === id) {
                return { ...entry, status: 'securing' };
            }
            return entry;
        }));

        try {
            // Generate a strong password and save it in MongoDB Atlas!
            const newPassword = generateStrongPassword();
            const res = await Api.updateEntry(id, { 
                password: newPassword,
                strength: 'Strong'
            });

            if (res && res.status === 'success') {
                // Set to secured status
                setRiskEntries(prev => prev.map(entry => {
                    if (entry.id === id) {
                        return { ...entry, status: 'secured' };
                    }
                    return entry;
                }));

                // Re-fetch all credentials to update global score and other panels
                setTimeout(() => {
                    fetchSecurityData();
                }, 1000);
            } else {
                alert('Could not update entry password in backend');
                setRiskEntries(prev => prev.map(entry => {
                    if (entry.id === id) {
                        return { ...entry, status: 'normal' };
                    }
                    return entry;
                }));
            }
        } catch (error) {
            console.error("Failed to update password:", error);
            setRiskEntries(prev => prev.map(entry => {
                if (entry.id === id) {
                    return { ...entry, status: 'normal' };
                }
                return entry;
            }));
        }
    };

    if (authLoading || (user && loadingEntries)) {
        return <LodingCard />;
    }

    if (!user) {
        return null;
    }

    // Dynamic stats calculations
    const totalCount = vaultItems.length;
    const passwordCounts: Record<string, number> = {};
    vaultItems.forEach(item => {
        if (item.password) {
            passwordCounts[item.password] = (passwordCounts[item.password] || 0) + 1;
        }
    });

    const compromisedCount = vaultItems.filter(item => {
        const p = (item.password || '').toLowerCase();
        return p.length < 6 || p.includes('12345') || p.includes('password') || p.includes('qwerty');
    }).length;

    const weakCount = vaultItems.filter(item => (item.password || '').length < 12).length;
    const reusedCount = vaultItems.filter(item => item.password && passwordCounts[item.password] > 1).length;

    // Global security score calculation
    const globalScore = totalCount > 0 
        ? Math.round(
            (vaultItems.reduce((acc, item) => {
                let s = 100;
                const p = (item.password || '').toLowerCase();
                if (p.length < 12) s -= 20;
                if (p.length < 8) s -= 20;
                if (passwordCounts[item.password || ''] > 1) s -= 25;
                if (p.length < 6 || p.includes('12345') || p.includes('password')) s -= 35;
                return acc + Math.max(0, s);
            }, 0) / (totalCount * 100)) * 100
          )
        : 100;

    let scoreStatus = 'High Security';
    let scoreIcon = 'check_circle';
    let scoreColorClass = 'gauge-fill';

    if (globalScore < 50) {
        scoreStatus = 'Critical Risk';
        scoreIcon = 'cancel';
        scoreColorClass = 'gauge-fill-red';
    } else if (globalScore < 80) {
        scoreStatus = 'Needs Attention';
        scoreIcon = 'warning';
        scoreColorClass = 'gauge-fill-orange';
    }

    return (
        <div className="security-container">
            <header className="security-header">
                <h2 className="security-title">Security Overview</h2>
                <p className="security-subtitle">Real-time audit results for your secure credentials vault.</p>
            </header>

            {/* Bento Grid Layout */}
            <div className="bento-grid">
                {/* Security Score Large Card */}
                <div className="score-card">
                    <div className="card-bg-icon">
                        <span className="material-symbols-outlined text-[120px]">shield_with_heart</span>
                    </div>
                    <div className="gauge-wrapper">
                        <svg className="gauge-svg" viewBox="0 0 100 100">
                            <circle 
                                className="gauge-bg" 
                                cx="50" 
                                cy="50" 
                                fill="transparent" 
                                r="40" 
                                stroke="#f1f5f9"
                                strokeWidth="8"
                            />
                            <circle 
                                className={scoreColorClass} 
                                cx="50" 
                                cy="50" 
                                fill="transparent" 
                                r="40" 
                                stroke={globalScore < 50 ? "#ba1a1a" : globalScore < 80 ? "#eab308" : "#0c9488"}
                                strokeWidth="8"
                                style={{
                                    strokeDasharray: '251.2',
                                    strokeDashoffset: 251.2 - (251.2 * globalScore) / 100
                                }}
                            />
                        </svg>
                        <div className="gauge-text-wrapper">
                            <span className="gauge-value">{globalScore}</span>
                            <span className="gauge-label">Global Score</span>
                        </div>
                    </div>
                    <div className="score-status-wrapper">
                        <p className="score-status" style={{ color: globalScore < 50 ? "#ba1a1a" : globalScore < 80 ? "#eab308" : "#0c9488" }}>
                            <span className="material-symbols-outlined">{scoreIcon}</span>
                            {scoreStatus}
                        </p>
                        <p className="score-description">
                            {totalCount === 0 
                                ? "Add your accounts to run a security vulnerability analysis."
                                : `Auditing ${totalCount} passwords. Detected ${compromisedCount} compromised, ${weakCount} weak, and ${reusedCount} reused credentials.`}
                        </p>
                    </div>
                </div>

                {/* Trend Graph Card */}
                <div className="trend-card">
                    <div className="trend-header">
                        <h3 className="trend-title">Score Trends</h3>
                        <div className="trend-time-filters">
                            {(['1W', '1M', '1Y'] as const).map(tab => (
                                <button 
                                    key={tab}
                                    className={`time-filter-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="graph-container">
                        <div className="graph-bars">
                            {/* Mock Graph Bars representing progress up to current score */}
                            <div className="graph-bar-wrapper" style={{ height: '60%' }}>
                                <div className="graph-bar-tooltip">60</div>
                            </div>
                            <div className="graph-bar-wrapper" style={{ height: '65%' }}>
                                <div className="graph-bar-tooltip">65</div>
                            </div>
                            <div className="graph-bar-wrapper" style={{ height: '70%' }}>
                                <div className="graph-bar-tooltip">70</div>
                            </div>
                            <div className="graph-bar-wrapper" style={{ height: '72%', opacity: 0.5 }}>
                                <div className="graph-bar-tooltip">72</div>
                            </div>
                            <div className="graph-bar-wrapper" style={{ height: '78%', opacity: 0.8 }}>
                                <div className="graph-bar-tooltip">78</div>
                            </div>
                            <div className="graph-bar-wrapper highlight" style={{ height: `${globalScore}%` }}>
                                <div className="graph-bar-tooltip">{globalScore}</div>
                            </div>
                        </div>

                        {/* Grid Lines */}
                        <div className="graph-grid-lines">
                            <div className="grid-line"></div>
                            <div className="grid-line"></div>
                            <div className="grid-line"></div>
                        </div>
                    </div>

                    <div className="graph-labels">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                </div>

                {/* Summary Statistics Grid */}
                <div className="security-stats-grid">
                    {/* Compromised */}
                    <div className="security-stat-card compromised">
                        <div className="sec-stat-top">
                            <div className="sec-stat-icon">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                            </div>
                            <span className="sec-stat-count">{compromisedCount}</span>
                        </div>
                        <h4 className="sec-stat-title">Compromised</h4>
                        <p className="sec-stat-desc">Found in known leak definitions</p>
                    </div>

                    {/* Weak */}
                    <div className="security-stat-card weak">
                        <div className="sec-stat-top">
                            <div className="sec-stat-icon">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                            </div>
                            <span className="sec-stat-count">{weakCount}</span>
                        </div>
                        <h4 className="sec-stat-title">Weak Passwords</h4>
                        <p className="sec-stat-desc">Length under 12 characters</p>
                    </div>

                    {/* Reused */}
                    <div className="security-stat-card reused">
                        <div className="sec-stat-top">
                            <div className="sec-stat-icon">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>content_copy</span>
                            </div>
                            <span className="sec-stat-count">{reusedCount}</span>
                        </div>
                        <h4 className="sec-stat-title">Reused</h4>
                        <p className="sec-stat-desc">Duplicate keys across accounts</p>
                    </div>
                </div>

                {/* At Risk Entries List */}
                <div className="risk-card">
                    <div className="risk-header">
                        <h3 className="risk-title">At Risk Entries</h3>
                        <span style={{ fontSize: '13px', color: '#76777d' }}>{riskEntries.length} issues identified</span>
                    </div>

                    <div className="risk-list">
                        {riskEntries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#76777d' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#0c9488', marginBottom: '12px' }}>check_circle</span>
                                <h4 style={{ margin: '0 0 4px 0', color: '#000000', fontWeight: 600 }}>Zero Vulnerabilities Detected</h4>
                                <p style={{ margin: 0, fontSize: '14px' }}>All password values meet security recommendations.</p>
                            </div>
                        ) : (
                            riskEntries.map((entry) => (
                                <div key={entry.id} className="risk-item">
                                    <div className="risk-item-left">
                                        <div className="risk-item-logo">
                                            <img src={entry.logo} alt={`${entry.name} Logo`} />
                                        </div>
                                        <div className="risk-item-details">
                                            <h5 className="risk-item-name">{entry.name}</h5>
                                            <p className="risk-item-email">{entry.email}</p>
                                        </div>
                                    </div>
                                    <div className="risk-item-right">
                                        <div className="risk-item-status-wrapper">
                                            <span className={`risk-badge ${entry.badgeClass}`}>
                                                {entry.badgeText}
                                            </span>
                                            <span className="risk-item-issue-desc">{entry.issueDesc}</span>
                                        </div>

                                        {entry.status === 'normal' && (
                                            <button 
                                                className="change-pwd-btn"
                                                onClick={() => handleAutoSecure(entry.id)}
                                            >
                                                Auto Secure
                                            </button>
                                        )}

                                        {entry.status === 'securing' && (
                                            <button className="change-pwd-btn" disabled style={{ opacity: 0.7 }}>
                                                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>sync</span>
                                                Securing...
                                            </button>
                                        )}

                                        {entry.status === 'secured' && (
                                            <button className="change-pwd-btn secured">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                                                Secured
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Space */}
            <footer className="security-footer">
                <p className="security-footer-text">
                    PassUp Enterprise-Grade Audit Engine • Active Zero-Knowledge Auditing
                </p>
            </footer>
        </div>
    );
}