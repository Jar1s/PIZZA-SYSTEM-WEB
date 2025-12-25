'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateReturnUrl } from '@/lib/validate-return-url';
import { getTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults, getBackgroundClass, isDarkTheme } from '@/lib/tenant-utils';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Load tenant data
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const hostname = window.location.hostname.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        let tenantSlug = 'pornopizza';
        if (hostname.includes('pizzaparty')) tenantSlug = 'partypizza';
        else if (hostname.includes('pizzavnudzi')) tenantSlug = 'pizzavnudzi';
        else if (hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) tenantSlug = 'pornopizza';
        else if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('vercel.app')) {
          tenantSlug = params.get('tenant') || 'pornopizza';
        } else {
          tenantSlug = params.get('tenant') || tenantSlug;
        }
        
        const tenantData = await getTenant(tenantSlug);
        const normalizedTenant = withTenantThemeDefaults(tenantData);
        setTenant(normalizedTenant);
      } catch (error) {
        console.error('Failed to load tenant:', error);
      }
    };

    loadTenant();
  }, []);

  // Apply body background class
  useEffect(() => {
    if (!tenant) return;
    const layout = tenant.theme?.layout || {};
    if (layout.useCustomBackground && layout.customBackgroundClass === 'porno-bg') {
      document.body.classList.add('bg-porno-vibe');
      return () => {
        document.body.classList.remove('bg-porno-vibe');
      };
    }
  }, [tenant]);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(error === 'access_denied' ? 'Google login was cancelled' : error);
      setTimeout(() => {
        router.push('/auth/login?error=oauth_cancelled');
      }, 2000);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received');
      setTimeout(() => {
        router.push('/auth/login?error=no_code');
      }, 2000);
      return;
    }

    // Send code to backend for exchange
    const exchangeCode = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/auth/customer/google/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to exchange code' }));
          throw new Error(errorData.message || 'Failed to exchange code');
        }

        const data = await response.json();
        
        // Store tokens in localStorage
        if (data.access_token) {
          localStorage.setItem('customer_auth_token', data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem('customer_auth_refresh_token', data.refresh_token);
        }
        if (data.user) {
          localStorage.setItem('customer_auth_user', JSON.stringify(data.user));
        }

        // Parse state for returnUrl
        let returnUrl = '/account?tenant=pornopizza';
        if (state) {
          try {
            const stateData = JSON.parse(atob(state));
            if (stateData.returnUrl) {
              const validated = validateReturnUrl(stateData.returnUrl);
              if (validated) {
                returnUrl = validated;
              }
            }
            if (stateData.tenant) {
              // Add tenant to returnUrl if not already present
              const url = new URL(returnUrl, window.location.origin);
              url.searchParams.set('tenant', stateData.tenant);
              returnUrl = url.pathname + url.search;
            }
          } catch (e) {
            console.warn('Failed to parse state:', e);
          }
        }

        // Store returnUrl in sessionStorage
        sessionStorage.setItem('oauth_returnUrl', returnUrl);
        
        // Set flag if redirecting to checkout
        if (returnUrl.includes('/checkout')) {
          sessionStorage.setItem('oauth_redirect', 'true');
        } else {
          sessionStorage.removeItem('oauth_redirect');
        }

        // Remove requested returnUrl
        sessionStorage.removeItem('oauth_requested_returnUrl');

        // Dispatch events to notify context
        window.dispatchEvent(new Event('customerAuthUpdate'));
        window.dispatchEvent(new Event('storage'));

        // Redirect
        window.location.href = returnUrl;
      } catch (error: any) {
        console.error('Google OAuth exchange error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to complete Google login');
        setTimeout(() => {
          router.push(`/auth/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`);
        }, 2000);
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  // Get theme configuration
  const layout = tenant?.theme?.layout || {};
  const isDark = isDarkTheme(tenant);
  const backgroundClass = getBackgroundClass(tenant);
  const primaryColor = tenant?.theme?.primaryColor || '#E91E63';

  // Show loading state while tenant is loading
  if (!tenant) {
    return (
      <div className="min-h-screen bg-porno-vibe flex items-center justify-center">
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4"
            style={{ borderColor: 'var(--color-primary)' }}
          ></div>
          <p className="mt-4 text-lg text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${backgroundClass} ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <div className="text-center p-8">
          <div className={`text-xl mb-4`} style={{ color: isDark ? '#ff4444' : '#dc2626' }}>❌ Error</div>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{errorMessage || 'An error occurred'}</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center min-h-screen ${backgroundClass} ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <div className="text-center p-8">
        <div 
          className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 mx-auto mb-6"
          style={{ borderColor: primaryColor }}
        ></div>
        <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Processing Google login...</p>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Please wait</p>
      </div>
    </div>
  );
}
