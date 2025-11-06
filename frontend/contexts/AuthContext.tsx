'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // DEV MODE: Auto-login with admin user for development
    if (process.env.NODE_ENV === 'development') {
      const devUser: User = {
        id: 'dev-admin',
        username: 'admin',
        name: 'Dev Admin',
        role: 'ADMIN',
      };
      setUser(devUser);
      setLoading(false);
      return;
    }

    // PRODUCTION: Check for stored token on mount
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // DEV MODE: Auto-login for development
    if (process.env.NODE_ENV === 'development') {
      const devUser: User = {
        id: 'dev-admin',
        username: username || 'admin',
        name: username === 'operator' ? 'Dev Operator' : 'Dev Admin',
        role: username === 'operator' ? 'OPERATOR' : 'ADMIN',
      };
      setUser(devUser);
      return;
    }

    // PRODUCTION: Real login
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    // DEV MODE: Don't redirect to login
    if (process.env.NODE_ENV !== 'development') {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'ADMIN',
        isOperator: user?.role === 'OPERATOR',
      }}
    >
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

