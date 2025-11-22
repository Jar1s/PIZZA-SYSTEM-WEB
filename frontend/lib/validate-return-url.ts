/**
 * Validates returnUrl to prevent open redirect attacks
 * Only allows internal URLs (starting with /)
 * Rejects external URLs, javascript:, data:, etc.
 */
export function validateReturnUrl(returnUrl: string | null | undefined): string | null {
  if (!returnUrl) {
    return null;
  }

  // Must start with / (internal URL)
  if (!returnUrl.startsWith('/')) {
    console.warn('Invalid returnUrl - must start with /:', returnUrl);
    return null;
  }

  // Must not contain // (prevents protocol-relative URLs like //evil.com)
  if (returnUrl.includes('//')) {
    console.warn('Invalid returnUrl - contains //:', returnUrl);
    return null;
  }

  // Must not contain : (prevents javascript:, data:, etc.)
  // Exception: allow : in query params (e.g., ?tenant=pornopizza)
  const urlWithoutQuery = returnUrl.split('?')[0];
  if (urlWithoutQuery.includes(':')) {
    console.warn('Invalid returnUrl - contains : in path:', returnUrl);
    return null;
  }

  // Must not contain <script> or other dangerous patterns
  const lowerUrl = returnUrl.toLowerCase();
  if (lowerUrl.includes('<script') || lowerUrl.includes('javascript:') || lowerUrl.includes('data:')) {
    console.warn('Invalid returnUrl - contains dangerous pattern:', returnUrl);
    return null;
  }

  return returnUrl;
}










