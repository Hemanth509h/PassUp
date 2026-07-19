'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from "../(auth)/AuthContext";
import { useRouter } from "next/navigation";
import LodingCard from "../components/loding";
import VaultCard from "../components/vault-card";
import Api from "../__api/api";
import "./dashboard.css";

const getLogoUrl = (url: string, title: string) => {
    if (url) {
        try {
            // Parse hostname if url has protocol
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

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(true);

    const fetchEntries = async () => {
        try {
            const res = await Api.getEntries();
            if (res && res.status === 'success' && Array.isArray(res.entries)) {
                const items = res.entries.map((entry: any) => ({
                    id: entry._id,
                    title: entry.title,
                    subtitle: entry.username,
                    strength: (entry.strength || 'Medium') as 'Strong' | 'Medium' | 'Weak',
                    logoUrl: getLogoUrl(entry.url, entry.title),
                    passwordLength: entry.password?.length || 8,
                    password: entry.password,
                    notes: entry.notes,
                    url: entry.url
                }));
                setVaultItems(items);
            }
        } catch (e) {
            console.error("Failed to fetch entries:", e);
        } finally {
            setLoadingEntries(false);
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user]);

    // Listen to refresh events
    useEffect(() => {
        window.addEventListener('refresh-vault-entries', fetchEntries);
        return () => window.removeEventListener('refresh-vault-entries', fetchEntries);
    }, []);

    if (loading || (user && loadingEntries)) {
        return <LodingCard />;
    }

    if (!user) {
        return null;
    }

    // Dynamic stats calculations
    const totalLogins = vaultItems.length;
    const weakPasswords = vaultItems.filter(item => item.strength === 'Weak').length;
    const secureScore = totalLogins > 0 
        ? Math.round(
            (vaultItems.reduce((acc, item) => {
                if (item.strength === 'Strong') return acc + 100;
                if (item.strength === 'Medium') return acc + 60;
                return acc + 20;
            }, 0) / (totalLogins * 100)) * 100
          )
        : 100;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="search-wrapper">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                        className="search-input"
                        placeholder="Search entries, passwords, or tags..."
                        type="text"
                    />
                </div>
                <div className="header-actions">
                    <div className="header-icons">
                        <button className="icon-button">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="badge-dot"></span>
                        </button>
                        <button className="icon-button" onClick={() => router.push('/settings')}>
                            <span className="material-symbols-outlined">account_circle</span>
                        </button>
                    </div>
                    <button className="add-entry-btn" onClick={() => window.dispatchEvent(new Event('open-add-entry'))}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Add Entry
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Stats Section */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-logins">
                            <span className="material-symbols-outlined icon-filled">password</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Total Logins</p>
                            <p className="stat-value">{totalLogins}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-score">
                            <span className="material-symbols-outlined icon-filled">security</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Secure Score</p>
                            <p className="stat-value">{secureScore}%</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-weak">
                            <span className="material-symbols-outlined icon-filled">warning</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Weak Passwords</p>
                            <p className="stat-value">{weakPasswords}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-sync">
                            <span className="material-symbols-outlined icon-filled">schedule</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Last Sync</p>
                            <p className="stat-value">Just now</p>
                        </div>
                    </div>
                </section>

                {/* Vault Section */}
                <div>
                    <div className="vault-header">
                        <div className="vault-header-left">
                            <h2 className="vault-title">Your Vault</h2>
                            <span className="vault-tag">All Entries</span>
                        </div>
                        <div className="vault-controls">
                            <button className="control-btn">
                                <span className="material-symbols-outlined">filter_list</span>
                            </button>
                            <button className="control-btn">
                                <span className="material-symbols-outlined">grid_view</span>
                            </button>
                            <button className="control-btn">
                                <span className="material-symbols-outlined">view_list</span>
                            </button>
                        </div>
                    </div>

                    <div className="vault-grid">
                        {vaultItems.map((item) => (
                            <VaultCard
                                key={item.id}
                                logoUrl={item.logoUrl}
                                title={item.title}
                                subtitle={item.subtitle}
                                strength={item.strength}
                                passwordLength={item.passwordLength}
                                password={item.password}
                            />
                        ))}

                        {/* Add New Entry */}
                        <button className="add-card-dashed" onClick={() => window.dispatchEvent(new Event('open-add-entry'))}>
                            <div className="add-card-icon">
                                <span className="material-symbols-outlined">add</span>
                            </div>
                            <p className="add-card-text">Add New Entry</p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}