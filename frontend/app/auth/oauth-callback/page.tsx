'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokensParam = searchParams.get('tokens');
    const redirectParam = searchParams.get('redirect');
    
    // Always redirect to checkout (default or from redirectParam)
    const redirect = redirectParam 
      ? decodeURIComponent(redirectParam)
      : '/checkout?tenant=pornopizza';
    
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

        // Dispatch storage event to notify context that tokens were updated
        window.dispatchEvent(new Event('storage'));

        // Wait a bit to ensure localStorage is written and context is updated
        setTimeout(() => {
          // Force full page reload to ensure context picks up the new user
          console.log('OAuth callback - redirecting now to:', redirect);
          window.location.href = redirect;
        }, 500);
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

