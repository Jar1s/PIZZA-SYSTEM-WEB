/**
 * Server-side API functions for Next.js Server Components
 * These functions can be used in Server Components (no 'use client')
 */

import { Tenant, Product } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { TenantSchema, ProductSchema, safeParse } from '@/lib/schemas/api.schema';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getTenantServer(slug: string): Promise<Tenant | null> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const url = `${API_URL}/api/tenants/${slug}`;
      if (attempt === 1) {
        console.log(`[getTenantServer] Fetching from: ${url}`);
        console.log(`[getTenantServer] API_URL: ${API_URL}`);
      } else {
        console.log(`[getTenantServer] Retry attempt ${attempt}/${maxRetries} - Fetching from: ${url}`);
      }
      
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 0 },
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[getTenantServer] HTTP ${res.status}: ${errorText.substring(0, 200)}`);
        
        // If backend returns FUNCTION_INVOCATION_FAILED, log it
        if (errorText.includes('FUNCTION_INVOCATION_FAILED')) {
          console.error('[getTenantServer] Backend function failed - check backend logs on Render.com');
        }
        
        // Log the full error for debugging
        console.error(`[getTenantServer] Full error response:`, errorText);
        
        // Retry on server errors (5xx) or 500 specifically
        if (res.status >= 500 && attempt < maxRetries) {
          const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
          console.log(`[getTenantServer] Server error (${res.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry on client errors (4xx)
        return null;
      }
      
      const data = await res.json();
      console.log(`[getTenantServer] Received tenant data:`, { name: data.name, slug: data.slug, hasTheme: !!data.theme });
      
      const validated = safeParse(TenantSchema, data, data as any);
      const result = withTenantThemeDefaults(validated);
      
      if (!result) {
        console.error('[getTenantServer] Failed to normalize tenant data');
        return null;
      }
      
      console.log(`[getTenantServer] Validated tenant:`, { name: result.name, slug: result.slug });
      
      return result;
    } catch (error: any) {
      console.error(`[getTenantServer] Attempt ${attempt} failed:`, error.message || error);
      
      // Retry on timeout or network errors
      if ((error.name === 'AbortError' || error.message?.includes('fetch failed')) && attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
        console.log(`[getTenantServer] Network/timeout error, retrying in ${delay}ms...`);
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
        } else if (error.message?.includes('ECONNREFUSED')) {
          console.error('[getTenantServer] Connection refused - backend is not running or not accessible');
        }
      }
      
      // Last attempt failed
      if (attempt === maxRetries) {
        return null;
      }
    }
  }
  
  return null;
}

export async function getProductsServer(tenantSlug: string): Promise<Product[]> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      // Use no-store and add timestamp to prevent caching
      const timestamp = Date.now();
      const url = `${API_URL}/api/${tenantSlug}/products?t=${timestamp}`;
      
      if (attempt === 1) {
        console.log(`[getProductsServer] Fetching from: ${url}`);
      } else {
        console.log(`[getProductsServer] Retry attempt ${attempt}/${maxRetries} - Fetching from: ${url}`);
      }
      
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        next: { revalidate: 0 }, // Disable Next.js cache
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
          console.log(`[getProductsServer] Server error (${res.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry on client errors (4xx) - return empty array
        return [];
      }
      
      const data = await res.json();
      
      // Validate products array
      if (Array.isArray(data)) {
        const validated = data.map(product => safeParse(ProductSchema, product, product as any)) as Product[];
        console.log(`[getProductsServer] Loaded ${validated.length} products`);
        return validated;
      }
      
      console.warn('[getProductsServer] Response is not an array, returning empty array');
      return [];
    } catch (error: any) {
      console.error(`[getProductsServer] Attempt ${attempt} failed:`, error.message || error);
      
      // Retry on timeout or network errors
      if ((error.name === 'AbortError' || error.message?.includes('fetch failed')) && attempt < maxRetries) {
        const delay = retryDelay * attempt; // Exponential backoff: 1s, 2s, 3s
        console.log(`[getProductsServer] Network/timeout error, retrying in ${delay}ms...`);
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
      
      // Last attempt failed - return empty array to show skeleton
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
  const hostname = headers.get('host') || '';
  const referer = headers.get('referer') || '';
  const xTenant = headers.get('x-tenant'); // Set by middleware
  
  // First check x-tenant header (set by middleware) - highest priority
  if (xTenant && (xTenant === 'pornopizza' || xTenant === 'pizzavnudzi')) {
    return xTenant;
  }
  
  // For Vercel URLs, NEVER extract from hostname - always use default or query param
  if (hostname.includes('vercel.app')) {
    // Check referer for query param
    try {
      const url = new URL(referer || 'http://localhost:3001');
      const tenantParam = url.searchParams.get('tenant');
      if (tenantParam && (tenantParam === 'pornopizza' || tenantParam === 'pizzavnudzi')) {
        return tenantParam;
      }
    } catch {
      // Ignore URL parsing errors
    }
    // Default for Vercel URLs (don't extract from hostname!)
    return 'pornopizza';
  }
  
  // Check hostname for known production domains (only for real domains, not Vercel)
  if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk')) {
    return 'pornopizza';
  } else if (hostname.includes('pizzavnudzi.sk')) {
    return 'pizzavnudzi';
  } else if ((hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) && !hostname.includes('vercel.app')) {
    return 'pornopizza';
  } else if (hostname.includes('pizzavnudzi') && !hostname.includes('vercel.app')) {
    return 'pizzavnudzi';
  }
  
  // Check referer as fallback
  if (referer.includes('pornopizza') && !referer.includes('vercel.app')) {
    return 'pornopizza';
  } else if (referer.includes('pizzavnudzi') && !referer.includes('vercel.app')) {
    return 'pizzavnudzi';
  }
  
  // Check URL search params from referer
  try {
    const url = new URL(referer || 'http://localhost:3001');
    const tenantParam = url.searchParams.get('tenant');
    if (tenantParam && (tenantParam === 'pornopizza' || tenantParam === 'pizzavnudzi')) {
      return tenantParam;
    }
  } catch {
    // Ignore URL parsing errors
  }
  
  // Default fallback
  return 'pornopizza';
}
