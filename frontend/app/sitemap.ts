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

/** Verejné stránky vhodné pre Google (bez adminu, účtu a privátnych objednávok). */
const PUBLIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/checkout', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getAbsoluteOrigin();
  const lastModified = new Date();

  return PUBLIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${origin}${path === '/' ? '/' : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
