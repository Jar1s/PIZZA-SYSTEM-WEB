type TenantLike = {
  name?: string | null;
  description?: string | null;
  theme?: unknown;
} | null | undefined;

function cleanText(value?: string | null): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
}

export function buildSeoTitle(tenant: TenantLike): string {
  // Per-brand override: admins can set theme.seoTitle to fully control the
  // browser tab / Google result title; brands without it keep the template.
  const theme = tenant?.theme;
  if (theme && typeof theme === 'object' && !Array.isArray(theme)) {
    const custom = cleanText((theme as { seoTitle?: string | null }).seoTitle);
    if (custom) {
      return custom;
    }
  }
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
