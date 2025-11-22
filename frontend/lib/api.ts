import { Tenant, Product, Order, OrderStatus } from '@pizza-ecosystem/shared';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';
import { TenantSchema, ProductSchema, OrderSchema, safeParse } from '@/lib/schemas/api.schema';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getTenant(slug: string): Promise<Tenant> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    console.log(`[getTenant] Fetching tenant: ${API_URL}/api/tenants/${slug}`);
    
    const res = await fetch(`${API_URL}/api/tenants/${slug}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      // Client-side fetch doesn't need cache: 'no-store'
      // Next.js will handle caching appropriately
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[getTenant] HTTP error ${res.status}:`, errorText);
      throw new Error(`Tenant not found: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('[getTenant] Received data:', { name: data.name, slug: data.slug, hasTheme: !!data.theme });
    
    const validated = safeParse(TenantSchema, data, data as any);
    const result = withTenantThemeDefaults(validated) as Tenant;
    console.log('[getTenant] Validated tenant:', { name: result.name, slug: result.slug });
    return result;
  } catch (error: any) {
    console.error('[getTenant] Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Backend is not responding');
    }
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      throw new Error('Backend is not available. Please ensure the backend is running on http://localhost:3000');
    }
    throw error;
  }
}

export async function getProducts(tenantSlug: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch products: ${errorText}`);
  }
  
  const data = await res.json();
  // Validate products array
  if (Array.isArray(data)) {
    return data.map(product => safeParse(ProductSchema, product, product as any)) as Product[];
  }
  return [];
}

export async function getCategories(tenantSlug: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/categories`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getProductById(productId: string): Promise<Product> {
  // Need to find which tenant this product belongs to
  // For admin, we can try all tenants or get from product
  const res = await fetch(`${API_URL}/api/pornopizza/products/${productId}`);
  if (!res.ok) {
    const res2 = await fetch(`${API_URL}/api/pizzavnudzi/products/${productId}`);
    if (!res2.ok) throw new Error('Product not found');
    return res2.json();
  }
  return res.json();
}

export async function updateProduct(tenantSlug: string, productId: string, data: Partial<Product>): Promise<Product> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/${productId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again');
    }
    const errorText = await res.text().catch(() => 'Failed to update product');
    throw new Error(errorText || 'Failed to update product');
  }
  
  return res.json();
}

export interface ProductMapping {
  id: string;
  externalIdentifier: string;
  internalProductName: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProductMappings(tenantSlug: string, productId: string): Promise<ProductMapping[]> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/${productId}/mappings`, {
    headers,
  });
  
  if (!res.ok) {
    // If endpoint doesn't exist or no mappings, return empty array
    if (res.status === 404 || res.status === 500) return [];
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again');
    }
    throw new Error('Failed to fetch product mappings');
  }
  
  return res.json();
}

export async function deleteProduct(tenantSlug: string, productId: string): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/${productId}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again');
    }
    throw new Error('Failed to delete product');
  }
}

export async function createProduct(tenantSlug: string, data: Partial<Product>): Promise<Product> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized - Please log in again');
    }
    const errorData = await res.json().catch(() => ({ message: 'Failed to create product' }));
    throw new Error(errorData.message || 'Failed to create product');
  }
  return res.json();
}

export async function createOrder(tenantSlug: string, orderData: any): Promise<Order | { order: Order; authToken?: string; refreshToken?: string; user?: any }> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to create order' }));
    throw new Error(errorData.message || 'Failed to create order');
  }
  const data = await res.json();
  // Validate order response (could be Order or { order: Order, ... })
  if ('order' in data) {
    return {
      ...data,
      order: safeParse(OrderSchema, data.order, data.order as any),
    };
  }
  return safeParse(OrderSchema, data, data as any) as Order;
}

export async function createPaymentSession(orderId: string) {
  const res = await fetch(`${API_URL}/api/payments/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  
  if (!res.ok) throw new Error('Failed to create payment');
  return res.json();
}

export async function getOrder(orderId: string): Promise<Order> {
  const res = await fetch(`${API_URL}/api/track/${orderId}`);
  
  if (!res.ok) throw new Error('Order not found');
  const data = await res.json();
  return safeParse(OrderSchema, data, data as any) as Order;
}

// Tenant/Brand management
export async function getAllTenants(includeInactive: boolean = false): Promise<Tenant[]> {
  const url = includeInactive 
    ? `${API_URL}/api/tenants?includeInactive=true`
    : `${API_URL}/api/tenants`;
    
  const res = await fetch(url);
  
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json();
}

export async function updateTenant(tenantSlug: string, data: Partial<Tenant>): Promise<Tenant> {
  const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error('Failed to update tenant');
  return res.json();
}

export async function createTenant(data: Partial<Tenant>): Promise<Tenant> {
  const res = await fetch(`${API_URL}/api/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error('Failed to create tenant');
  return res.json();
}

// SMS Verification API functions
export async function sendSmsCode(phoneNumber: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/send-sms-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, userId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to send SMS code');
  }
}

export async function verifySmsCode(phoneNumber: string, code: string, userId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/auth/verify-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for HttpOnly tokens
    body: JSON.stringify({ phoneNumber, code, userId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Invalid SMS code');
  }
  
  // Store tokens if returned
  const data = await res.json();
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (data.access_token) {
    if (!isProduction) {
      localStorage.setItem('auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    } else {
      // Production: Tokens are in HttpOnly cookies, but we still need access_token for Authorization header
      localStorage.setItem('auth_token', data.access_token);
    }
    if (data.user) {
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
  }
  
  return data;
}

// Customer Authentication API functions
export async function checkEmailExists(email: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/auth/customer/check-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to check email');
  }
  
  const data = await res.json();
  return data.exists;
}

export async function registerCustomer(email: string, password: string, name: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/auth/customer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, name }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  return res.json();
}

export async function loginCustomer(email: string, password: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Login failed');
  }
  
  return res.json();
}

export async function sendCustomerSmsCode(phone: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/customer/send-sms-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, userId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to send SMS code');
  }
}

export async function verifyCustomerPhone(phone: string, code: string, userId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/auth/customer/verify-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ phone, code, userId }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Invalid SMS code');
  }
  
  return res.json();
}

// Admin: Update order status
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus,
  tenantSlug: string // Add tenant slug parameter
): Promise<void> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
    body: JSON.stringify({ status }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update order status' }));
    throw new Error(error.message || 'Failed to update order status');
  }
}

// Admin: Create Wolt delivery
export async function createWoltDelivery(orderId: string): Promise<{ success: boolean; deliveryId?: string; trackingUrl?: string; message: string }> {
  const res = await fetch(`${API_URL}/api/delivery/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create Wolt delivery' }));
    throw new Error(error.message || 'Failed to create Wolt delivery');
  }
  
  const delivery = await res.json();
  // Backend returns delivery object, convert to expected format
  return {
    success: true,
    deliveryId: delivery.id,
    trackingUrl: delivery.trackingUrl || null,
    message: 'Wolt delivery created successfully',
  };
}

// Admin: Sync order to Storyous
export async function syncOrderToStoryous(orderId: string, tenantSlug?: string): Promise<{ success: boolean; storyousOrderId?: string; message: string }> {
  // If tenantSlug is not provided, try to determine it from the order
  // For now, we'll use a generic endpoint that works with any tenant
  // The backend will handle tenant resolution
  const res = await fetch(`${API_URL}/api/pornopizza/orders/${orderId}/sync-storyous`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!res.ok) {
    // Try the other tenant if first fails
    if (!tenantSlug || tenantSlug === 'pornopizza') {
      const res2 = await fetch(`${API_URL}/api/pizzavnudzi/orders/${orderId}/sync-storyous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res2.ok) {
        return res2.json();
      }
    }
    const error = await res.json().catch(() => ({ message: 'Failed to sync order to Storyous' }));
    throw new Error(error.message || 'Failed to sync order to Storyous');
  }
  
  return res.json();
}

// Delivery zones
export interface DeliveryFeeRequest {
  address: {
    postalCode?: string;
    city?: string;
    cityPart?: string;
  };
}

export interface DeliveryFeeResponse {
  available: boolean;
  deliveryFeeCents?: number;
  deliveryFeeEuros?: string;
  minOrderCents?: number | null;
  minOrderEuros?: string | null;
  zoneName?: string;
  message?: string;
}

export async function calculateDeliveryFee(
  tenantSlug: string,
  address: DeliveryFeeRequest['address'],
): Promise<DeliveryFeeResponse> {
  const res = await fetch(`${API_URL}/api/delivery-zones/${tenantSlug}/calculate-fee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to calculate delivery fee: ${errorText}`);
  }
  
  return res.json();
}

export interface ValidateMinOrderRequest {
  address: {
    postalCode?: string;
    city?: string;
    cityPart?: string;
  };
  orderTotalCents: number;
}

export interface ValidateMinOrderResponse {
  valid: boolean;
  minOrderCents: number | null;
  minOrderEuros: string | null;
  zoneName: string | null;
  message: string | null;
}

export async function validateMinOrder(
  tenantSlug: string,
  address: ValidateMinOrderRequest['address'],
  orderTotalCents: number,
): Promise<ValidateMinOrderResponse> {
  const res = await fetch(`${API_URL}/api/delivery-zones/${tenantSlug}/validate-min-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, orderTotalCents }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to validate min order: ${errorText}`);
  }
  
  return res.json();
}
