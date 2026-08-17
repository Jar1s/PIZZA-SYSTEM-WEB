/**
 * Application configuration
 * Centralized config to avoid hardcoded values
 */

const DEFAULT_JWT_SECRET = 'your-secret-key-change-in-production';

const STATIC_ALLOWED_ORIGINS = [
  'https://partypizza.vercel.app',
  'https://pizzaparty.sk',
  'https://www.pizzaparty.sk',
  'https://p0rnopizza.sk',
  'https://www.p0rnopizza.sk',
  'https://pornopizza.sk',
  'https://www.pornopizza.sk',
  'https://pizzavnudzi.sk',
  'https://www.pizzavnudzi.sk',
];

const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const;
const CORS_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'x-tenant', 'X-Requested-With'] as const;
const CORS_EXPOSED_HEADERS = ['Content-Length', 'Content-Type', 'Content-Disposition'] as const;

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

const parseAllowedOrigins = (): string[] =>
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const matchesOriginPattern = (origin: string, allowedOrigin: string): boolean => {
  if (!allowedOrigin.includes('*')) {
    return origin === allowedOrigin;
  }

  const escaped = allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(origin);
};

const isLocalOrigin = (origin: string): boolean =>
  /^http:\/\/localhost:\d+$/.test(origin) ||
  /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
  /^http:\/\/[a-z0-9-]+\.localhost:\d+$/i.test(origin);

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret === DEFAULT_JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable must be set to a non-default value');
  }

  return secret;
};

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (STATIC_ALLOWED_ORIGINS.includes(normalizedOrigin)) {
    return true;
  }

  if (isLocalOrigin(normalizedOrigin)) {
    return true;
  }

  const configuredAllowedOrigins = parseAllowedOrigins();
  if (configuredAllowedOrigins.some((allowedOrigin) => matchesOriginPattern(normalizedOrigin, allowedOrigin))) {
    return true;
  }

  return false;
};

export const appConfig = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3001',
  allowedOrigins: [...STATIC_ALLOWED_ORIGINS, ...parseAllowedOrigins()],
  corsMethods: [...CORS_METHODS],
  corsAllowedHeaders: [...CORS_ALLOWED_HEADERS],
  corsExposedHeaders: [...CORS_EXPOSED_HEADERS],
  corsOrigin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, isOriginAllowed(origin));
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
      throw new Error('SKIP_WEBHOOK_VERIFICATION must not be enabled in production');
    }
    return skip;
  })(),
};
