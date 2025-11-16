/**
 * Helper functions for API calls with automatic 401 handling
 */

/**
 * Handle 401 Unauthorized response - clear auth and redirect to login
 */
export async function handle401Response(tenant: string = 'pornopizza'): Promise<void> {
  // Clear auth data
  localStorage.removeItem('customer_auth_token');
  localStorage.removeItem('customer_auth_refresh_token');
  localStorage.removeItem('customer_auth_user');
  
  // Dispatch event to notify auth context and show toast
  if (typeof window !== 'undefined') {
    // Dispatch custom event for toast notification
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        message: 'Vaša relácia vypršala. Prosím, prihláste sa znova.',
        type: 'error',
      }
    }));
    
    // Notify auth context
    window.dispatchEvent(new Event('customerAuthUpdate'));
    
    // Small delay before redirect to show toast
    setTimeout(() => {
      window.location.href = `/auth/login?tenant=${tenant}`;
    }, 1000);
  }
}

/**
 * Fetch wrapper that automatically handles 401 responses
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  tenant: string = 'pornopizza'
): Promise<Response> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  // Get token
  const token = localStorage.getItem('customer_auth_token');
  
  // Add Authorization header if token exists
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Make request
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  
  // Handle 401 - token expired
  if (response.status === 401) {
    await handle401Response(tenant);
    throw new Error('Session expired. Please log in again.');
  }
  
  return response;
}

