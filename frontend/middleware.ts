import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = new URL(request.url);
  
  let tenantSlug: string | null = null;
  
  // 1. Try environment variable (for preview/dev)
  tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || null;
  
  // 2. If not set, try to resolve from hostname
  if (!tenantSlug) {
    // Remove port if present
    const domain = hostname.split(':')[0];
    
    // For localhost/dev, use query param
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      tenantSlug = url.searchParams.get('tenant') || null;
    }
    // For Vercel preview URLs, use query param
    else if (domain.includes('vercel.app')) {
      tenantSlug = url.searchParams.get('tenant') || null;
    }
    // For production domains, lookup from backend
    else {
      try {
        // Call backend API to resolve domain -> tenantSlug
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const resolveUrl = `${apiUrl}/api/tenants/resolve?domain=${domain}`;
        
        const response = await fetch(resolveUrl, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          tenantSlug = data.slug;
        }
      } catch (error) {
        console.error('Failed to resolve tenant from domain:', error);
      }
    }
  }
  
  // 3. If still no tenant, return 404 (no hardcoded fallback)
  if (!tenantSlug) {
    return new NextResponse('Tenant not found', { status: 404 });
  }
  
  // Pass tenant to app via header
  const response = NextResponse.next();
  response.headers.set('x-tenant', tenantSlug);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


