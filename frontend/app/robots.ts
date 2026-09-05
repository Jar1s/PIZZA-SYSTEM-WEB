import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

async function getAbsoluteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return stripTrailingSlash(configured);
  }
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const proto = headersList.get('x-forwarded-proto') || 'https';
  if (!host) {
    return 'https://localhost';
  }
  return stripTrailingSlash(`${proto}://${host}`);
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getAbsoluteOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/account',
        '/api/',
        '/auth/',
        '/order/',
        '/track/',
        '/checkout/return',
        '/checkout/mock-payment',
        '/login',
        '/test-sentry',
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
