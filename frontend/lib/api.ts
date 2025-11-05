import { Tenant, Product, Order } from '@/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getTenant(slug: string): Promise<Tenant> {
  const res = await fetch(`${API_URL}/api/tenants/${slug}`, {
    next: { revalidate: 3600 }, // Cache 1 hour
  });
  
  if (!res.ok) throw new Error('Tenant not found');
  return res.json();
}

export async function getProducts(tenantSlug: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products`, {
    next: { revalidate: 60 }, // Cache 60s
  });
  
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getCategories(tenantSlug: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/products/categories`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createOrder(tenantSlug: string, orderData: any): Promise<Order> {
  const res = await fetch(`${API_URL}/api/${tenantSlug}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  
  if (!res.ok) throw new Error('Failed to create order');
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

