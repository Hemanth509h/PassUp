import React, { useState } from 'react';
import Api from '../__api/api';
import './css/vault-card.css';

interface VaultCardProps {
    entryID: string;
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
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    style?: React.CSSProperties;
    onDelete?: () => void;
}

export default function VaultCard({
    entryID,
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
    tags = [],
    draggable,
    onDragStart,
    onDragOver,
    onDragEnd,
    style,
    onDelete
}: VaultCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const badgeClass =
        strength === 'Strong'
            ? 'badge-strong'
            : strength === 'Medium'
                ? 'badge-medium'
                : 'badge-weak';

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete();
        }
        setTimeout(() => {
            setMenuOpen(false);
        }, 0);
    };
    const checkMasterKey = () => {
        const masterKey = localStorage.getItem('masterkey');
        if (masterKey) {
            window.dispatchEvent(
                new CustomEvent('viewpassword', {
                    detail: {
                        id,
                        username,
                        email,
                    },
                })
            );
        } else {
            window.dispatchEvent(
                new CustomEvent('key-entry', {
                    detail: {
                        pendingEntry: { id, username, email }
                    }
                })
            );
        }
    };

    return (
        <div
            className="vault-card"
            onClick={checkMasterKey}
            style={style}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="card-top">
                <div className="card-logo">
                    <img src={logoUrl} alt={`${title} Logo`} />
                </div>
                <div className="card-top-right">
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
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    {menuOpen && (
                        <div className="card-dropdown">
                            <button
                                className="card-dropdown-delete-btn"
                                onClick={handleDelete}
                            >
                                <span className="material-symbols-outlined">delete</span>
                                Delete Entry
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title">{title}</h3>
                {username && (
                    <p className="card-subtitle">
                        <span className="material-symbols-outlined">person</span>
                        {username}
                    </p>
                )}
                {email && (
                    <p className="card-subtitle">
                        <span className="material-symbols-outlined">alternate_email</span>
                        {email}
                    </p>
                )}
                {!username && !email && subtitle && (
                    <p className="card-subtitle">{subtitle}</p>
                )}
            </div>
            {tags && tags.length > 0 && (
                <div className="card-tags">
                    {tags.map(tag => (
                        <span key={tag} className="card-tag-pill">{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
