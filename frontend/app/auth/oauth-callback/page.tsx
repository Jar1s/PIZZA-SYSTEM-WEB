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
        console.log(`OAuth callback - found cookie ${name}:`, cookieValue.substring(0, 20) + '...');
        return cookieValue;
      }
    }
    
    // If not found, log for debugging
    console.log(`OAuth callback - cookie ${name} not found in document.cookie`);
    console.log('OAuth callback - all cookies:', document.cookie);
    return null;
  };

  // Helper function to delete cookie
  const deleteCookie = (name: string) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  };

  // Extract token processing to separate function
  const processOAuthTokens = useCallback((accessToken: string, userDataStr: string, refreshToken: string | null, redirect: string) => {
    if (accessToken && userDataStr) {
      try {
        // Parse user data from cookie
        const userData = JSON.parse(userDataStr);

        console.log('OAuth callback - parsed user data, user:', userData.email);

        // Store tokens in localStorage
        localStorage.setItem('customer_auth_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('customer_auth_refresh_token', refreshToken);
        }
        if (userData) {
          localStorage.setItem('customer_auth_user', JSON.stringify(userData));
        }

        // Clear temporary cookies
        deleteCookie('oauth_access_token');
        deleteCookie('oauth_refresh_token');
        deleteCookie('oauth_user_data');

        console.log('OAuth callback - tokens stored, redirecting to:', redirect);

        // Always store returnUrl in sessionStorage FIRST, before any redirects
        // This ensures checkout page can check it even if user lands there before redirect completes
        if (redirect) {
          sessionStorage.setItem('oauth_returnUrl', redirect);
          console.log('OAuth callback - oauth_returnUrl stored in sessionStorage:', redirect);
          
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
          console.log('OAuth callback - OAuth flag set in sessionStorage (redirecting to checkout)');
        } else {
          // Clear flag if redirecting elsewhere (e.g., account page)
          sessionStorage.removeItem('oauth_redirect');
          console.log('OAuth callback - OAuth flag cleared (redirecting to non-checkout page):', redirect);
        }

        // Dispatch custom event to notify context that tokens were updated (same window)
        // Storage event only fires in other windows/tabs, so we need a custom event
        window.dispatchEvent(new Event('customerAuthUpdate'));
        // Also dispatch storage event for cross-tab compatibility
        window.dispatchEvent(new Event('storage'));

        // Ensure redirect URL is absolute (starts with /)
        const finalRedirect = redirect.startsWith('/') ? redirect : `/${redirect}`;
        console.log('OAuth callback - final redirect URL:', finalRedirect);

        // If redirecting to account (or other non-checkout page), redirect immediately
        // Don't wait - we want to get user to their intended destination ASAP
        if (!finalRedirect.includes('/checkout')) {
          console.log('OAuth callback - redirecting immediately to non-checkout page:', finalRedirect);
          // Clear any OAuth flags since we're not going to checkout
          sessionStorage.removeItem('oauth_redirect');
          // Redirect immediately without delay
          window.location.href = finalRedirect;
          return;
        }
        
        // Only wait if redirecting to checkout (cart might need to hydrate)
        // Wait a bit to ensure localStorage is written and context is updated
        // Give context time to process the custom event and update user state
        setTimeout(() => {
          // Force full page reload to ensure context picks up the new user
          console.log('OAuth callback - redirecting now to checkout:', finalRedirect);
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
        deleteCookie('oauth_refresh_token');
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
      redirect = redirectParam 
        ? decodeURIComponent(redirectParam)
        : '/account?tenant=pornopizza'; // Default to account page instead of checkout
    }
    
    // Validate returnUrl to prevent open redirect attacks
    const validatedRedirect = validateReturnUrl(redirect);
    if (!validatedRedirect) {
      console.warn('Invalid redirect URL, using default:', redirect);
      redirect = '/account?tenant=pornopizza'; // Default to account page instead of checkout
    } else {
      redirect = validatedRedirect;
    }
    
    console.log('OAuth callback - redirect URL:', redirect);
    console.log('OAuth callback - tokens:', !!tokensParam, 'redirect:', redirect);

    // Try tokens parameter first (development mode - base64 encoded JSON)
    if (tokensParam) {
      try {
        // Decode tokens from URL
        const tokensJson = atob(tokensParam);
        const tokens = JSON.parse(tokensJson);

        console.log('OAuth callback - decoded tokens, user:', tokens.user?.email);

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

        console.log('OAuth callback - tokens stored, redirecting to:', redirect);

        // Always store returnUrl in sessionStorage FIRST, before any redirects
        if (redirect) {
          sessionStorage.setItem('oauth_returnUrl', redirect);
          console.log('OAuth callback - oauth_returnUrl stored in sessionStorage:', redirect);
          
          // Remove oauth_requested_returnUrl so future login starts clean
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('oauth_requested_returnUrl');
          }
        }
        
        // Set flag in sessionStorage ONLY if redirecting to checkout
        if (redirect.includes('/checkout')) {
          sessionStorage.setItem('oauth_redirect', 'true');
          console.log('OAuth callback - OAuth flag set in sessionStorage (redirecting to checkout)');
        } else {
          sessionStorage.removeItem('oauth_redirect');
          console.log('OAuth callback - OAuth flag cleared (redirecting to non-checkout page):', redirect);
        }

        // Dispatch custom event to notify context that tokens were updated
        window.dispatchEvent(new Event('customerAuthUpdate'));
        window.dispatchEvent(new Event('storage'));

        // Ensure redirect URL is absolute (starts with /)
        const finalRedirect = redirect.startsWith('/') ? redirect : `/${redirect}`;
        console.log('OAuth callback - final redirect URL:', finalRedirect);

        // If redirecting to account (or other non-checkout page), redirect immediately
        if (!finalRedirect.includes('/checkout')) {
          console.log('OAuth callback - redirecting immediately to non-checkout page:', finalRedirect);
          sessionStorage.removeItem('oauth_redirect');
          window.location.href = finalRedirect;
          return;
        }
        
        // Only wait if redirecting to checkout (cart might need to hydrate)
        setTimeout(() => {
          console.log('OAuth callback - redirecting now to checkout:', finalRedirect);
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
      console.log('OAuth callback - no tokens param, trying cookies...');
      console.log('OAuth callback - current domain:', window.location.hostname);
      console.log('OAuth callback - all cookies:', document.cookie);
      
      const accessToken = getCookie('oauth_access_token');
      const refreshToken = getCookie('oauth_refresh_token');
      const userDataStr = getCookie('oauth_user_data');
      
      console.log('OAuth callback - cookie check results:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        userDataStr: !!userDataStr,
        accessTokenLength: accessToken?.length,
        userDataStrLength: userDataStr?.length,
      });
      
      if (accessToken && userDataStr) {
        console.log('OAuth callback - found tokens in cookies, processing...');
        processOAuthTokens(accessToken, userDataStr, refreshToken, redirect);
      } else {
        console.error('OAuth callback - no tokens found in URL or cookies', {
          hasAccessToken: !!accessToken,
          hasUserData: !!userDataStr,
          allCookies: document.cookie,
          currentDomain: window.location.hostname,
          redirectParam,
        });
        // Wait a bit and try again - cookies might not be set yet
        setTimeout(() => {
          const retryAccessToken = getCookie('oauth_access_token');
          const retryUserDataStr = getCookie('oauth_user_data');
          if (retryAccessToken && retryUserDataStr) {
            console.log('OAuth callback - found tokens on retry, processing...');
            processOAuthTokens(retryAccessToken, retryUserDataStr, refreshToken, redirect);
          } else {
            console.error('OAuth callback - still no tokens after retry, redirecting to login');
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

