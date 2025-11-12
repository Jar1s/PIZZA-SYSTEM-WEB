import { Tenant, Product, Order } from '@/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getTenant(slug: string): Promise<Tenant> {
  const res = await fetch(`${API_URL}/api/tenants/${slug}`, {
    cache: 'no-store', // Client-side fetch, no cache
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Tenant not found: ${errorText}`);
  }
  return res.json();
}

export async function getProducts(tenantSlug: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products`, {
    cache: 'no-store', // Client-side fetch, no cache
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch products: ${errorText}`);
  }
  return res.json();
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
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

export async function deleteProduct(tenantSlug: string, productId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/${productId}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function createOrder(tenantSlug: string, orderData: any): Promise<Order> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to create order' }));
    throw new Error(errorData.message || 'Failed to create order');
  }
  return res.json();
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
  const res = await fetch(`${API_URL}/api/track/${orderId}`, {
    cache: 'no-store', // Always fresh data
  });
  
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

// Tenant/Brand management
export async function getAllTenants(): Promise<Tenant[]> {
  const res = await fetch(`${API_URL}/api/tenants`, {
    cache: 'no-store',
  });
  
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
