import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { json } from 'express';
import { appConfig } from './config/app.config';
import { initSentry } from './config/sentry.config';

async function bootstrap() {
  // Initialize Sentry before creating app (for error tracking)
  initSentry();
  
  const logger = new Logger('Bootstrap');
  // Extra baked-in allowed origins for tenant preview/prod
  const extraAllowedOrigins = [
    'https://partypizza.vercel.app',
    'https://pizzaparty.sk',
    'https://www.pizzaparty.sk',
  ];
  // Extra baked-in allowed origins for tenant preview/prod
  const extraAllowedOrigins = [
    'https://partypizza.vercel.app',
    'https://pizzaparty.sk',
    'https://www.pizzaparty.sk',
  ];
  // Temporary baked-in allowlist for new tenant preview domains
  const extraAllowedOrigins = ['https://partypizza.vercel.app'];
  
  // Validate JWT_SECRET in production
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('❌ JWT_SECRET environment variable is required in production!');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    logger.warn('⚠️  WARNING: Using default JWT_SECRET. Change it in production!');
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');
  }
  
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser to configure custom one
  });
  
  // Configure body parser with raw body preservation for webhooks
  app.use(json({
    verify: (req: any, res: Response, buf: Buffer) => {
      // Preserve raw body for webhook routes (needed for signature verification)
      if (req.path && req.path.startsWith('/api/webhooks')) {
        req.rawBody = buf;
      }
    },
  }));
  
  // Handle OPTIONS requests for CORS preflight (before CORS middleware)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin;
      
      // Check if origin is allowed (same logic as CORS)
      let allowed = false;
      if (!origin) {
        allowed = true; // Allow requests with no origin
      } else {
        // Check explicit allowed origins first
        if (process.env.ALLOWED_ORIGINS) {
          const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
          if (allowedOrigins.includes(origin)) {
            allowed = true;
          } else {
            // Also check if origin matches any allowed pattern
            const matchesPattern = allowedOrigins.some(allowed => {
              if (allowed.includes('*')) {
                const pattern = allowed.replace(/\*/g, '.*');
                return new RegExp(`^${pattern}$`).test(origin);
              }
              return false;
            });
            if (matchesPattern) {
              allowed = true;
            }
          }
        }
        // Also allow baked-in extra origins
        if (!allowed && extraAllowedOrigins.includes(origin)) {
          allowed = true;
        }
        if (!allowed && extraAllowedOrigins.includes(origin)) {
          allowed = true;
        }
        if (!allowed && extraAllowedOrigins.includes(origin)) {
          allowed = true;
        }
        
        // Only allow .vercel.app domains if explicitly listed in ALLOWED_ORIGINS
        if (!allowed && origin.endsWith('.vercel.app')) {
          allowed = false; // Deny by default
        }
        
        // Always allow production domains
        if (!allowed && (origin.includes('p0rnopizza.sk') || origin.includes('pornopizza.sk') || origin.includes('pizzavnudzi.sk'))) {
          allowed = true;
        }
        
        // Always allow localhost
        if (!allowed && (origin.startsWith('http://localhost:') || 
                         origin.startsWith('http://127.0.0.1:') ||
                         origin.startsWith('http://pornopizza.localhost:') || 
                         origin.startsWith('http://pizzavnudzi.localhost:'))) {
          allowed = true;
        }
      }
      if (extraAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      if (allowed) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(200).end();
      } else {
        return res.status(403).end();
      }
    }
    next();
  });

  // Handle root route before setting global prefix
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/' && req.method === 'GET') {
      return res.json({
        message: 'Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          routes: '/api/routes',
          tenants: '/api/tenants',
          products: '/api/:tenantSlug/products',
          orders: '/api/:tenantSlug/orders',
          auth: '/api/auth',
          customer: '/api/customer',
          deliveryZones: '/api/delivery-zones/:tenantSlug',
        },
        note: 'All endpoints are prefixed with /api',
        documentation: 'See /api/routes for complete list of all routes',
      });
    }
    next();
  });
  
  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  
  // Global error handler for better debugging
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Enable CORS BEFORE helmet (CORS must be set before security headers)
  // CORS is restricted to specific domains via ALLOWED_ORIGINS env var
  // .vercel.app domains are only allowed if explicitly listed in ALLOWED_ORIGINS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check explicit allowed origins first (includes specific .vercel.app domains)
      if (process.env.ALLOWED_ORIGINS) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Also check if origin matches any allowed pattern (for .vercel.app subdomains)
        const matchesPattern = allowedOrigins.some(allowed => {
          if (allowed.includes('*')) {
            const pattern = allowed.replace(/\*/g, '.*');
            return new RegExp(`^${pattern}$`).test(origin);
          }
          return false;
        });
        if (matchesPattern) {
          return callback(null, true);
        }
      }
      // Also allow baked-in extra origins
      if (extraAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (extraAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Only allow .vercel.app domains if explicitly listed in ALLOWED_ORIGINS
      // This prevents unauthorized access from any Vercel preview URL
      if (origin.endsWith('.vercel.app')) {
        // Deny by default - must be in ALLOWED_ORIGINS
        return callback(null, false);
      }
      
      // Always allow production domains (p0rnopizza.sk, pornopizza.sk, etc.)
      if (origin.includes('p0rnopizza.sk') || origin.includes('pornopizza.sk') || origin.includes('pizzavnudzi.sk')) {
        return callback(null, true);
      }
      
      // Always allow localhost (safe - not publicly accessible)
      // This allows local development even when backend is in production
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://pornopizza.localhost:') || 
          origin.startsWith('http://pizzavnudzi.localhost:')) {
        return callback(null, true);
      }
      
      
      // Deny by default
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });
  
  // Security headers with enhanced CSP (after CORS)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://*.sentry.io", "https://*.ingest.sentry.io"],
        fontSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Get port from environment variable (Render.com sets this)
  // Parse as integer and validate it's a valid port number
  const portEnv = process.env.PORT;
  let port: number;
  
  if (portEnv) {
    port = parseInt(portEnv, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      logger.error(`❌ Invalid PORT environment variable: "${portEnv}". Must be a number between 1-65535.`);
      logger.warn(`⚠️  Falling back to port 3000`);
      port = 3000;
    }
  } else {
    port = 3000;
    logger.warn(`⚠️  PORT environment variable not set, using default: ${port}`);
  }
  
  logger.log(`📡 Starting server on port ${port} (from PORT env: ${portEnv || 'not set'})`);
  
  // Ensure we listen on 0.0.0.0 for Render.com (not just localhost)
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Backend server running on http://0.0.0.0:${port}`);
  logger.log(`🚀 Server is ready to accept connections on port ${port}`);
}

bootstrap();
