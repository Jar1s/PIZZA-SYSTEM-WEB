'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  phoneVerified?: boolean;
  role: 'CUSTOMER';
  googleId?: string | null;
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
  const { clearCart } = useCart();
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to load user from localStorage
    const loadUser = () => {
      try {
        const token = localStorage.getItem('customer_auth_token');
        const storedUser = localStorage.getItem('customer_auth_user');

        console.log('CustomerAuthContext - loadUser called, token:', !!token, 'storedUser:', !!storedUser);

        if (token && storedUser) {
          try {
            const newUser = JSON.parse(storedUser);
            console.log('CustomerAuthContext - loaded user from localStorage:', newUser.email);
            // Check if user changed (for cart clearing) - compare with current state
            setUser((prevUser) => {
              if (prevUser && prevUser.id !== newUser.id) {
                clearCart(); // Clear cart if user switched
              }
              return newUser;
            });
          } catch (e) {
            console.error('CustomerAuthContext - error parsing stored user:', e);
            localStorage.removeItem('customer_auth_token');
            localStorage.removeItem('customer_auth_refresh_token');
            localStorage.removeItem('customer_auth_user');
            setUser((prevUser) => {
              if (prevUser) {
                clearCart(); // Clear cart when user is removed
              }
              return null;
            });
          }
        } else {
          console.log('CustomerAuthContext - no token or user in localStorage');
          // User logged out - clear cart
          setUser((prevUser) => {
            if (prevUser) {
              clearCart();
            }
            return null;
          });
        }
      } catch (error) {
        console.error('CustomerAuthContext - error in loadUser:', error);
        setUser(null);
      } finally {
        // Always set loading to false, even if there's an error
        setLoading(false);
      }
    };

    // Load user on mount
    loadUser();
    
    // Also try loading after a short delay in case localStorage wasn't ready
    const delayedLoad = setTimeout(() => {
      const token = localStorage.getItem('customer_auth_token');
      const storedUser = localStorage.getItem('customer_auth_user');
      if (token && storedUser && !user) {
        console.log('CustomerAuthContext - delayed load: user found but not loaded, reloading...');
        loadUser();
      }
    }, 200);

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
      // Small delay to ensure localStorage is written
      setTimeout(() => {
        loadUser();
      }, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customerAuthUpdate', handleCustomStorage);

    return () => {
      clearTimeout(delayedLoad);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customerAuthUpdate', handleCustomStorage);
    };
  }, []);

  // Helper function to decode JWT token and get expiration time
  const getTokenExpiration = (token: string): number | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async (): Promise<void> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, refresh token might be in HttpOnly cookie
    // In development, get it from localStorage
    const refreshTokenValue = isProduction 
      ? 'cookie' // Placeholder - actual token is in HttpOnly cookie (if implemented)
      : localStorage.getItem('customer_auth_refresh_token');
    
    if (!refreshTokenValue && !isProduction) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/auth/customer/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for HttpOnly tokens
      body: JSON.stringify({ 
        refresh_token: isProduction 
          ? undefined // Don't send in body if it's in cookie
          : refreshTokenValue 
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update access token
    localStorage.setItem('customer_auth_token', data.access_token);
    if (data.user) {
      localStorage.setItem('customer_auth_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    
    // Setup next refresh
    if (data.access_token) {
      setupTokenRefresh(data.access_token);
    }
  };

  // Setup automatic token refresh 5 minutes before expiration
  const setupTokenRefresh = (accessToken: string) => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    const expiration = getTokenExpiration(accessToken);
    if (!expiration) {
      console.warn('Could not determine token expiration, using fallback interval');
      // Fallback: refresh every 50 minutes
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear auth on refresh failure
          localStorage.removeItem('customer_auth_token');
          localStorage.removeItem('customer_auth_refresh_token');
          localStorage.removeItem('customer_auth_user');
          setUser(null);
        }
      }, 50 * 60 * 1000); // 50 minutes
      return;
    }

    const now = Date.now();
    const timeUntilExpiration = expiration - now;
    const refreshTime = timeUntilExpiration - (5 * 60 * 1000); // 5 minutes before expiration

    if (refreshTime <= 0) {
      // Token expires soon, refresh immediately
      refreshAccessToken().catch((error) => {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
        setUser(null);
      });
      return;
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear auth on refresh failure
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
        setUser(null);
      }
    }, refreshTime);
  };

  // Setup token refresh when user is loaded
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('customer_auth_token');
      if (token) {
        setupTokenRefresh(token);
      }
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [user]);

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

    // Check if user changed (for cart clearing)
    const previousUserId = user?.id;
    const newUserId = data.user.id;
    if (previousUserId && previousUserId !== newUserId) {
      clearCart(); // Clear cart if user switched
    }

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

    // Setup token refresh
    if (data.access_token) {
      setupTokenRefresh(data.access_token);
    }

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

    // Check if user changed (for cart clearing)
    const previousUserId = user?.id;
    const newUserId = data.user.id;
    if (previousUserId && previousUserId !== newUserId) {
      clearCart(); // Clear cart if user switched
    }

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

    // Setup token refresh
    if (data.access_token) {
      setupTokenRefresh(data.access_token);
    }

    return {
      needsSmsVerification: data.needsSmsVerification,
      userId: data.user.id,
    };
  };

  const loginWithGoogle = async (returnUrlOverride?: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Get tenant from hostname or URL params
    const searchParams = new URLSearchParams(window.location.search);
    const hostname = window.location.hostname.toLowerCase();
    let tenant = 'pornopizza';
    if (hostname.includes('pizzaparty')) tenant = 'partypizza';
    else if (hostname.includes('pizzavnudzi')) tenant = 'pizzavnudzi';
    else if (hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) tenant = 'pornopizza';
    else if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('vercel.app')) {
      tenant = searchParams.get('tenant') || 'pornopizza';
    } else {
      tenant = searchParams.get('tenant') || tenant;
    }

    // Get returnUrl from query or override
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

  const loginWithApple = async (returnUrlOverride?: string) => {
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
    
    // Redirect to Apple OAuth with state (use btoa for browser base64 encoding)
    const stateParam = btoa(JSON.stringify(state));
    const appleUrl = `${API_URL}/api/auth/customer/apple?tenant=${encodeURIComponent(tenant)}&state=${encodeURIComponent(stateParam)}`;
    
    window.location.href = appleUrl;
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

    // Check if user changed (for cart clearing)
    const previousUserId = user?.id;
    const newUserId = data.user.id;
    if (previousUserId && previousUserId !== newUserId) {
      clearCart(); // Clear cart if user switched
    }

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
    
    // Setup token refresh
    if (data.access_token) {
      setupTokenRefresh(data.access_token);
    }
    
    // Force a small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const logout = async () => {
    // Clear refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    // Clear cart when logging out
    clearCart();
    
    // Clear local storage (but keep cookie settings - they are per user and should persist)
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
