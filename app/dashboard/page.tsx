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
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=316bf3&color=fff&size=128&bold=true`;
};

const SkeletonCard = () => (
    <div className="vault-card skeleton-card">
        <div className="card-top">
            <div className="card-logo skeleton-element skeleton-avatar"></div>
            <div className="card-top-right">
                <span className="skeleton-element skeleton-badge"></span>
            </div>
        </div>
        <div className="card-info">
            <div className="skeleton-element skeleton-title"></div>
            <div className="skeleton-element skeleton-subtitle"></div>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; title: string } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);



    const fetchEntries = async () => {
        try {
            const masterKey = localStorage.getItem('masterkey') || '';
            const res = await Api.getEntries(masterKey);
            if (res && res.status === 'success' && Array.isArray(res.entries)) {
                const items = res.entries.map((entry: any) => ({
                    id: entry._id,
                    title: entry.title,
                    username: entry.username,
                    email: entry.email,
                    subtitle: entry.username,
                    strength: (entry.strength || 'Medium') as 'Strong' | 'Medium' | 'Weak',
                    logoUrl: getLogoUrl(entry.url, entry.title),
                    passwordLength: entry.password?.length || 8,
                    password: entry.password,
                    notes: entry.notes,
                    url: entry.url,
                    tags: entry.tags
                }));

                const savedOrderJson = localStorage.getItem('vault_order');
                if (savedOrderJson) {
                    try {
                        const savedOrder = JSON.parse(savedOrderJson);
                        if (Array.isArray(savedOrder)) {
                            items.sort((a: any, b: any) => {
                                const indexA = savedOrder.indexOf(a.id);
                                const indexB = savedOrder.indexOf(b.id);
                                if (indexA === -1 && indexB === -1) return 0;
                                if (indexA === -1) return 1;
                                if (indexB === -1) return -1;
                                return indexA - indexB;
                            });
                        }
                    } catch (e) {
                        console.error("Failed to parse saved order:", e);
                    }
                }

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

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };
    const handleClearKey = () => {
        localStorage.removeItem("masterkey");
        setToast({ message: 'Master Key deleted successfully!', type: 'success' });
    }


    const confirmDeleteAction = async () => {
        if (!deleteConfirmItem) return;
        try {
            const res = await Api.deleteEntry(deleteConfirmItem.id);
            if (res && res.status === 'success') {
                fetchEntries();
                setDeleteConfirmItem(null);
            } else {
                alert(res.message || 'Failed to delete entry');
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        }
    };



    const handleDragOver = (e: React.DragEvent, overIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === overIndex) return;

        const reorderedItems = [...vaultItems];
        const itemA = processedItems[draggedIndex];
        const itemB = processedItems[overIndex];
        const indexA = vaultItems.findIndex(x => x.id === itemA.id);
        const indexB = vaultItems.findIndex(x => x.id === itemB.id);

        if (indexA !== -1 && indexB !== -1) {
            const [draggedItem] = reorderedItems.splice(indexA, 1);
            reorderedItems.splice(indexB, 0, draggedItem);

            localStorage.setItem('vault_order', JSON.stringify(reorderedItems.map(item => item.id)));
            setVaultItems(reorderedItems);
            setDraggedIndex(overIndex);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    if (!loading && !user) {
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

    const filteredItems = vaultItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.title?.toLowerCase().includes(query) ||
            item.username?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.url?.toLowerCase().includes(query) ||
            item.notes?.toLowerCase().includes(query) ||
            item.tags?.some((tag: string) => tag.toLowerCase().includes(query))
        );
    });

    const processedItems = [...filteredItems];

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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="header-actions">
                    <div className="header-icons">

                        <button className="icon-button" onClick={() => router.push('/settings')}>
                            <span className="material-symbols-outlined">account_circle</span>
                        </button>
                    </div>
                    <button className="add-entry-btn" onClick={() => window.dispatchEvent(new Event('open-add-entry'))}>
                        <span className="material-symbols-outlined">add</span>
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
                            <p className="stat-value">
                                {loadingEntries ? (
                                    <span className="skeleton-element stat-skeleton-sm"></span>
                                ) : (
                                    totalLogins
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-score">
                            <span className="material-symbols-outlined icon-filled">security</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Secure Score</p>
                            <p className="stat-value">
                                {loadingEntries ? (
                                    <span className="skeleton-element stat-skeleton-md"></span>
                                ) : (
                                    `${secureScore}%`
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-weak">
                            <span className="material-symbols-outlined icon-filled">warning</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Weak Passwords</p>
                            <p className="stat-value">
                                {loadingEntries ? (
                                    <span className="skeleton-element stat-skeleton-sm"></span>
                                ) : (
                                    weakPasswords
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon-wrapper stat-sync">
                            <span className="material-symbols-outlined icon-filled">schedule</span>
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">Last Sync</p>
                            <p className="stat-value">
                                {loadingEntries ? (
                                    <span className="skeleton-element stat-skeleton-lg"></span>
                                ) : (
                                    'Just now'
                                )}
                            </p>
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
                        <button className="clear-key-btn flex items-center gap-1" onClick={handleClearKey}>
                            <span className="material-symbols-outlined">lock</span>
                            Clear Key
                        </button>
                    </div>

                    <div className="vault-grid">
                        {loadingEntries ? (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        ) : (
                            <>
                                {processedItems.map((item, index) => (
                                    <VaultCard
                                        entryID={item.entryID}
                                        key={item.id}
                                        id={item.id}
                                        logoUrl={item.logoUrl}
                                        title={item.title}
                                        username={item.username}
                                        email={item.email}
                                        subtitle={item.subtitle}
                                        strength={item.strength}
                                        passwordLength={item.passwordLength}
                                        password={item.password}
                                        url={item.url}
                                        notes={item.notes}
                                        tags={item.tags}
                                        draggable={searchQuery === ''}
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDelete={() => setDeleteConfirmItem({ id: item.id, title: item.title })}
                                        onDragEnd={handleDragEnd}
                                        style={{
                                            opacity: draggedIndex === index ? 0.4 : 1,
                                            border: draggedIndex === index ? '2px dashed #316bf3' : undefined,
                                            cursor: searchQuery === '' ? 'grab' : 'default',
                                            transition: 'transform 0.15s ease'
                                        }}
                                    />
                                ))}

                                {filteredItems.length === 0 && (
                                    <div className="no-entries-container">
                                        <span className="material-symbols-outlined no-entries-icon">search_off</span>
                                        <h3 className="no-entries-title">No entries found</h3>
                                        <p className="no-entries-desc">We couldn't find any entries matching "{searchQuery}"</p>
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="no-entries-clear-btn"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                )}

                                {/* Add New Entry */}
                                <button className="add-card-dashed" onClick={() => window.dispatchEvent(new Event('open-add-entry'))}>
                                    <div className="add-card-icon">
                                        <span className="material-symbols-outlined">add</span>
                                    </div>
                                    <p className="add-card-text">Add New Entry</p>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {toast && (
                <div className={`toast-notification ${toast.type}`}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{toast.message}</span>
                </div>
            )}

            {deleteConfirmItem && (
                <div className="confirm-modal-overlay" onClick={() => setDeleteConfirmItem(null)}>
                    <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-header">
                            <span className="material-symbols-outlined warning-icon">warning</span>
                            <h3>Delete Entry</h3>
                        </div>
                        <p>Are you sure you want to delete <strong>{deleteConfirmItem.title}</strong>? This action cannot be undone.</p>
                        <div className="confirm-modal-actions">
                            <button className="confirm-cancel-btn" onClick={() => setDeleteConfirmItem(null)}>Cancel</button>
                            <button className="confirm-delete-btn" onClick={confirmDeleteAction}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}