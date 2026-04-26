import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

type HeaderReader = {
  get(name: string): string | null;
};

function getBaseUrl(headersList: HeaderReader): string {
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL || 'https://pornopizza.sk';
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const baseUrl = getBaseUrl(headersList);
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/checkout/',
          '/auth/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}







