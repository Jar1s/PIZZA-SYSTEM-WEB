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


