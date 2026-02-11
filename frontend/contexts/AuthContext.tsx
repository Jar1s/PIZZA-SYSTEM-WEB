'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void | { needsSmsVerification: boolean; userId: string; phoneNumber: string | null }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  sendSmsCode: (phone: string, username?: string) => Promise<void>;
  loginWithSmsVerification: (username: string, password: string, phone: string, code: string) => Promise<void>;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  isOperator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    // DEV MODE: Auto-login with admin user for development
    if (process.env.NODE_ENV === 'development') {
      // Check if user explicitly logged out (don't auto-login)
      const loggedOut = sessionStorage.getItem('admin_logged_out');
      if (loggedOut === 'true') {
        setLoading(false);
        return;
      }

      const autoLogin = async () => {
        const existingToken = localStorage.getItem('auth_token');
        const existingUser = localStorage.getItem('auth_user');
        
        // If we have a valid token and user, use them
        if (existingToken && existingUser) {
          try {
            const user = JSON.parse(existingUser);
            setUser(user);
            setLoading(false);
            return;
          } catch (e) {
            // Invalid user data, continue to login
          }
        }
        
        // Auto-login to get real token
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' }),
          });

          if (response.ok) {
            const data = await response.json();
            const devUser: User = {
              id: data.user.id,
              username: data.user.username,
              name: data.user.name,
              role: data.user.role,
            };
            localStorage.setItem('auth_token', data.access_token);
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token);
            }
            localStorage.setItem('auth_user', JSON.stringify(devUser));
            setUser(devUser);
          } else {
            // If login fails, use dev user without token (for offline dev)
            const devUser: User = {
              id: 'dev-admin',
              username: 'admin',
              name: 'Dev Admin',
              role: 'ADMIN',
            };
            setUser(devUser);
            localStorage.setItem('auth_user', JSON.stringify(devUser));
          }
        } catch (error) {
          // Backend not available, use dev user without token
          console.warn('Dev mode: Backend not available, using dev user without token');
          const devUser: User = {
            id: 'dev-admin',
            username: 'admin',
            name: 'Dev Admin',
            role: 'ADMIN',
          };
          setUser(devUser);
          localStorage.setItem('auth_user', JSON.stringify(devUser));
        }
        setLoading(false);
      };
      
      autoLogin();
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, refresh token is in HttpOnly cookie
    // In development, get it from localStorage
    const refreshTokenValue = isProduction 
      ? 'cookie' // Placeholder - actual token is in HttpOnly cookie
      : localStorage.getItem('refresh_token');
    
    if (!refreshTokenValue && !isProduction) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for HttpOnly tokens
      body: JSON.stringify({ 
        refresh_token: isProduction 
          ? undefined // Don't send in body, it's in cookie
          : refreshTokenValue 
      }),
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
    // Always use real API login to get proper token (even in dev mode)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for HttpOnly tokens
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Check if SMS verification is needed
    if (data.needsSmsVerification) {
      return {
        needsSmsVerification: true,
        userId: data.userId,
        phoneNumber: data.phoneNumber,
      };
    }
    
    // Store tokens and user
    // In production, tokens are in HttpOnly cookies, but we still store in localStorage for development
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      // Development: Store in localStorage
      localStorage.setItem('auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    } else {
      // Production: Tokens are in HttpOnly cookies, but we still need access_token for Authorization header
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token); // Still needed for Authorization header
      }
    }
    // Check if user changed (for cart clearing)
    const previousUserId = user?.id;
    const newUserId = data.user.id;
    if (previousUserId && previousUserId !== newUserId) {
      clearCart(); // Clear cart if user switched
    }
    
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    // Clear logout flag on successful login
    sessionStorage.removeItem('admin_logged_out');
    
    setUser(data.user);
    
    // Set up automatic token refresh
    if (data.refresh_token) {
      // In production, refresh token is in HttpOnly cookie
      if (!isProduction) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      setupTokenRefresh(data.refresh_token || 'cookie'); // Use 'cookie' as placeholder in production
    }
  };

  const logout = async () => {
    // Clear cart when logging out
    clearCart();
    
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Revoke refresh token on backend
    if (refreshToken) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('auth_token');
        
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include', // Include cookies for HttpOnly tokens
          body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch(() => {
          // Ignore errors if backend is not available
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Set flag to prevent auto-login in dev mode
    sessionStorage.setItem('admin_logged_out', 'true');
    
    // Clear local storage (but keep cookie settings - they are per user and should persist)
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    
    // Redirect to login page immediately (use window.location for hard redirect)
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      // If in admin, redirect to admin login
      window.location.replace('/login');
    } else {
      // Otherwise redirect to home
      window.location.replace('/');
    }
  };

  const sendSmsCode = async (phone: string, username?: string) => {
    // DEV MODE: Skip SMS in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/auth/sms/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send SMS code');
    }

    return await response.json();
  };

  const loginWithSmsVerification = async (username: string, password: string, phone: string, code: string) => {
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

    // PRODUCTION: Real login with SMS verification
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_URL}/api/auth/sms/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for HttpOnly tokens
      body: JSON.stringify({ username, password, phone, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'SMS verification failed');
    }

    const data = await response.json();
    
    // Store tokens and user
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      // Development: Store in localStorage
      localStorage.setItem('auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    } else {
      // Production: Tokens are in HttpOnly cookies, but we still need access_token for Authorization header
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
      }
    }
    // Check if user changed (for cart clearing)
    const previousUserId = user?.id;
    const newUserId = data.user.id;
    if (previousUserId && previousUserId !== newUserId) {
      clearCart(); // Clear cart if user switched
    }
    
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    
    setUser(data.user);
    
    // Set up automatic token refresh
    if (data.refresh_token) {
      if (!isProduction) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      setupTokenRefresh(data.refresh_token || 'cookie');
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
        sendSmsCode,
        loginWithSmsVerification,
        setUser,
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

