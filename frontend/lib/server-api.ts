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
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_URL}/api/tenants/${slug}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    const validated = safeParse(TenantSchema, data, data as Tenant);
    return withTenantThemeDefaults(validated);
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
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
  
  // Check hostname first
  if (hostname.includes('pornopizza')) {
    return 'pornopizza';
  } else if (hostname.includes('pizzavnudzi')) {
    return 'pizzavnudzi';
  }
  
  // Check referer as fallback
  if (referer.includes('pornopizza')) {
    return 'pornopizza';
  } else if (referer.includes('pizzavnudzi')) {
    return 'pizzavnudzi';
  }
  
  // Check URL search params from referer
  try {
    const url = new URL(referer || 'http://localhost:3001');
    const tenantParam = url.searchParams.get('tenant');
    if (tenantParam) {
      return tenantParam;
    }
  } catch {
    // Ignore URL parsing errors
  }
  
  // Default fallback
  return 'pornopizza';
}
