import { headers } from 'next/headers';
import { getTenantServer, getProductsServer, getTenantSlugFromHeaders } from '@/lib/server-api';
import { HomePageClient } from '@/components/home/HomePageClient';
import { ProductSkeleton } from '@/components/menu/ProductSkeleton';
import { Tenant, Product } from '@pizza-ecosystem/shared';

// Force dynamic rendering because we use dynamic tenant resolution
export const dynamic = 'force-dynamic';

/**
 * Server Component for SEO optimization
 * Data is fetched on the server, so Google can index products
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: { tenant?: string };
}) {
  // Get tenant slug from headers (server-side) or query params
  const headersList = await headers();
  // Check x-tenant header first (set by middleware), then query param, then headers
  const tenantFromHeader = headersList.get('x-tenant');
  const tenantFromQuery = searchParams?.tenant;
  const tenantSlug = tenantFromQuery || tenantFromHeader || getTenantSlugFromHeaders(headersList);

  // Fetch data on server (for SEO)
  const [products, tenant] = await Promise.all([
    getProductsServer(tenantSlug),
    getTenantServer(tenantSlug),
  ]);

  // Debug: Log prices for specific products on server
  if (process.env.NODE_ENV === 'development') {
    const productsToDebug = ['Basil Pesto Premium', 'Honey Chilli', 'Pollo Crema', 'Prosciutto Crudo Premium', 'Quattro Formaggi', 'Quattro Formaggi Bianco', 'Tonno', 'Vegetariana Premium', 'Hot Missionary'];
    productsToDebug.forEach(name => {
      const p = products.find(pr => pr.name === name);
      if (p) {
        console.log(`[Server] ${p.name}: ${p.priceCents} cents = €${(p.priceCents / 100).toFixed(2)}`);
      }
    });
  }

  // Handle loading/error states
  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tenant nenájdený</h2>
          <p className="text-gray-600 mb-6 text-sm">Nepodarilo sa načítať informácie o tenantovi.</p>
          <a
            href="/"
            className="inline-block px-6 py-3 text-white rounded-lg font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Obnoviť stránku
          </a>
        </div>
      </div>
    );
  }

  // Check if tenant is active
  if (!tenant.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Stránka je dočasne nedostupná</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Tento brand je momentálne vypnutý. Skúste to neskôr.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 text-white rounded-lg font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Späť na hlavnú stránku
          </a>
        </div>
      </div>
    );
  }

  // If no products, show loading skeleton
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-[600px] bg-gray-300 animate-pulse" />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render client component with server-fetched data
  return <HomePageClient products={products} tenant={tenant} />;
}
