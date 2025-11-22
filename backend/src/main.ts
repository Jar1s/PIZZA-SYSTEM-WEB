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
  
  // Security headers with enhanced CSP
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
  
  // Enable CORS for frontend - allow all .vercel.app origins
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Always allow all Vercel preview URLs (for dynamic deployments)
      if (origin.endsWith('.vercel.app')) {
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
      
      // Check explicit allowed origins
      if (process.env.ALLOWED_ORIGINS) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      
      // Deny by default
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Backend server running on http://localhost:${port}`);
}

bootstrap();


