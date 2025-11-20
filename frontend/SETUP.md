# Frontend Setup Guide

Quick start guide for the Pizza Ecosystem customer frontend.

## Prerequisites

✅ Node.js 18+ installed  
✅ Backend API running on `http://localhost:3000`  
✅ Backend database seeded with tenant data  

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- Next.js 14.2.15
- React 18
- TypeScript 5
- Tailwind CSS 3.4
- Zustand 4.5 (state management)
- Framer Motion 11.5 (animations)

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:3001` (or next available port).

## Testing the Application

### Test Multi-Tenant Routing

Open these URLs in your browser:

**PornoPizza (Orange theme):**
```
http://localhost:3001?tenant=pornopizza
```

**Pizza v Núdzi (Red theme):**
```
http://localhost:3001?tenant=pizzavnudzi
```

### Test the Full Flow

1. **Browse Menu**
   - Products should display grouped by category
   - Hover over product cards to see animations

2. **Add to Cart**
   - Click "Add to Cart" on any product
   - Cart sidebar should slide in from right
   - Item count badge should update in header

3. **Manage Cart**
   - Adjust quantities with +/- buttons
   - Remove items with "Remove" button
   - Watch total update in real-time

4. **Checkout**
   - Click "Checkout" button in cart
   - Fill out the form:
     - Name: John Doe
     - Email: john@example.com
     - Phone: +421 900 123 456
     - Address: Your street, city, postal code
   - Review order summary
   - Click "Pay Now"

5. **Payment Flow**
   - Order is created via API
   - Payment session is created
   - (In production: redirects to Adyen)
   - (In development: shows success message)

## Troubleshooting

### "Tenant not found" error

**Problem:** Backend is not running or database not seeded.

**Solution:**
```bash
cd backend
npm run start:dev
```

Make sure backend shows:
```
[NestApplication] Nest application successfully started
```

### Port already in use

**Problem:** Port 3001 is already taken.

**Solution:**
Next.js will automatically use the next available port. Check the terminal output for the actual port:
```
- Local:        http://localhost:3002
```

### Images not loading

**Problem:** Product images use placeholder URLs.

**Solution:**
1. Update product records in database with real image URLs, OR
2. Add placeholder images to `public/` folder

### TypeScript errors with shared types

**Problem:** Can't import from `@/shared`.

**Solution:**
Make sure the shared package exists:
```bash
cd ../shared
ls -la
```

The `tsconfig.json` should have:
```json
"paths": {
  "@/shared": ["../shared"]
}
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout (theming)
│   ├── page.tsx           # Home page (menu)
│   ├── checkout/          # Checkout flow
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── menu/             # Menu components
│   └── cart/             # Cart components
├── hooks/                # Custom React hooks
│   └── useCart.ts        # Cart state management
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   └── theme.ts         # Theme utilities
├── middleware.ts         # Multi-tenant routing
└── public/              # Static assets
```

## Development Tips

### Hot Reload

Next.js supports fast refresh. Changes to files will automatically update in the browser.

### Check Cart State

Open browser DevTools → Application → Local Storage → `cart-storage`

You'll see the persisted cart state.

### Debug API Calls

Open browser DevTools → Network tab → Filter: Fetch/XHR

Watch API requests to the backend.

### Test Different Tenants

Use the query parameter to switch between tenants:
```
?tenant=pornopizza
?tenant=pizzavnudzi
```

## Build for Production

```bash
# Create production build
npm run build

# Test production build locally
npm start
```

Production build will:
- Optimize bundle size
- Minify JavaScript
- Optimize images
- Generate static pages where possible

## Environment Variables

### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Production (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

**Important:** All variables starting with `NEXT_PUBLIC_` are exposed to the browser.

## Next Steps

Once the frontend is working:

1. **Agent 8** can build the admin dashboard
2. **Agent 9** can add order tracking page
3. **Agent 10** can deploy to production

## Support

If you encounter issues:

1. Check backend logs
2. Check browser console for errors
3. Verify environment variables
4. Ensure all dependencies are installed
5. Try deleting `node_modules` and `.next` folder, then reinstall

```bash
rm -rf node_modules .next
npm install
npm run dev
```

## Success Checklist

- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Dev server running
- [ ] Backend API accessible
- [ ] Menu displays products
- [ ] Cart functionality works
- [ ] Checkout form submits
- [ ] Theming works per tenant
- [ ] No console errors

✅ **You're ready to go!**





















