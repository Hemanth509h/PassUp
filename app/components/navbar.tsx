'use client';

import { useAuth } from "../(auth)/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./navbar.css";

export default function Navbar() {
    const { logout } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <>
            <div className="sidebar-wrapper">
                <aside className="sidebar">
                    <div className="sidebar-logo">
                        <img
                            alt="VaultGuard Logo"
                            className="logo-image"
                            src="logo.png"
                        />
                        <div>
                            <h1 className="logo-title">VaultGuard</h1>
                            <p className="logo-subtitle">Enterprise Security</p>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link className={`nav-item ${isActive('/dashboard') ? 'nav-item-active' : ''}`} href="/dashboard">
                            <span className="material-symbols-outlined">shield_lock</span>
                            <span>Vault</span>
                        </Link>

                        <Link className={`nav-item ${isActive('/security') ? 'nav-item-active' : ''}`} href="/security">
                            <span className="material-symbols-outlined">health_and_safety</span>
                            <span>Security</span>
                        </Link>

                        <Link className={`nav-item ${isActive('/settings') ? 'nav-item-active' : ''}`} href="/settings">
                            <span className="material-symbols-outlined">settings</span>
                            <span>Settings</span>
                        </Link>
                    </nav>

                    <div className="sidebar-footer">
                        <Link className="nav-item footer-item" href="#">
                            <span className="material-symbols-outlined">help_outline</span>
                            <span>Support</span>
                        </Link>

                        <Link className="nav-item footer-item help-item" href="#">
                            <span className="material-symbols-outlined">info</span>
                            <span>Help</span>
                        </Link>

                        <button className="logout-btn" onClick={logout}>
                            Log Out
                        </button>
                    </div>
                </aside>
            </div>
        </>
    );
}