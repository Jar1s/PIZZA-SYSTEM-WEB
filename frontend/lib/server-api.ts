/**
 * Server-side API functions for Next.js Server Components
 * These functions can be used in Server Components (no 'use client')
 */

import { Tenant, Product } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { TenantSchema, ProductSchema, safeParse } from '@/lib/schemas/api.schema';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const normalizeTenantSlug = (slug?: string): string => {
  const s = (slug || '').trim().toLowerCase();
  if (!s) return 'pornopizza';
  if (s === 'p0rnopizza') return 'pornopizza';
  if (s === 'pizzaparty' || s === 'partypizza') return 'partypizza';
  return s;
};

/**
 * Check if we should skip API fetch (e.g., during build/export when backend is not available)
 * This should ONLY be used during build/export, NEVER in production runtime
 */
function shouldSkipApiFetch(): boolean {
  // Skip if explicitly disabled
  if (process.env.SKIP_API_FETCH_DURING_BUILD === 'true') {
    return true;
  }
  
  // ONLY skip during build/export phase when API is localhost
  // In production runtime, we ALWAYS try to fetch from API (even if it's localhost)
  const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-export';
  
  // During build/export with localhost API, skip fetch to avoid 404 errors
  // But in production runtime, we always try to fetch (even from localhost)
  if (isLocalhost && isBuildPhase) {
    return true;
  }
  
  return false;
}

/**
 * Get fallback tenant data when API is unavailable
 */
function getFallbackTenant(slug: string): Tenant {
  return {
    slug,
    name: slug === 'pornopizza' ? 'PornoPizza' : slug === 'pizzavnudzi' ? 'Pizza v Nudzi' : 'Pizza Ordering',
    isActive: true,
    theme: {
      primaryColor: '#E91E63',
      secondaryColor: '#0F141A',
      favicon: '/favicon.ico',
    },
  } as Tenant;
}

export async function getTenantServer(slug: string): Promise<Tenant | null> {
  // Skip API fetch during build/export if backend is not available
  if (shouldSkipApiFetch()) {
    return withTenantThemeDefaults(getFallbackTenant(slug));
  }
  
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const url = `${API_URL}/api/tenants/${slug}`;

      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[getTenantServer] HTTP ${res.status}: ${errorText.substring(0, 200)}`);
        
        // If backend returns FUNCTION_INVOCATION_FAILED, log it
        if (errorText.includes('FUNCTION_INVOCATION_FAILED')) {
          console.error('[getTenantServer] Backend function failed - check backend logs on Render.com');
        }

        // Retry on server errors (5xx) or 500 specifically
        if (res.status >= 500 && attempt < maxRetries) {
          const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry on client errors (4xx)
        // In production, we return null (not fallback) - let the UI handle the error
        return null;
      }
      
      const data = await res.json();
      const validated = safeParse(TenantSchema, data, data as any);
      const result = withTenantThemeDefaults(validated);

      if (!result) {
        console.error('[getTenantServer] Failed to normalize tenant data');
        return null;
      }

      return result;
    } catch (error: any) {
      console.error(`[getTenantServer] Attempt ${attempt} failed:`, error.message || error);
      
      // Retry on timeout or network errors
      if ((error.name === 'AbortError' || error.message?.includes('fetch failed')) && attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Log error details on last attempt
      if (attempt === maxRetries) {
        console.error('[getTenantServer] All retry attempts failed');
        console.error('[getTenantServer] Error stack:', error.stack);
        console.error('[getTenantServer] Error name:', error.name);
        
        if (error.name === 'AbortError') {
          console.error('[getTenantServer] Request timeout - backend is not responding within 15s');
          console.error('[getTenantServer] Check if backend is running on:', API_URL);
        } else if (error.message?.includes('fetch failed')) {
          console.error('[getTenantServer] Network error - check NEXT_PUBLIC_API_URL:', API_URL);
          console.error('[getTenantServer] This might be a DNS or connection issue');
        } else         if (error.message?.includes('ECONNREFUSED')) {
          console.error('[getTenantServer] Connection refused - backend is not running or not accessible');
        }
      }
      
      // Last attempt failed - return null (not fallback) in production
      // Fallback is only used during build/export via shouldSkipApiFetch()
      if (attempt === maxRetries) {
        return null;
      }
    }
  }
  
  return null;
}

export async function getProductsServer(tenantSlug: string): Promise<Product[]> {
  // Skip API fetch during build/export if backend is not available
  if (shouldSkipApiFetch()) {
    return [];
  }
  
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      // Use no-store and add timestamp to prevent caching
      const timestamp = Date.now();
      const url = `${API_URL}/api/${tenantSlug}/products?t=${timestamp}`;

      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[getProductsServer] HTTP ${res.status}: ${errorText.substring(0, 200)}`);
        
        // Retry on server errors (5xx)
        if (res.status >= 500 && attempt < maxRetries) {
          const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry on client errors (4xx) - return empty array
        // In production, return empty array (products are optional, UI will show skeleton)
        return [];
      }
      
      const data = await res.json();
      
      // Validate products array
      if (Array.isArray(data)) {
        const validated = data.map(product => safeParse(ProductSchema, product, product as any)) as Product[];
        return validated;
      }
      
      console.warn('[getProductsServer] Response is not an array, returning empty array');
      return [];
    } catch (error: any) {
      console.error(`[getProductsServer] Attempt ${attempt} failed:`, error.message || error);
      
      // Retry on timeout or network errors
      if ((error.name === 'AbortError' || error.message?.includes('fetch failed')) && attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Log error details on last attempt
      if (attempt === maxRetries) {
        console.error('[getProductsServer] All retry attempts failed');
        console.error('[getProductsServer] Error stack:', error.stack);
        console.error('[getProductsServer] Error name:', error.name);
        
        if (error.name === 'AbortError') {
          console.error('[getProductsServer] Request timeout - backend is not responding within 10s');
          console.error('[getProductsServer] Check if backend is running on:', API_URL);
        } else if (error.message?.includes('fetch failed')) {
          console.error('[getProductsServer] Network error - check NEXT_PUBLIC_API_URL:', API_URL);
        }
      }
      
      // Last attempt failed - return empty array (products are optional)
      // Fallback is only used during build/export via shouldSkipApiFetch()
      if (attempt === maxRetries) {
        return [];
      }
    }
  }
  
  return [];
}

/**
 * Get tenant slug from headers (for Server Components)
 */
export function getTenantSlugFromHeaders(headers: Headers): string {
  const hostname = (headers.get('host') || '').toLowerCase();
  const referer = (headers.get('referer') || '').toLowerCase();
  const xTenant = headers.get('x-tenant'); // Set by middleware
  
  // First check x-tenant header (set by middleware) - highest priority
  if (xTenant) {
    return normalizeTenantSlug(xTenant);
  }
  
  // For Vercel URLs, NEVER extract from hostname - always use default or query param
  if (hostname.includes('vercel.app')) {
    // Check referer for query param
    try {
      const url = new URL(referer || 'http://localhost:3001');
      const tenantParam = url.searchParams.get('tenant');
      if (tenantParam) {
        return normalizeTenantSlug(tenantParam);
      }
    } catch {
      // Ignore URL parsing errors
    }
    // Default for Vercel URLs (don't extract from hostname!)
    return 'pornopizza';
  }
  
  // Check hostname for known production domains (only for real domains, not Vercel)
  if (hostname.includes('pizzaparty') || hostname.includes('partypizza')) {
    return 'partypizza';
  }
  if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk') || hostname.includes('pornopizza')) {
    return 'pornopizza';
  }
  if (hostname.includes('pizzavnudzi.sk') || hostname.includes('pizzavnudzi')) {
    return 'pizzavnudzi';
  }
  
  // Check referer as fallback
  if (referer.includes('pizzaparty') || referer.includes('partypizza')) {
    return 'partypizza';
  }
  if (referer.includes('pornopizza') || referer.includes('p0rnopizza')) {
    return 'pornopizza';
  }
  if (referer.includes('pizzavnudzi')) {
    return 'pizzavnudzi';
  }
  
  // Check URL search params from referer
  try {
    const url = new URL(referer || 'http://localhost:3001');
    const tenantParam = url.searchParams.get('tenant');
    if (tenantParam) {
      return normalizeTenantSlug(tenantParam);
    }
  } catch {
    // Ignore URL parsing errors
  }
  
  // Default fallback
  return 'pornopizza';
}
