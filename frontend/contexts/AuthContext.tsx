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
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
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
    const refreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Set up automatic token refresh
        if (refreshToken) {
          setupTokenRefresh(refreshToken);
        }
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    setLoading(false);
  }, []);

  const setupTokenRefresh = (refreshTokenValue: string) => {
    // Refresh token every 50 minutes (before 1h expiration)
    const interval = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearInterval(interval);
        logout();
      }
    }, 50 * 60 * 1000); // 50 minutes

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  const refreshAccessToken = async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update access token
    localStorage.setItem('auth_token', data.access_token);
    if (data.user) {
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
    }
  };

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
    
    // Store tokens and user
    localStorage.setItem('auth_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    setUser(data.user);
    
    // Set up automatic token refresh
    if (data.refresh_token) {
      setupTokenRefresh(data.refresh_token);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Revoke refresh token on backend
    if (refreshToken && process.env.NODE_ENV !== 'development') {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('auth_token');
        
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
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
        refreshAccessToken,
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

