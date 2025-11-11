export const API_ENDPOINTS = {
  // Tenants
  TENANTS: '/api/tenants',
  TENANT_BY_SLUG: (slug: string) => `/api/tenants/${slug}`,
  TENANT_RESOLVE: '/api/tenants/resolve',
  
  // Products
  PRODUCTS: (tenantSlug: string) => `/api/${tenantSlug}/products`,
  PRODUCT_BY_ID: (tenantSlug: string, id: string) => `/api/${tenantSlug}/products/${id}`,
  
  // Orders
  ORDERS: (tenantSlug: string) => `/api/${tenantSlug}/orders`,
  ORDER_BY_ID: (tenantSlug: string, id: string) => `/api/${tenantSlug}/orders/${id}`,
  ORDER_STATUS: (id: string) => `/api/orders/${id}/status`,
  
  // Payments
  PAYMENT_SESSION: '/api/payments/session',
  WEBHOOK_ADYEN: '/api/webhooks/adyen',
  WEBHOOK_GOPAY: '/api/webhooks/gopay',
  
  // Delivery
  DELIVERY_QUOTE: '/api/delivery/quote',
  DELIVERY_CREATE: '/api/delivery/create',
  WEBHOOK_WOLT: '/api/webhooks/wolt',
  
  // Tracking
  TRACKING: (orderId: string) => `/api/track/${orderId}`,
} as const;








