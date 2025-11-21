/**
 * Application configuration
 * Centralized config to avoid hardcoded values
 */

export const appConfig = {
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3001',
  
  // CORS configuration
  // In production, allows specific origins from ALLOWED_ORIGINS env var
  // Also allows all *.vercel.app URLs for dynamic deployments
  allowedOrigins: (() => {
    const origins: string[] = [];
    
    // Add explicit origins from environment variable
    if (process.env.ALLOWED_ORIGINS) {
      origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
    }
    
    // In production, we'll use a dynamic function to allow all .vercel.app URLs
    if (process.env.NODE_ENV === 'production') {
      // Return a function that will be used by NestJS CORS
      return true; // Signal to use dynamic function
    }
    
    // Development fallback (only in non-production)
    return [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://pornopizza.localhost:3001',
      'http://pizzavnudzi.localhost:3001',
    ];
  })(),
  
  // CORS origin validator function
  // Allows specific origins and all Vercel preview URLs
  corsOrigin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Always allow all Vercel preview URLs (for dynamic deployments)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Check explicit allowed origins
    if (process.env.ALLOWED_ORIGINS) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // In development, allow localhost
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://pornopizza.localhost:') || origin.startsWith('http://pizzavnudzi.localhost:')) {
        return callback(null, true);
      }
    }
    
    // Deny by default
    callback(null, false);
  },
  
  // Tax configuration
  defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '20.0'),
  
  // Security
  skipWebhookVerification: process.env.SKIP_WEBHOOK_VERIFICATION === 'true',
};

