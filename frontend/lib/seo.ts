import type { Tenant } from '@pizza-ecosystem/shared';

type TenantLike = Partial<Tenant> | null | undefined;

function cleanText(value?: string | null): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
}

export function buildSeoTitle(tenant: TenantLike): string {
  const siteName = cleanText(tenant?.name) || 'Pizza Ordering';
  return `${siteName} | Rozvoz pizze`;
}

export function buildSeoDescription(tenant: TenantLike, fallbackName?: string): string {
  const siteName = cleanText(tenant?.name) || cleanText(fallbackName) || 'Pizza Ordering';
  const fallback = `${siteName} ponúka rozvoz pravej talianskej pizze. Objednajte online s rýchlym doručením a čerstvými surovinami.`;
  const candidate = cleanText(tenant?.description);

  if (!candidate) {
    return fallback;
  }

  // Avoid thin, generic, or noisy snippets that Google tends to rewrite badly.
  if (candidate.length < 60) {
    return fallback;
  }

  return candidate;
}
