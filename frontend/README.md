# Pizza Ecosystem - Customer Frontend

Next.js 14 customer-facing ordering website with multi-tenant support.

## Features

- 🏢 Multi-tenant routing (domain-based)
- 🎨 Dynamic theming per brand
- 🍕 Menu display with categories
- 🛒 Shopping cart with Zustand
- 💳 Checkout with payment integration
- 📱 Responsive design with Tailwind CSS
- ✨ Framer Motion animations

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Framer Motion (animations)

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on port 3000

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Visit:
- http://localhost:3001?tenant=pornopizza
- http://localhost:3001?tenant=pizzavnudzi

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with theming
│   ├── page.tsx            # Home page (menu)
│   ├── checkout/
│   │   └── page.tsx        # Checkout page
│   └── globals.css         # Global styles
├── components/
│   ├── layout/
│   │   └── Header.tsx      # Header with cart button
│   ├── menu/
│   │   ├── MenuSection.tsx # Category sections
│   │   └── ProductCard.tsx # Product cards
│   └── cart/
│       ├── Cart.tsx        # Cart sidebar
│       └── CartItem.tsx    # Cart item
├── hooks/
│   └── useCart.ts          # Cart state management
├── lib/
│   ├── api.ts              # API client
│   └── theme.ts            # Theme utilities
└── middleware.ts           # Multi-tenant routing

```

## Multi-Tenant Setup

The app uses middleware to detect the tenant from:
1. **Production**: Domain name (pornopizza.sk, pizzavnudzi.sk)
2. **Development**: Query parameter (?tenant=pornopizza)

Each tenant has:
- Unique branding (colors, logo)
- Separate product catalog
- Independent payment configuration

## Cart Management

Shopping cart is managed with Zustand and persisted to localStorage:

```typescript
import { useCart } from '@/hooks/useCart';

const { items, addItem, removeItem, total } = useCart();
```

## Theming

Themes are applied dynamically using CSS variables:

```css
:root {
  --color-primary: #FF6B00;
  --color-secondary: #000000;
}
```

## API Integration

All API calls go through the centralized client:

```typescript
import { getTenant, getProducts, createOrder } from '@/lib/api';
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Testing

1. Start the backend:
```bash
cd backend
npm run start:dev
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Test the flow:
   - Browse menu
   - Add items to cart
   - Proceed to checkout
   - Fill form and submit

## Next Steps

- [ ] Add product modifiers UI
- [ ] Implement order tracking page
- [ ] Add user authentication
- [ ] Optimize images
- [ ] Add loading states
- [ ] Implement error boundaries













