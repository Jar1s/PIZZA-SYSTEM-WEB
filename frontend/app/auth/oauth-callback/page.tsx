'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { validateReturnUrl } from '@/lib/validate-return-url';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    // Try to read from document.cookie (works for cookies without domain or with matching domain)
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift() || null;
      if (cookieValue) {
        return cookieValue;
      }
    }

    return null;
  };

  // Helper function to delete cookie. The OAuth handoff cookies are set with a
  // dot-prefixed apex domain, so expire both the host-only and domain variants —
  // deleting without the domain attribute would leave the domain cookie alive.
  const deleteCookie = (name: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    const apex = window.location.hostname.replace(/^www\./, '');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${apex};`;
  };

  // Extract token processing to separate function.
  // Note: the refresh token is delivered as an HttpOnly `refresh_token` cookie
  // (unreadable from JS by design) and consumed directly by POST /refresh.
  const processOAuthTokens = useCallback((accessToken: string, userDataStr: string, redirect: string) => {
    if (accessToken && userDataStr) {
      try {
        // Parse user data from cookie
        const userData = JSON.parse(userDataStr);

        // Store tokens in localStorage
        localStorage.setItem('customer_auth_token', accessToken);
        if (userData) {
          localStorage.setItem('customer_auth_user', JSON.stringify(userData));
        }

        // Clear temporary cookies
        deleteCookie('oauth_access_token');
        deleteCookie('oauth_user_data');

        // Always store returnUrl in sessionStorage FIRST, before any redirects
        // This ensures checkout page can check it even if user lands there before redirect completes
        if (redirect) {
          sessionStorage.setItem('oauth_returnUrl', redirect);

          // Remove oauth_requested_returnUrl so future login starts clean
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('oauth_requested_returnUrl');
          }
        }
        
        // Set flag in sessionStorage ONLY if redirecting to checkout
        // This prevents checkout page from redirecting to homepage if cart is still hydrating
        // But don't set it for other pages like account
        if (redirect.includes('/checkout')) {
          sessionStorage.setItem('oauth_redirect', 'true');
        } else {
          // Clear flag if redirecting elsewhere (e.g., account page)
          sessionStorage.removeItem('oauth_redirect');
        }

        // Dispatch custom event to notify context that tokens were updated (same window)
        // Storage event only fires in other windows/tabs, so we need a custom event
        window.dispatchEvent(new Event('customerAuthUpdate'));
        // Also dispatch storage event for cross-tab compatibility
        window.dispatchEvent(new Event('storage'));

        // Ensure redirect URL is absolute (starts with /)
        const finalRedirect = redirect.startsWith('/') ? redirect : `/${redirect}`;

        // If redirecting to account (or other non-checkout page), wait a bit for context to update
        // Give CustomerAuthContext time to load user from localStorage
        if (!finalRedirect.includes('/checkout')) {
          // Clear any OAuth flags since we're not going to checkout
          sessionStorage.removeItem('oauth_redirect');
          // Wait a bit to ensure CustomerAuthContext has time to load user from localStorage
          setTimeout(() => {
            window.location.href = finalRedirect;
          }, 300);
          return;
        }

        // Only wait if redirecting to checkout (cart might need to hydrate)
        // Wait a bit to ensure localStorage is written and context is updated
        // Give context time to process the custom event and update user state
        setTimeout(() => {
          // Set flag for checkout
          sessionStorage.setItem('oauth_redirect', 'true');
          // Small delay to ensure context has updated
          setTimeout(() => {
            window.location.href = finalRedirect;
          }, 100);
        }, 800);
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        // Clear cookies on error
        deleteCookie('oauth_access_token');
        deleteCookie('oauth_user_data');
        // Redirect to login on error
        window.location.href = '/auth/login?error=oauth_callback_failed&tenant=pornopizza';
      }
    }
  }, []);

  useEffect(() => {
    const tokensParam = searchParams.get('tokens');
    const redirectParam = searchParams.get('redirect');
    
    // Prefer sessionStorage.oauth_requested_returnUrl (after validateReturnUrl)
    let redirect: string | undefined;
    if (typeof window !== 'undefined') {
      const requestedReturnUrl = sessionStorage.getItem('oauth_requested_returnUrl');
      if (requestedReturnUrl) {
        const validated = validateReturnUrl(requestedReturnUrl);
        if (validated) {
          redirect = validated;
        }
      }
    }
    
    // Fallback to redirectParam if no sessionStorage value
    if (!redirect) {
      if (redirectParam) {
        redirect = decodeURIComponent(redirectParam);
      } else {
        // Default to checkout instead of account, since most OAuth logins happen during checkout
        // Try to get tenant from URL or use default
        const tenantFromUrl = searchParams.get('tenant') || 'pornopizza';
        redirect = `/checkout?tenant=${tenantFromUrl}`;
      }
    }
    
    // Validate returnUrl to prevent open redirect attacks
    const validatedRedirect = validateReturnUrl(redirect);
    if (!validatedRedirect) {
      console.warn('Invalid redirect URL, using default checkout:', redirect);
      // Default to checkout instead of account
      const tenantFromUrl = searchParams.get('tenant') || 'pornopizza';
      redirect = `/checkout?tenant=${tenantFromUrl}`;
    } else {
      redirect = validatedRedirect;
    }

    // Try tokens parameter first (development mode - base64 encoded JSON)
    if (tokensParam) {
      try {
        // Decode tokens from URL
        const tokensJson = atob(tokensParam);
        const tokens = JSON.parse(tokensJson);

        // Store tokens in localStorage
        if (tokens.access_token) {
          localStorage.setItem('customer_auth_token', tokens.access_token);
        }
        if (tokens.refresh_token) {
          localStorage.setItem('customer_auth_refresh_token', tokens.refresh_token);
        }
        if (tokens.user) {
          localStorage.setItem('customer_auth_user', JSON.stringify(tokens.user));
        }

        // Always store returnUrl in sessionStorage FIRST, before any redirects
        if (redirect) {
          sessionStorage.setItem('oauth_returnUrl', redirect);

          // Remove oauth_requested_returnUrl so future login starts clean
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('oauth_requested_returnUrl');
          }
        }
        
        // Set flag in sessionStorage ONLY if redirecting to checkout
        if (redirect.includes('/checkout')) {
          sessionStorage.setItem('oauth_redirect', 'true');
        } else {
          sessionStorage.removeItem('oauth_redirect');
        }

        // Dispatch custom event to notify context that tokens were updated
        window.dispatchEvent(new Event('customerAuthUpdate'));
        window.dispatchEvent(new Event('storage'));

        // Ensure redirect URL is absolute (starts with /)
        const finalRedirect = redirect.startsWith('/') ? redirect : `/${redirect}`;

        // If redirecting to account (or other non-checkout page), redirect immediately
        if (!finalRedirect.includes('/checkout')) {
          sessionStorage.removeItem('oauth_redirect');
          window.location.href = finalRedirect;
          return;
        }

        // Only wait if redirecting to checkout (cart might need to hydrate)
        setTimeout(() => {
          sessionStorage.setItem('oauth_redirect', 'true');
          setTimeout(() => {
            window.location.href = finalRedirect;
          }, 100);
        }, 800);
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        window.location.href = '/auth/login?error=oauth_callback_failed&tenant=pornopizza';
      }
    } else {
      // Fallback: Try cookies (production mode)
      const accessToken = getCookie('oauth_access_token');
      const userDataStr = getCookie('oauth_user_data');

      if (accessToken && userDataStr) {
        processOAuthTokens(accessToken, userDataStr, redirect);
      } else {
        // Wait a bit and try again - cookies might not be set yet
        setTimeout(() => {
          const retryAccessToken = getCookie('oauth_access_token');
          const retryUserDataStr = getCookie('oauth_user_data');
          if (retryAccessToken && retryUserDataStr) {
            processOAuthTokens(retryAccessToken, retryUserDataStr, redirect);
          } else {
            console.error('OAuth callback - no OAuth handoff data found after retry, redirecting to login');
            window.location.href = '/auth/login?error=no_tokens&tenant=pornopizza';
          }
        }, 500);
      }
    }
  }, [searchParams, processOAuthTokens]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4">Processing login...</div>
        <div className="text-gray-600">Please wait...</div>
      </div>
    </div>
  );
}

