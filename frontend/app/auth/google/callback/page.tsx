'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateReturnUrl } from '@/lib/validate-return-url';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-700 mb-4">{errorMessage || 'An error occurred'}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Processing Google login...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait</p>
      </div>
    </div>
  );
}

