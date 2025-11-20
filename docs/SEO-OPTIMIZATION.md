# SEO Optimization - Server Components

## Overview

The main page (`frontend/app/page.tsx`) has been converted from a Client Component to a Server Component for better SEO. Products and tenant data are now fetched on the server, making them visible to search engines.

## Architecture

### Before (Client Component)
```typescript
'use client';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    // Data fetched in browser - Google can't see it
    getProducts(tenantSlug).then(setProducts);
  }, []);
  
  return <div>...</div>;
}
```

### After (Server Component)
```typescript
// No 'use client' - Server Component

export default async function HomePage() {
  // Data fetched on server - Google can see it
  const products = await getProductsServer(tenantSlug);
  const tenant = await getTenantServer(tenantSlug);
  
  return <HomePageClient products={products} tenant={tenant} />;
}
```

## File Structure

- `frontend/app/page.tsx` - Server Component (fetches data)
- `frontend/components/home/HomePageClient.tsx` - Client Component (interactive UI)
- `frontend/lib/server-api.ts` - Server-side API functions

## Benefits

1. **SEO**: Google can index products and menu items
2. **Performance**: Faster initial page load (data fetched on server)
3. **No Flickering**: Content is available immediately
4. **Better Core Web Vitals**: Improved LCP (Largest Contentful Paint)

## How It Works

1. **Server-Side Rendering**: Next.js fetches data on the server
2. **HTML Generation**: Full HTML with products is generated
3. **Client Hydration**: Interactive features are added on the client
4. **Search Engine Indexing**: Google sees the full content

## Testing SEO

### Check Server-Side Rendering
```bash
curl http://localhost:3001 | grep -i "pizza"
```

### Check Meta Tags
```bash
curl http://localhost:3001 | grep -i "og:"
```

### Google Search Console
1. Submit sitemap: `https://your-domain.com/sitemap.xml`
2. Request indexing for main page
3. Check "Coverage" report

## Migration Notes

- All interactive features (cart, filters, animations) remain in Client Component
- Server Component only handles data fetching
- No breaking changes for users
- Backward compatible with existing functionality

