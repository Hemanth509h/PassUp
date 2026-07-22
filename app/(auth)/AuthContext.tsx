'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Api from '@/app/__api/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ status: string; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ status: string; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user token/data exists in localStorage on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await Api.login(email, password);
      if (res && res.status === 'success') {
        const loggedUser = {
          id: res.user.id,
          email: res.user.email || email,
          name: res.user.name || email.split('@')[0]
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        router.push('/dashboard');
        return { status: 'success' };
      }
      return { status: 'error', message: res.message || 'Invalid credentials' };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await Api.register(name, email, password);
      if (res && res.status === 'success') {
        const loggedUser = {
          id: res.user.id,
          email: res.user.email || email,
          name: res.user.name || name
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        router.push('/dashboard');
        return { status: 'success' };
      }
      return { status: 'error', message: res.message || 'Registration failed' };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
