# 🎯 AGENT 1: SHARED TYPES & CONTRACTS

You are Agent 1 building shared TypeScript interfaces for a multi-brand pizza ordering system.

## PROJECT CONTEXT
- **System:** Multi-tenant pizza ordering (PornoPizza, Pizza v Núdzi, MaydayPizza)
- **Frontend:** Next.js 14 + Tailwind
- **Backend:** NestJS + Prisma + PostgreSQL
- **Payments:** Adyen, GoPay
- **Delivery:** Wolt Drive API

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /shared/`

**CRITICAL:** Only create files in `/shared/`. Do NOT touch any other folders.

## YOUR MISSION
Create all TypeScript type definitions that other agents will import.

## FILES TO CREATE

### 1. `/shared/types/tenant.types.ts`
```typescript
export interface Tenant {
  id: string;
  slug: string;              // 'pornopizza'
  name: string;              // 'PornoPizza'
  domain: string | null;     // 'pornopizza.sk' or null
  subdomain: string;         // 'pornopizza'
  theme: TenantTheme;
  paymentProvider: PaymentProvider;
  paymentConfig: Record<string, any>;  // Encrypted API keys
  deliveryConfig: Record<string, any>; // Wolt API keys
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantTheme {
  primaryColor: string;      // '#FF6B00'
  secondaryColor: string;
  logo: string;              // URL
  favicon: string;
  fontFamily: string;
  heroImage?: string;
}

export type PaymentProvider = 'adyen' | 'gopay' | 'gpwebpay';
```

### 2. `/shared/types/product.types.ts`
```typescript
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  priceCents: number;        // In cents: 999 = €9.99
  taxRate: number;           // 20.0 = 20%
  category: string;
  image: string | null;
  modifiers: Modifier[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Modifier {
  id: string;
  name: string;              // 'Size', 'Extra Toppings'
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;              // 'Large', 'Extra Cheese'
  priceCents: number;        // Additional cost
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}
```

### 3. `/shared/types/order.types.ts`
```typescript
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export interface Order {
  id: string;
  tenantId: string;
  status: OrderStatus;
  
  // Customer
  customer: CustomerInfo;
  address: Address;
  
  // Pricing
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  
  // Payment
  paymentRef: string | null;
  paymentStatus: string | null;
  
  // Delivery
  deliveryId: string | null;
  
  // Items
  items: OrderItem[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;       // Snapshot
  quantity: number;
  priceCents: number;
  modifiers: Record<string, any> | null;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  instructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

### 4. `/shared/types/payment.types.ts`
```typescript
export interface PaymentSession {
  id: string;
  sessionData: string;       // Provider-specific
  redirectUrl: string;
  expiresAt: Date;
}

export interface PaymentWebhook {
  provider: PaymentProvider;
  eventType: string;
  orderId: string;
  paymentRef: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  raw: Record<string, any>;
}

export type PaymentProvider = 'adyen' | 'gopay' | 'gpwebpay';
```

### 5. `/shared/types/delivery.types.ts`
```typescript
export interface Delivery {
  id: string;
  tenantId: string;
  provider: 'wolt';
  jobId: string | null;      // Wolt job ID
  status: DeliveryStatus;
  trackingUrl: string | null;
  quote: DeliveryQuote | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum DeliveryStatus {
  PENDING = 'pending',
  COURIER_ASSIGNED = 'courier_assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export interface DeliveryQuote {
  feeCents: number;
  etaMinutes: number;
  distance: number;          // km
  currency: string;
}

export interface WoltWebhook {
  job_id: string;
  status: string;
  courier?: {
    name: string;
    phone: string;
  };
  eta?: string;
}
```

### 6. `/shared/contracts/api-endpoints.ts`
```typescript
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
```

### 7. `/shared/index.ts`
```typescript
// Types
export * from './types/tenant.types';
export * from './types/product.types';
export * from './types/order.types';
export * from './types/payment.types';
export * from './types/delivery.types';

// Contracts
export * from './contracts/api-endpoints';
```

### 8. `/shared/package.json`
```json
{
  "name": "@pizza-ecosystem/shared",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### 9. `/shared/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 10. `/shared/README.md`
```markdown
# Shared Types

TypeScript interfaces used across frontend and backend.

## Usage

### In Backend (NestJS)
```typescript
import { Tenant, Product, Order } from '../shared';
```

### In Frontend (Next.js)
```typescript
import { Tenant, Product, Order } from '@/shared';
```

## Updating Types
1. Make changes in this folder
2. Run `npm run type-check`
3. Commit to `feat/shared-types` branch
4. Notify dependent agents
```

## DELIVERABLES CHECKLIST
- [ ] tenant.types.ts
- [ ] product.types.ts
- [ ] order.types.ts
- [ ] payment.types.ts
- [ ] delivery.types.ts
- [ ] api-endpoints.ts
- [ ] index.ts
- [ ] package.json
- [ ] tsconfig.json
- [ ] README.md

## DEPENDENCIES
None - you start first!

## WHO NEEDS YOUR OUTPUT
- Agent 2 (Database)
- Agent 3 (Products)
- Agent 4 (Orders)
- Agent 5 (Payments)
- Agent 6 (Frontend)
- Agent 7 (Delivery)
- Agent 8 (Dashboard)
- Agent 9 (Tracking)

## WHEN TO START
🟢 **START IMMEDIATELY** - No dependencies

## COMPLETION SIGNAL
When done, create file: `/shared/AGENT-1-COMPLETE.md`
```markdown
# Agent 1 Complete ✅
All shared types created. Other agents can now import from /shared/
```

BEGIN WORKING NOW!



