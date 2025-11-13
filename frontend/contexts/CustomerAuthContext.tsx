'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER';
}

interface CustomerAuthContextType {
  user: CustomerUser | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<{ needsSmsVerification: boolean; userId: string }>;
  login: (email: string, password: string) => Promise<{ needsSmsVerification: boolean; userId: string }>;
  loginWithGoogle: (returnUrlOverride?: string) => Promise<void>;
  loginWithApple: () => Promise<void>;
  verifyPhone: (phone: string, code: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: CustomerUser | null) => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Function to load user from localStorage
    const loadUser = () => {
      const token = localStorage.getItem('customer_auth_token');
      const storedUser = localStorage.getItem('customer_auth_user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('customer_auth_token');
          localStorage.removeItem('customer_auth_refresh_token');
          localStorage.removeItem('customer_auth_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    // Load user on mount
    loadUser();

    // Listen for storage changes (when OAuth callback updates localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customer_auth_user' || e.key === 'customer_auth_token') {
        console.log('CustomerAuthContext - storage changed, reloading user');
        loadUser();
      }
    };

    // Listen for custom event (dispatched by OAuth callback in same window)
    const handleCustomStorage = () => {
      console.log('CustomerAuthContext - custom storage event, reloading user');
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customerAuthUpdate', handleCustomStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customerAuthUpdate', handleCustomStorage);
    };
  }, []);

  const register = async (email: string, password: string, name: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${API_URL}/api/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();

    // Store tokens and user
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      localStorage.setItem('customer_auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('customer_auth_refresh_token', data.refresh_token);
      }
    } else {
      if (data.access_token) {
        localStorage.setItem('customer_auth_token', data.access_token);
      }
    }
    localStorage.setItem('customer_auth_user', JSON.stringify(data.user));
    setUser(data.user);

    return {
      needsSmsVerification: data.needsSmsVerification,
      userId: data.user.id,
    };
  };

  const login = async (email: string, password: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${API_URL}/api/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // Store tokens and user
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      localStorage.setItem('customer_auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('customer_auth_refresh_token', data.refresh_token);
      }
    } else {
      if (data.access_token) {
        localStorage.setItem('customer_auth_token', data.access_token);
      }
    }
    localStorage.setItem('customer_auth_user', JSON.stringify(data.user));
    setUser(data.user);

    return {
      needsSmsVerification: data.needsSmsVerification,
      userId: data.user.id,
    };
  };

  const loginWithGoogle = async (returnUrlOverride?: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Get tenant and returnUrl from current page
    const searchParams = new URLSearchParams(window.location.search);
    const tenant = searchParams.get('tenant') || 'pornopizza';
    const returnUrlFromQuery = searchParams.get('returnUrl') || undefined;
    
    // Build effectiveReturnUrl from override, query param, or sessionStorage
    let effectiveReturnUrl: string | undefined;
    if (returnUrlOverride) {
      effectiveReturnUrl = returnUrlOverride;
    } else if (returnUrlFromQuery) {
      effectiveReturnUrl = returnUrlFromQuery;
    } else if (typeof window !== 'undefined') {
      const storedReturnUrl = sessionStorage.getItem('oauth_requested_returnUrl');
      if (storedReturnUrl) {
        effectiveReturnUrl = storedReturnUrl;
      }
    }
    
    // Build state with effectiveReturnUrl and tenant
    const state: { returnUrl?: string; tenant?: string } = {};
    if (effectiveReturnUrl) {
      state.returnUrl = effectiveReturnUrl;
      // Keep session key in sync so callback can read it later
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_requested_returnUrl', effectiveReturnUrl);
      }
    }
    state.tenant = tenant;
    
    // Redirect to Google OAuth with state (use btoa for browser base64 encoding)
    const stateParam = btoa(JSON.stringify(state));
    const googleUrl = `${API_URL}/api/auth/customer/google?state=${encodeURIComponent(stateParam)}`;
    
    window.location.href = googleUrl;
  };

  const loginWithApple = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Get tenant and returnUrl from current page
    const searchParams = new URLSearchParams(window.location.search);
    const tenant = searchParams.get('tenant') || 'pornopizza';
    const returnUrl = searchParams.get('returnUrl') || undefined;
    
    // Redirect to Apple OAuth (placeholder - will show error)
    const appleUrlParams = new URLSearchParams({ tenant });
    if (returnUrl) {
      appleUrlParams.set('returnUrl', returnUrl);
    }
    const appleUrl = `${API_URL}/api/auth/customer/apple?${appleUrlParams.toString()}`;
    
    try {
      const response = await fetch(appleUrl, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Apple OAuth not yet implemented');
      }
      
      // If redirect URL is returned, redirect to it
      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error: any) {
      alert(error.message || 'Apple OAuth is not yet implemented. Please use email/password login.');
    }
  };

  const verifyPhone = async (phone: string, code: string, userId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${API_URL}/api/auth/customer/verify-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone, code, userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
    }

    const data = await response.json();

    // Update tokens and user
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      localStorage.setItem('customer_auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('customer_auth_refresh_token', data.refresh_token);
      }
    } else {
      if (data.access_token) {
        localStorage.setItem('customer_auth_token', data.access_token);
      }
    }
    localStorage.setItem('customer_auth_user', JSON.stringify(data.user));
    setUser(data.user);
    
    // Force a small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const logout = async () => {
    // Clear local storage
    localStorage.removeItem('customer_auth_token');
    localStorage.removeItem('customer_auth_refresh_token');
    localStorage.removeItem('customer_auth_user');
    setUser(null);

    // Redirect to home
    router.push('/');
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        loginWithGoogle,
        loginWithApple,
        verifyPhone,
        logout,
        setUser,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}

