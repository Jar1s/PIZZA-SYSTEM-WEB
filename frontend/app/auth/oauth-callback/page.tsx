'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { validateReturnUrl } from '@/lib/validate-return-url';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

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
        : '/checkout?tenant=pornopizza';
    }
    
    // Validate returnUrl to prevent open redirect attacks
    const validatedRedirect = validateReturnUrl(redirect);
    if (!validatedRedirect) {
      console.warn('Invalid redirect URL, using default:', redirect);
      redirect = '/checkout?tenant=pornopizza';
    } else {
      redirect = validatedRedirect;
    }
    
    console.log('OAuth callback - redirect URL:', redirect);

    console.log('OAuth callback - tokens:', !!tokensParam, 'redirect:', redirect);

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
        // Redirect to login on error
        window.location.href = '/auth/login?error=oauth_callback_failed';
      }
    } else {
      console.error('OAuth callback - no tokens found');
      // No tokens, redirect to login
      window.location.href = '/auth/login?error=no_tokens';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4">Processing login...</div>
        <div className="text-gray-600">Please wait...</div>
      </div>
    </div>
  );
}

