// Local fallback types because shared package is missing some exports in the deployed bundle
import { Tenant, Product, Order, OrderStatus } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults, getTenantSlug } from '@/lib/tenant-utils';
import { TenantSchema, ProductSchema, OrderSchema, safeParse } from '@/lib/schemas/api.schema';

// ProductTenantOverride is missing from shared typings here, so use a permissive type.
type ProductTenantOverride = any;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const normalizeTenantSlug = (slug: string): string => {
  if (slug === 'p0rnopizza') return 'pornopizza';
  if (slug === 'pizzaparty') return 'partypizza';
  return slug;
};

export async function getTenant(slug: string): Promise<Tenant> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    const normalizedSlug = normalizeTenantSlug(slug);
    
    console.log(`[getTenant] Fetching tenant: ${API_URL}/api/tenants/${normalizedSlug}`);
    
    let res = await fetch(`${API_URL}/api/tenants/${normalizedSlug}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok && res.status === 404) {
      const alt =
        normalizedSlug === 'partypizza'
          ? 'pizzaparty'
          : normalizedSlug === 'pizzaparty'
            ? 'partypizza'
            : null;
      if (alt) {
        console.warn(`[getTenant] ${normalizedSlug} 404, trying fallback slug: ${alt}`);
        res = await fetch(`${API_URL}/api/tenants/${alt}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[getTenant] HTTP error ${res.status}:`, errorText);
      throw new Error(`Tenant not found: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('[getTenant] Received data:', { name: data.name, slug: data.slug, hasTheme: !!data.theme });
    
    // ALWAYS log full theme structure for debugging
    console.log('[getTenant] DEBUG: Full theme from API:', JSON.stringify(data.theme, null, 2));
    console.log('[getTenant] DEBUG: openingHours from API:', data.theme?.openingHours ? JSON.stringify(data.theme.openingHours, null, 2) : 'NOT PRESENT');
    console.log('[getTenant] DEBUG: maintenanceMode from API:', data.theme?.maintenanceMode !== undefined ? data.theme.maintenanceMode : 'NOT PRESENT');
    
    const validated = safeParse(TenantSchema, data, data as any);
    const result = withTenantThemeDefaults(validated) as Tenant;
    console.log('[getTenant] Validated tenant:', { name: result.name, slug: result.slug });
    
    // ALWAYS log theme after validation
    const resultTheme = result.theme as any;
    console.log('[getTenant] DEBUG: Full theme after validation:', JSON.stringify(resultTheme, null, 2));
    console.log('[getTenant] DEBUG: openingHours after validation:', resultTheme?.openingHours ? JSON.stringify(resultTheme.openingHours, null, 2) : 'NOT PRESENT');
    console.log('[getTenant] DEBUG: maintenanceMode after validation:', resultTheme?.maintenanceMode !== undefined ? resultTheme.maintenanceMode : 'NOT PRESENT');
    
    return result;
  } catch (error: any) {
    console.error('[getTenant] Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Backend is not responding');
    }
    // Check for SSL certificate errors
    if (error.message?.includes('ERR_CERT_AUTHORITY_INVALID') || 
        error.message?.includes('certificate') || 
        error.message?.includes('SSL') ||
        error.message?.includes('CERT')) {
      throw new Error('SSL certificate error: The backend SSL certificate is not valid. Please check Render.com SSL configuration.');
    }
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      throw new Error('Backend is not available. Please ensure the backend is running on http://localhost:3000');
    }
    throw error;
  }
}

export async function updateTenant(slug: string, data: any): Promise<Tenant> {
  try {
    const normalizedSlug = normalizeTenantSlug(slug);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`[updateTenant] Updating tenant: ${API_URL}/api/tenants/${normalizedSlug}`, data);
    
    // Debug: Log openingHours if present
    if (data.theme?.openingHours) {
      console.log('[updateTenant] DEBUG: openingHours being sent:', JSON.stringify(data.theme.openingHours, null, 2));
    }
    if (data.theme?.maintenanceMode !== undefined) {
      console.log('[updateTenant] DEBUG: maintenanceMode being sent:', data.theme.maintenanceMode);
    }
    
    const res = await fetch(`${API_URL}/api/tenants/${normalizedSlug}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[updateTenant] HTTP error ${res.status}:`, errorText);
      if (res.status === 401) {
        throw new Error('Unauthorized - Please log in again');
      }
      throw new Error(`Failed to update tenant: ${errorText}`);
    }
    
    const responseData = await res.json();
    console.log('[updateTenant] Tenant updated:', { name: responseData.name, slug: responseData.slug, hasTheme: !!responseData.theme });
    
    // Debug: Log openingHours from response
    if (responseData.theme?.openingHours) {
      console.log('[updateTenant] DEBUG: openingHours received from API:', JSON.stringify(responseData.theme.openingHours, null, 2));
    }
    if (responseData.theme?.maintenanceMode !== undefined) {
      console.log('[updateTenant] DEBUG: maintenanceMode received from API:', responseData.theme.maintenanceMode);
    }
    
    const validated = safeParse(TenantSchema, responseData, responseData as any);
    const result = withTenantThemeDefaults(validated) as Tenant;
    return result;
  } catch (error: any) {
    console.error('[updateTenant] Error:', error);
    throw error;
  }
}

export async function getAllTenants(includeInactive: boolean = false): Promise<Tenant[]> {
  try {
    const url = includeInactive 
      ? `${API_URL}/api/tenants?includeInactive=true`
      : `${API_URL}/api/tenants`;
    
    console.log(`[getAllTenants] Fetching: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[getAllTenants] HTTP error ${res.status}:`, errorText);
      throw new Error(`Failed to fetch tenants: ${errorText}`);
    }
    
    const data = await res.json();
    return data.map((tenant: any) => {
      const validated = safeParse(TenantSchema, tenant, tenant as any);
      return withTenantThemeDefaults(validated) as Tenant;
    });
  } catch (error: any) {
    console.error('[getAllTenants] Error:', error);
    throw error;
  }
}

export async function getProducts(tenantSlug: string): Promise<Product[]> {
  const normalizedSlug = normalizeTenantSlug(tenantSlug);
  // Add timestamp to prevent browser caching
  const timestamp = Date.now();
  const res = await fetch(`${API_URL}/api/products?tenantSlug=${normalizedSlug}&t=${timestamp}`);

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await res.json();
  const validated = safeParse(ProductSchema.array(), data, data as any[]);
  return validated.map((product) => ({
    ...product,
    priceCents: Math.round(product.price * 100),
  }));
}

export async function getOrders(
  token: string,
  tenantSlug: string,
  startDate?: string,
  endDate?: string
): Promise<Order[]> {
  try {
    const normalizedSlug = normalizeTenantSlug(tenantSlug);
    const params = new URLSearchParams({
      tenantSlug: normalizedSlug,
    });

    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }

    console.log('[getOrders] Fetching orders:', { url: `${API_URL}/api/orders?${params.toString()}`, hasToken: !!token, tokenLength: token?.length, headers: ['Authorization'] });

    const res = await fetch(`${API_URL}/api/orders?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Ensure fresh data on each request
    });

    const statusText = res.statusText || '';
    console.log('[OrderList] Response:', { status: res.status, statusText, ok: res.ok });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[getOrders] HTTP error ${res.status}:`, errorText);
      throw new Error(`Failed to fetch orders: ${errorText}`);
    }

    const data = await res.json();
    return safeParse(OrderSchema.array(), data, data as any);
  } catch (error) {
    console.error('[getOrders] Error:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, token: string) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error('Failed to update order status');
  }
}

export async function getProductOverrides(tenantSlug: string): Promise<Record<string, ProductTenantOverride>> {
  const normalizedSlug = normalizeTenantSlug(tenantSlug);
  const res = await fetch(`${API_URL}/api/product-overrides/${normalizedSlug}`);
  if (!res.ok) {
    return {};
  }
  const data = await res.json();
  return data || {};
}

export function getTenantSlugFromHeaders(hostHeader?: string): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(':')[0].toLowerCase();
  
  const knownDomains: Record<string, string> = {
    'p0rnopizza.sk': 'pornopizza',
    'pornopizza.sk': 'pornopizza',
    'www.pornopizza.sk': 'pornopizza',
    'pizzaparty.sk': 'partypizza',
    'www.pizzaparty.sk': 'partypizza',
    'partypizza.sk': 'partypizza',
    'pizzavnudzi.sk': 'pizzavnudzi',
    'www.pizzavnudzi.sk': 'pizzavnudzi',
  };
  
  return knownDomains[host] || null;
}

type StoryousSyncResult = {
  success: boolean;
  storyousOrderId?: string;
  message: string;
};

export type StoryousSettings = {
  clientId: string;
  clientSecret: string;
  merchantId: string;
  placeId: string;
  enabled: boolean;
  autoSync: boolean;
  defaultDeliveryLeadMinutes: number;
  autoAcceptPrintMode: boolean;
  receiptIncludeModifierLines: boolean;
  receiptIncludeOrderNumber: boolean;
};

type WoltAvailabilityResult = {
  promiseId: string;
  feeCents: number;
  etaMinutes: number;
  validUntil: string;
  currency: string;
};

type WoltCreateResult = {
  success?: boolean;
  message?: string;
  trackingUrl?: string;
  [key: string]: any;
};

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function buildAuthHeaders(includeJson = false): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getStoryousSettings(): Promise<StoryousSettings | null> {
  const res = await fetch(`${API_URL}/api/settings/storyous`, {
    method: 'GET',
    headers: buildAuthHeaders(),
    credentials: 'include',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || 'Failed to fetch Storyous settings');
  }

  const data = await res.json();
  return data as StoryousSettings;
}

export async function updateStoryousSettings(
  data: Partial<StoryousSettings>
): Promise<StoryousSettings> {
  const res = await fetch(`${API_URL}/api/settings/storyous`, {
    method: 'PUT',
    headers: buildAuthHeaders(true),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || 'Failed to update Storyous settings');
  }

  return res.json();
}

export async function syncOrderToStoryous(orderId: string, tenantSlug?: string): Promise<StoryousSyncResult> {
  const normalizedTenant = tenantSlug ? normalizeTenantSlug(tenantSlug) : null;
  const urls = [
    `${API_URL}/api/orders/${orderId}/sync-storyous`,
    ...(normalizedTenant ? [`${API_URL}/api/${normalizedTenant}/orders/${orderId}/sync-storyous`] : []),
  ];

  let lastErrorText = '';

  for (const url of urls) {
    const res = await fetch(url, {
      method: 'POST',
      headers: buildAuthHeaders(true),
      credentials: 'include',
    });

    if (res.ok) {
      return res.json();
    }

    const errorText = await res.text().catch(() => '');
    lastErrorText = errorText || `HTTP ${res.status}`;

    // Try fallback URL only for not found route
    if (res.status !== 404) {
      throw new Error(lastErrorText || 'Failed to sync order to Storyous');
    }
  }

  throw new Error(lastErrorText || 'Failed to sync order to Storyous');
}

export async function checkWoltAvailability(orderId: string): Promise<WoltAvailabilityResult> {
  const res = await fetch(`${API_URL}/api/delivery/check-availability`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    credentials: 'include',
    body: JSON.stringify({ orderId }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || 'Wolt availability check failed');
  }

  return res.json();
}

export async function createWoltDelivery(orderId: string, promiseId?: string): Promise<WoltCreateResult> {
  const res = await fetch(`${API_URL}/api/delivery/create`, {
    method: 'POST',
    headers: buildAuthHeaders(true),
    credentials: 'include',
    body: JSON.stringify({ orderId, promiseId }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || 'Failed to create Wolt delivery');
  }

  const data = await res.json();
  return {
    success: true,
    ...data,
  };
}
