/**
 * Application configuration
 * Centralized config to avoid hardcoded values
 */

export const appConfig = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3001',
  
  // Single source of truth for CORS origin policy.
  // NOTE: .vercel.app is denied by default and must be explicitly allowed via ALLOWED_ORIGINS.
  isCorsOriginAllowed: (origin: string | undefined): boolean => {
    if (!origin) {
      return true;
    }

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return true;
    }

    const matchesPattern = allowedOrigins.some((allowed) => {
      if (!allowed.includes('*')) {
        return false;
      }
      const pattern = allowed.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    });
    if (matchesPattern) {
      return true;
    }

    const extraAllowedOrigins = [
      'https://partypizza.vercel.app',
      'https://pizzaparty.sk',
      'https://www.pizzaparty.sk',
    ];
    if (extraAllowedOrigins.includes(origin)) {
      return true;
    }

    if (origin.endsWith('.vercel.app')) {
      return false;
    }

    if (
      origin.includes('p0rnopizza.sk') ||
      origin.includes('pornopizza.sk') ||
      origin.includes('pizzavnudzi.sk')
    ) {
      return true;
    }

    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://pornopizza.localhost:') ||
      origin.startsWith('http://pizzavnudzi.localhost:')
    ) {
      return true;
    }

    return false;
  },
  
  // Tax configuration
  defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '20.0'),
  
  // Security
  // WARNING: Only disable webhook verification in development/testing
  // In production, webhook verification should always be enabled for security
  // This flag allows skipping verification for local development and testing
  skipWebhookVerification: (() => {
    const skip = process.env.SKIP_WEBHOOK_VERIFICATION === 'true';
    if (skip && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  CRITICAL SECURITY WARNING: Webhook verification is DISABLED in PRODUCTION!');
      console.warn('⚠️  This should only be used for testing. Enable webhook verification immediately.');
    }
    return skip;
  })(),
};
