import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN, // Only enable if DSN is set
  beforeSend(event, hint) {
    // Scrub sensitive data
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['Authorization'];
      }
      if (event.request.cookies) {
        delete event.request.cookies['access_token'];
        delete event.request.cookies['refresh_token'];
      }
    }
    return event;
  },
});

