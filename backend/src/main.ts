import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { json } from 'express';
import { initSentry } from './config/sentry.config';
import { appConfig, getJwtSecret, isOriginAllowed } from './config/app.config';

async function bootstrap() {
  // Initialize Sentry before creating app (for error tracking)
  initSentry();
  
  const logger = new Logger('Bootstrap');

  getJwtSecret();
  
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
      const allowed = isOriginAllowed(origin);

      if (allowed) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', appConfig.corsMethods.join(', '));
        res.header('Access-Control-Allow-Headers', appConfig.corsAllowedHeaders.join(', '));
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
  
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: true,
    methods: appConfig.corsMethods,
    allowedHeaders: appConfig.corsAllowedHeaders,
    exposedHeaders: appConfig.corsExposedHeaders,
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
  
  // Graceful shutdown: on SIGTERM/SIGINT (Render redeploys, scaling) Nest will run
  // lifecycle hooks — PrismaService.onModuleDestroy disconnects the DB cleanly and
  // in-flight requests are allowed to drain instead of being killed mid-flight.
  app.enableShutdownHooks();

  // Ensure we listen on 0.0.0.0 for Render.com (not just localhost)
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Backend server running on http://0.0.0.0:${port}`);
  logger.log(`🚀 Server is ready to accept connections on port ${port}`);
}

bootstrap().catch((err) => {
  // Surface a clean fatal error instead of an unhandled promise rejection.
  // eslint-disable-next-line no-console
  console.error('❌ Fatal error during bootstrap:', err);
  process.exit(1);
});
