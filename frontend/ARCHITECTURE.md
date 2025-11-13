# Frontend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Customer)                        │
│                                                              │
│  pornopizza.sk  or  pizzavnudzi.sk  or  localhost:3001     │
└───────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Layer                           │
│                   (middleware.ts)                            │
│                                                              │
│  • Detects tenant from domain/query param                   │
│  • Sets x-tenant header                                      │
│  • Routes request to Next.js app                             │
└───────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │  app/layout.tsx (Root Layout)                │          │
│  │  • Fetches tenant data                       │          │
│  │  • Applies dynamic theming                   │          │
│  │  • Sets CSS variables                        │          │
│  └──────────────────────────────────────────────┘          │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────┐          │
│  │  app/page.tsx (Menu Page)                    │          │
│  │  • Fetches products & categories             │          │
│  │  • Renders menu sections                     │          │
│  │  • Displays header & cart                    │          │
│  └──────────────────────────────────────────────┘          │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────┐          │
│  │  app/checkout/page.tsx (Checkout)            │          │
│  │  • Customer form                             │          │
│  │  • Order creation                            │          │
│  │  • Payment redirect                          │          │
│  └──────────────────────────────────────────────┘          │
└───────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Header    │  │ MenuSection │  │    Cart     │        │
│  │  (layout/)  │  │   (menu/)   │  │   (cart/)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ProductCard  │  │  CartItem   │                          │
│  │   (menu/)   │  │   (cart/)   │                          │
│  └─────────────┘  └─────────────┘                          │
└───────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     State Management                         │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │  hooks/useCart.ts (Zustand Store)            │          │
│  │  • items: CartItem[]                         │          │
│  │  • addItem(), removeItem()                   │          │
│  │  • updateQuantity()                          │          │
│  │  • total: computed                           │          │
│  │  • Persisted to localStorage                 │          │
│  └──────────────────────────────────────────────┘          │
└───────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Client                              │
│                     (lib/api.ts)                             │
│                                                              │
│  • getTenant(slug)                                           │
│  • getProducts(tenantSlug)                                   │
│  • getCategories(tenantSlug)                                 │
│  • createOrder(tenantSlug, data)                             │
│  • createPaymentSession(orderId)                             │
└───────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (NestJS)                       │
│                 http://localhost:3000                        │
│                                                              │
│  /api/tenants/:slug                                          │
│  /api/:tenant/products                                       │
│  /api/:tenant/products/categories                            │
│  /api/:tenant/orders                                         │
│  /api/payments/session                                       │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Page Load (Menu)

```
User visits URL
    ↓
Middleware detects tenant
    ↓
Layout fetches tenant data → Backend API
    ↓
Page fetches products → Backend API
    ↓
Components render with theme
```

### 2. Add to Cart

```
User clicks "Add to Cart"
    ↓
ProductCard calls useCart.addItem()
    ↓
Zustand updates state
    ↓
State persisted to localStorage
    ↓
Cart sidebar opens with animation
    ↓
Header badge updates
```

### 3. Checkout Flow

```
User clicks "Checkout" in cart
    ↓
Navigate to /checkout
    ↓
User fills form
    ↓
Submit creates order → Backend API
    ↓
Backend creates payment session
    ↓
Frontend redirects to Adyen
    ↓
User completes payment
    ↓
Webhook updates order status
```

## Multi-Tenant Architecture

### Domain Resolution

```
Production:
pornopizza.sk      → tenant: 'pornopizza'
pizzavnudzi.sk     → tenant: 'pizzavnudzi'
custom-brand.com   → tenant: 'custom-brand'

Development:
localhost:3001?tenant=pornopizza   → tenant: 'pornopizza'
localhost:3001?tenant=pizzavnudzi  → tenant: 'pizzavnudzi'
```

### Theme Application

```typescript
// 1. Middleware sets x-tenant header
response.headers.set('x-tenant', tenant);

// 2. Layout fetches tenant data
const tenantData = await getTenant(tenant);

// 3. CSS variables applied
:root {
  --color-primary: ${tenantData.theme.primaryColor};
  --color-secondary: ${tenantData.theme.secondaryColor};
}

// 4. Components use CSS variables
style={{ backgroundColor: 'var(--color-primary)' }}
```

## State Management

### Cart Store (Zustand)

```typescript
interface CartStore {
  items: CartItem[];           // Array of cart items
  isOpen: boolean;             // Cart sidebar visibility
  addItem: (product) => void;  // Add product to cart
  removeItem: (id) => void;    // Remove from cart
  updateQuantity: (id, qty) => void;  // Update quantity
  clearCart: () => void;       // Clear all items
  openCart: () => void;        // Open sidebar
  closeCart: () => void;       // Close sidebar
  total: number;               // Computed total (getter)
}
```

### Persistence

```typescript
// Automatically saved to localStorage as 'cart-storage'
persist(
  (set, get) => ({ /* store */ }),
  { name: 'cart-storage' }
)
```

## Styling Architecture

### Tailwind CSS + CSS Variables

```css
/* Global CSS Variables (Dynamic) */
:root {
  --color-primary: #FF6B00;    /* Set per tenant */
  --color-secondary: #000000;   /* Set per tenant */
  --font-family: 'Inter';       /* Set per tenant */
}

/* Tailwind Utilities */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Tailwind Config */
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
    }
  }
}
```

## Animation Strategy

### Framer Motion

```typescript
// Product Card Hover
<motion.div whileHover={{ scale: 1.02 }}>

// Cart Sidebar
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
/>

// Button Press
<motion.button whileTap={{ scale: 0.95 }}>
```

## Performance Optimizations

### Next.js Caching

```typescript
// Tenant data - cache 1 hour
fetch(url, { next: { revalidate: 3600 } })

// Products - cache 60 seconds
fetch(url, { next: { revalidate: 60 } })
```

### Image Optimization

```typescript
// Automatic optimization with Next.js Image
<Image
  src={product.image}
  alt={product.name}
  fill
  className="object-cover"
/>
```

### Code Splitting

- Automatic route-based splitting by Next.js
- Client components marked with 'use client'
- Server components by default

## Error Handling

### API Errors

```typescript
try {
  const data = await getTenant(tenant);
} catch (error) {
  // Fallback to default theme
  // Show error message to user
}
```

### Form Validation

```typescript
<input
  type="email"
  required
  // HTML5 validation + custom error messages
/>
```

## Security

### Environment Variables

```bash
# Public (exposed to browser)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Private (server-side only)
# None needed for customer frontend
```

### CORS

Backend must allow frontend origin:
```typescript
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
});
```

## Deployment Architecture

```
┌─────────────────┐
│   Vercel CDN    │  ← Static assets
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js Edge   │  ← Middleware (multi-tenant)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Next.js Server  │  ← SSR & API routes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │  ← NestJS on Fly.io
└─────────────────┘
```

## File Organization

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout (theming)
│   ├── page.tsx           # Home (menu)
│   └── checkout/
│       └── page.tsx       # Checkout flow
│
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   ├── menu/             # Menu-related
│   └── cart/             # Cart-related
│
├── hooks/                # Custom React hooks
│   └── useCart.ts        # Cart state (Zustand)
│
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   └── theme.ts         # Theme utilities
│
└── middleware.ts         # Multi-tenant routing
```

## Key Design Decisions

1. **App Router over Pages Router** - Better DX, RSC support
2. **Zustand over Redux** - Simpler, less boilerplate
3. **Framer Motion** - Best animation library for React
4. **CSS Variables for Theming** - Dynamic, performant
5. **Tailwind CSS** - Rapid development, consistency
6. **Middleware for Tenants** - Runs before page load
7. **localStorage for Cart** - Persists across sessions
8. **Server Components** - Better performance, SEO

## Future Enhancements

- [ ] Product modifiers UI (size, toppings)
- [ ] User authentication
- [ ] Order tracking page
- [ ] Favorites/wishlist
- [ ] Product search
- [ ] Reviews & ratings
- [ ] PWA support
- [ ] Real-time order updates (WebSocket)













