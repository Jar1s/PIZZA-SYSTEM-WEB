/**
 * Application configuration
 * Centralized config to avoid hardcoded values
 */

export const appConfig = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3001',
  
  // CORS configuration
  // SECURITY: In production, ALLOWED_ORIGINS must be set via environment variable
  // No hardcoded fallback values to prevent misconfiguration
  allowedOrigins: (() => {
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    }
    
    if (process.env.NODE_ENV === 'production') {
      // In production, require explicit configuration
      throw new Error(
        'ALLOWED_ORIGINS environment variable is required in production. ' +
        'Set it to a comma-separated list of allowed origins (e.g., "https://pornopizza.sk,https://www.pornopizza.sk")'
      );
    }
    
    // Development fallback (only in non-production)
    return [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://pornopizza.localhost:3001',
      'http://pizzavnudzi.localhost:3001',
    ];
  })(),
  
  // Tax configuration
  defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '20.0'),
  
  // Security
  skipWebhookVerification: process.env.SKIP_WEBHOOK_VERIFICATION === 'true',
};

