'use client';

import React from "react";
import { usePathname } from 'next/navigation';
import { AuthProvider } from "./(auth)/AuthContext";
import Navbar from '@/app/components/navbar';
import BottomNavBar from '@/app/components/bottom-navbar';
import AddEntryDrawer from '@/app/components/add-entry-drawer';
import ViewEntryDrawer from '@/app/components/view-entry-drawer';
import Keyentry from '@/app/components/keyentry';
import ViewPassword from '@/app/components/viewpassword';
import MobileHeader from '@/app/components/mobile-header';
import './components/css/layout-wrapper.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  return (
    <html lang="en">
      <head>
        <title>PassUp</title>
        <meta name="description" content="A secure credentials and password manager" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          {isAuthPage ? (
            children
          ) : (
            <div className="app-layout-root">
              <MobileHeader />
              <Navbar />
              <main className="app-main-content">
                {children}
              </main>
              <Keyentry />
              <ViewPassword />
              <BottomNavBar />
              <AddEntryDrawer />
              <ViewEntryDrawer />
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
