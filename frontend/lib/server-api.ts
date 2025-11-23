/**
 * Server-side API functions for Next.js Server Components
 * These functions can be used in Server Components (no 'use client')
 */

import { Tenant, Product } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { TenantSchema, ProductSchema, safeParse } from '@/lib/schemas/api.schema';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getTenantServer(slug: string): Promise<Tenant | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s for Render.com
    
    const url = `${API_URL}/api/tenants/${slug}`;
    console.log(`[getTenantServer] Fetching from: ${url}`);
    console.log(`[getTenantServer] API_URL: ${API_URL}`);
    
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to fetch options as well
      next: { revalidate: 0 },
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[getTenantServer] HTTP ${res.status}: ${errorText.substring(0, 200)}`);
      console.error(`[getTenantServer] Response headers:`, Object.fromEntries(res.headers.entries()));
      
      // If backend returns FUNCTION_INVOCATION_FAILED, log it
      if (errorText.includes('FUNCTION_INVOCATION_FAILED')) {
        console.error('[getTenantServer] Backend function failed - check backend logs on Render.com');
      }
      
      // Log the full error for debugging
      console.error(`[getTenantServer] Full error response:`, errorText);
      
      return null;
    }
    
    const data = await res.json();
    console.log(`[getTenantServer] Received tenant data:`, { name: data.name, slug: data.slug, hasTheme: !!data.theme });
    
    const validated = safeParse(TenantSchema, data, data as any);
    const result = withTenantThemeDefaults(validated);
    console.log(`[getTenantServer] Validated tenant:`, { name: result.name, slug: result.slug });
    
    return result;
  } catch (error: any) {
    console.error('[getTenantServer] Error:', error.message || error);
    console.error('[getTenantServer] Error stack:', error.stack);
    console.error('[getTenantServer] Error name:', error.name);
    
    // Log more details about the error
    if (error.name === 'AbortError') {
      console.error('[getTenantServer] Request timeout - backend is not responding within 15s');
      console.error('[getTenantServer] Check if backend is running on:', API_URL);
    } else if (error.message?.includes('fetch failed')) {
      console.error('[getTenantServer] Network error - check NEXT_PUBLIC_API_URL:', API_URL);
      console.error('[getTenantServer] This might be a DNS or connection issue');
    } else if (error.message?.includes('ECONNREFUSED')) {
      console.error('[getTenantServer] Connection refused - backend is not running or not accessible');
    }
    
    return null;
  }
}

export async function getProductsServer(tenantSlug: string): Promise<Product[]> {
  try {
    // Use no-store and add timestamp to prevent caching
    const timestamp = Date.now();
    const res = await fetch(`${API_URL}/api/${tenantSlug}/products?t=${timestamp}`, {
      cache: 'no-store',
      next: { revalidate: 0 }, // Disable Next.js cache
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    if (!res.ok) {
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
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
