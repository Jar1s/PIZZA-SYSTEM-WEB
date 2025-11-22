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
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s
    
    const url = `${API_URL}/api/tenants/${slug}`;
    console.log(`[getTenantServer] Fetching from: ${url}`);
    
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
        console.error('[getTenantServer] Backend function failed - check backend logs on Vercel');
      }
      
      return null;
    }
    
    const data = await res.json();
    const validated = safeParse(TenantSchema, data, data as any);
    return withTenantThemeDefaults(validated);
  } catch (error: any) {
    console.error('[getTenantServer] Error:', error.message || error);
    
    // Log more details about the error
    if (error.name === 'AbortError') {
      console.error('[getTenantServer] Request timeout - backend is not responding');
    } else if (error.message?.includes('fetch failed')) {
      console.error('[getTenantServer] Network error - check NEXT_PUBLIC_API_URL:', API_URL);
    }
    
    return null;
  }
}

export async function getProductsServer(tenantSlug: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/${tenantSlug}/products`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
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
  if (hostname.includes('pornopizza.sk')) {
    return 'pornopizza';
  } else if (hostname.includes('pizzavnudzi.sk')) {
    return 'pizzavnudzi';
  } else if (hostname.includes('pornopizza') && !hostname.includes('vercel.app')) {
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
