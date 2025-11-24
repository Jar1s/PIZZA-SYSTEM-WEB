import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = new URL(request.url);
  
  // Extract tenant from domain or query param
  let tenant = 'pornopizza'; // default
  
  // For Vercel URLs, ALWAYS use query param or default - NEVER extract from hostname
  if (hostname.includes('vercel.app')) {
    tenant = url.searchParams.get('tenant') || 'pornopizza';
    // Validate tenant slug
    if (tenant !== 'pornopizza' && tenant !== 'pizzavnudzi') {
      tenant = 'pornopizza';
    }
  }
  // For localhost, use query param or default
  else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    tenant = url.searchParams.get('tenant') || 'pornopizza';
  }
  // For known production domains, check domain first
  else if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk')) {
    tenant = 'pornopizza';
  } else if (hostname.includes('pizzavnudzi.sk')) {
    tenant = 'pizzavnudzi';
  } else if ((hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) && !hostname.includes('vercel.app')) {
    // Subdomain or partial match (but not Vercel)
    tenant = 'pornopizza';
  } else if (hostname.includes('pizzavnudzi') && !hostname.includes('vercel.app')) {
    // Subdomain or partial match (but not Vercel)
    tenant = 'pizzavnudzi';
  } else {
    // For other domains, try query param first, then default
    tenant = url.searchParams.get('tenant') || 'pornopizza';
  }
  
  // Validate tenant slug (must be one of the known tenants)
  if (tenant !== 'pornopizza' && tenant !== 'pizzavnudzi') {
    tenant = 'pornopizza';
  }
  
  // Pass tenant to app via header
  const response = NextResponse.next();
  response.headers.set('x-tenant', tenant);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


