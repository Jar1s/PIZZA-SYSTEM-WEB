# 🎯 AGENT 6: FRONTEND - CUSTOMER APP (Next.js 14)

You are Agent 6 building the customer-facing ordering website.

## PROJECT CONTEXT
Customers visit brand-specific domains (pornopizza.sk, pizzavnudzi.sk). Each site has unique branding but same functionality: browse menu, add to cart, checkout, pay.

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /frontend/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Multi-tenant routing (middleware resolves tenant from domain)
2. Dynamic theming per brand
3. Menu display with cart functionality
4. Checkout flow (address + payment)
5. Responsive design with Tailwind
6. Framer Motion animations

## FILES TO CREATE

### 1. `/frontend/middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract tenant from domain
  let tenant = 'pornopizza'; // default for localhost
  
  if (hostname.includes('pornopizza.sk')) {
    tenant = 'pornopizza';
  } else if (hostname.includes('pizzavnudzi.sk')) {
    tenant = 'pizzavnudzi';
  } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Development: use query param or default
    const url = new URL(request.url);
    tenant = url.searchParams.get('tenant') || 'pornopizza';
  } else {
    // Extract subdomain
    tenant = hostname.split('.')[0];
  }
  
  // Pass tenant to app via header
  const response = NextResponse.next();
  response.headers.set('x-tenant', tenant);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 2. `/frontend/lib/api.ts`
```typescript
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
```

### 3. `/frontend/lib/theme.ts`
```typescript
import { TenantTheme } from '@/shared';

export function applyTheme(theme: TenantTheme) {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--font-family', theme.fontFamily);
}
```

### 4. `/frontend/app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { headers } from 'next/headers';
import { getTenant } from '@/lib/api';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const tenant = headersList.get('x-tenant') || 'pornopizza';
  const tenantData = await getTenant(tenant);
  
  return {
    title: tenantData.name,
    description: `Order pizza from ${tenantData.name}`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const tenant = headersList.get('x-tenant') || 'pornopizza';
  const tenantData = await getTenant(tenant);
  
  return (
    <html lang="sk">
      <head>
        <link rel="icon" href={tenantData.theme.favicon} />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${tenantData.theme.primaryColor};
              --color-secondary: ${tenantData.theme.secondaryColor};
            }
          `
        }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### 5. `/frontend/app/page.tsx`
```typescript
import { headers } from 'next/headers';
import { getTenant, getProducts, getCategories } from '@/lib/api';
import { MenuSection } from '@/components/menu/MenuSection';
import { Header } from '@/components/layout/Header';
import { Cart } from '@/components/cart/Cart';

export default async function HomePage() {
  const headersList = headers();
  const tenant = headersList.get('x-tenant') || 'pornopizza';
  
  const [tenantData, products, categories] = await Promise.all([
    getTenant(tenant),
    getProducts(tenant),
    getCategories(tenant),
  ]);
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header tenant={tenantData} />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--color-primary)' }}>
          {tenantData.name}
        </h1>
        
        {categories.map(category => {
          const categoryProducts = products.filter(p => p.category === category);
          return (
            <MenuSection
              key={category}
              category={category}
              products={categoryProducts}
            />
          );
        })}
      </div>
      
      <Cart />
    </main>
  );
}
```

### 6. `/frontend/components/menu/MenuSection.tsx`
```typescript
'use client';

import { Product } from '@/shared';
import { ProductCard } from './ProductCard';

interface MenuSectionProps {
  category: string;
  products: Product[];
}

export function MenuSection({ category, products }: MenuSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">{category}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
```

### 7. `/frontend/components/menu/ProductCard.tsx`
```typescript
'use client';

import { Product } from '@/shared';
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  
  const price = (product.priceCents / 100).toFixed(2);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {product.image && (
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={300}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-4">{product.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            €{price}
          </span>
          
          <button
            onClick={() => addItem(product)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 8. `/frontend/components/cart/Cart.tsx`
```typescript
'use client';

import { useCart } from '@/hooks/useCart';
import { CartItem } from './CartItem';
import { useRouter } from 'next/navigation';

export function Cart() {
  const { items, total, isOpen, closeCart } = useCart();
  const router = useRouter();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <button onClick={closeCart} className="text-gray-500 text-2xl">&times;</button>
        </div>
        
        {items.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto mb-6">
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total:</span>
                <span>€{(total / 100).toFixed(2)}</span>
              </div>
              
              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

### 9. `/frontend/hooks/useCart.ts`
```typescript
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/shared';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  modifiers?: any;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, modifiers?: any) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (product, modifiers) => {
        const items = get().items;
        const existingItem = items.find(i => i.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...items, { id: product.id, product, quantity: 1, modifiers }],
            isOpen: true,
          });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map(i =>
              i.id === id ? { ...i, quantity } : i
            ),
          });
        }
      },
      
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      
      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.product.priceCents * item.quantity,
          0
        );
      },
    }),
    { name: 'cart-storage' }
  )
);
```

### 10. `/frontend/app/checkout/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { createOrder, createPaymentSession } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, total } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create order
      const order = await createOrder('pornopizza', {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: 'SK',
        },
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          modifiers: item.modifiers,
        })),
      });
      
      // Create payment session
      const payment = await createPaymentSession(order.id);
      
      // Redirect to Adyen
      window.location.href = payment.redirectUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process order');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 font-semibold">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>
        
        <div>
          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>
        
        <div>
          <label className="block mb-2 font-semibold">Phone</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>
        
        <div>
          <label className="block mb-2 font-semibold">Address</label>
          <input
            type="text"
            required
            value={formData.street}
            onChange={e => setFormData({ ...formData, street: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 mb-2"
            placeholder="Street"
          />
          <input
            type="text"
            required
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            className="w-full border rounded-lg px-4 py-2 mb-2"
            placeholder="City"
          />
          <input
            type="text"
            required
            value={formData.postalCode}
            onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Postal Code"
          />
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between text-xl font-bold mb-4">
            <span>Total:</span>
            <span>€{(total / 100).toFixed(2)}</span>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

## DELIVERABLES CHECKLIST
- [ ] Multi-tenant middleware
- [ ] Dynamic theming
- [ ] Menu display with categories
- [ ] Shopping cart (Zustand)
- [ ] Checkout form
- [ ] Payment integration
- [ ] Responsive design
- [ ] Tailwind configuration

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 2 (tenant API)
- ✅ Agent 3 (products API)
- ✅ Agent 4 (orders API)
- ✅ Agent 5 (payments API)

## WHEN TO START
⏳ **WAIT for Agent 2, 3, 4, 5** (can start with 2,3 for menu display)

## SETUP COMMANDS
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install zustand @types/node
```

## TEST YOUR WORK
```bash
cd frontend
npm run dev

# Visit:
http://localhost:3000?tenant=pornopizza
http://localhost:3000?tenant=pizzavnudzi
```

## COMPLETION SIGNAL
Create `/frontend/AGENT-6-COMPLETE.md`:
```markdown
# Agent 6 Complete ✅

## What I Built
- Multi-tenant routing via middleware
- Dynamic theming per brand
- Menu display with cart
- Checkout flow
- Payment redirect integration
- Responsive design

## How to Test
1. Start backend: cd backend && npm run start:dev
2. Start frontend: cd frontend && npm run dev
3. Visit: http://localhost:3000?tenant=pornopizza
4. Add items to cart
5. Go through checkout

## Next Agents Can Use
✅ Agent 8 can build admin dashboard
✅ Agent 9 can add tracking page
```

BEGIN when Agent 2, 3, 4, 5 signal complete!


