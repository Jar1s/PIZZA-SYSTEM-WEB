import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json } from 'express';
import { appConfig } from '../src/config/app.config';
import { initSentry } from '../src/config/sentry.config';

let cachedApp: any;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Initialize Sentry
    initSentry();

    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  
    // Apply middleware
    app.use(json({
      verify: (req: any, res: any, buf: Buffer) => {
        if (req.path && req.path.startsWith('/api/webhooks')) {
          req.rawBody = buf;
        }
      },
    }));

    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

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
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration - allow all .vercel.app origins
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
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
    });

    await app.init();
    
    cachedApp = expressApp;
    return expressApp;
  } catch (err) {
    const logger = new Logger('VercelBootstrap');
    logger.error('Failed to create Nest app for Vercel', err as Error);
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    const logger = new Logger('VercelHandler');
    logger.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
