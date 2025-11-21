import * as Sentry from '@sentry/node';

// Profiling is optional; if the module is missing we just skip it to avoid runtime crashes
let profilingIntegration: (() => any) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { nodeProfilingIntegration } = require('@sentry/profiling-node');
  profilingIntegration = nodeProfilingIntegration;
} catch (err) {
  // Safe fallback when profiling package is not installed in the environment
  console.warn('⚠️  @sentry/profiling-node not installed, disabling Sentry profiling');
}

/**
 * Initialize Sentry for error monitoring
 * Call this before creating the NestJS app
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  SENTRY_DSN not set - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: profilingIntegration ? [profilingIntegration()] : [],
    beforeSend(event, hint) {
      // Scrub sensitive data from events
      if (event.request) {
        // Remove authorization headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['Authorization'];
        }
        
        // Remove cookies that might contain tokens
        if (event.request.cookies) {
          delete event.request.cookies['access_token'];
          delete event.request.cookies['refresh_token'];
        }
      }
      
      // Scrub user data if needed
      if (event.user) {
        // Keep user ID but remove sensitive info
        event.user = {
          id: event.user.id,
        };
      }
      
      return event;
    },
  });
}




