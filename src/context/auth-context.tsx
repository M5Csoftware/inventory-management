'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasPermission: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for token and user on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const hasPermission = (path: string): boolean => {
    if (!user) return false;

    const isAdminOrMaster = user.id === 'master' || user.role === 'master' || user.role === 'admin';
    const isGlobalBranch = user.branch === 'All';

    // Manage Roles is STRICTLY restricted to Admin and Master Admin only
    if (path.startsWith('/manage-roles')) {
      return isAdminOrMaster;
    }

    // Master, admin, and global-branch users have full access to everything
    if (isAdminOrMaster || isGlobalBranch) return true;
    if (!user.permissions || user.permissions.length === 0) return false;
    if (user.permissions.includes('*')) return true;

    // Direct route match
    if (user.permissions.includes(path)) return true;

    // Check parent route permission matching (e.g., "/stock" covers "/stock/in")
    return user.permissions.some((p) => p !== '/' && path.startsWith(p));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
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
