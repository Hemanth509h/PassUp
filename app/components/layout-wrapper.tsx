'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/app/components/navbar';
// Importing the responsive bottom navigation bar
import BottomNavBar from '@/app/components/bottom-navbar';
import AddEntryDrawer from '@/app/components/add-entry-drawer';
import './layout-wrapper.css';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout-root">
      <Navbar />
      <main className="app-main-content">
        {children}
      </main>
      <BottomNavBar />
      <AddEntryDrawer />
    </div>
  );
}
