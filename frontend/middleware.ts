import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = new URL(request.url);
  
  // Extract tenant from domain or query param
  let tenant = 'pornopizza'; // default
  
  // Check for known production domains
  if (hostname.includes('pornopizza.sk')) {
    tenant = 'pornopizza';
  } else if (hostname.includes('pizzavnudzi.sk')) {
    tenant = 'pizzavnudzi';
  } else if (hostname.includes('pornopizza')) {
    // Subdomain or partial match
    tenant = 'pornopizza';
  } else if (hostname.includes('pizzavnudzi')) {
    // Subdomain or partial match
    tenant = 'pizzavnudzi';
  } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Development: use query param or default
    tenant = url.searchParams.get('tenant') || 'pornopizza';
  } else if (hostname.includes('vercel.app')) {
    // Vercel preview/production URLs: use query param or default
    tenant = url.searchParams.get('tenant') || 'pornopizza';
  } else {
    // For other domains, try query param first, then default
    tenant = url.searchParams.get('tenant') || 'pornopizza';
  }
  
  // Pass tenant to app via header
  const response = NextResponse.next();
  response.headers.set('x-tenant', tenant);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


