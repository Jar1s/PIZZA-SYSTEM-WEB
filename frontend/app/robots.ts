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

  // Paths that must never be indexed: the API, the admin area, and anything
  // tied to a specific customer session.
  const privatePaths = ['/api/', '/admin/', '/account/', '/checkout/', '/auth/'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/account/', '/checkout/'],
      },
      // Assistant crawlers are listed explicitly. Several of them ignore the
      // wildcard group when a named group exists elsewhere in the file, and
      // without an explicit Allow the menu never shows up in answers to
      // "where can I order pizza in Bratislava".
      //
      // GPTBot / OAI-SearchBot / ChatGPT-User: OpenAI (training, search index,
      // live browsing). ClaudeBot / Claude-SearchBot / Claude-User: Anthropic.
      // PerplexityBot: Perplexity index. Google-Extended: gates Gemini
      // grounding without affecting normal Google ranking.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
          'Google-Extended',
          'Applebot',
          'Applebot-Extended',
          'Bingbot',
          'cohere-ai',
          'meta-externalagent',
        ],
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}







