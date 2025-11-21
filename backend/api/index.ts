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

    // CORS configuration - MUST be before app.init() and helmet
    // Allow all .vercel.app origins for Vercel deployments
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
      allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant', 'X-Requested-With'],
      exposedHeaders: ['Content-Length', 'Content-Type'],
      maxAge: 86400, // 24 hours
    });

    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.sentry.io", "https://*.ingest.sentry.io", "https://*.vercel.app"],
          fontSrc: ["'self'", "data:", "https:"],
          frameSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
    }));

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
    // Handle OPTIONS preflight requests explicitly BEFORE creating app
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin;
      
      // Allow all .vercel.app origins and explicit allowed origins
      let allowOrigin = false;
      
      if (origin) {
        // Always allow all Vercel preview URLs
        if (origin.endsWith('.vercel.app')) {
          allowOrigin = true;
        }
        // Check explicit allowed origins
        else if (process.env.ALLOWED_ORIGINS) {
          const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
          if (allowedOrigins.includes(origin)) {
            allowOrigin = true;
          }
        }
        // In development, allow localhost
        else if (process.env.NODE_ENV !== 'production') {
          if (origin.startsWith('http://localhost:') || 
              origin.startsWith('http://pornopizza.localhost:') || 
              origin.startsWith('http://pizzavnudzi.localhost:')) {
            allowOrigin = true;
          }
        }
      } else {
        // Allow requests with no origin (like mobile apps or curl requests)
        allowOrigin = true;
      }
      
      if (allowOrigin) {
        // IMPORTANT: With credentials: true, we MUST use the specific origin, not '*'
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(200).end();
      } else {
        // Deny CORS preflight
        return res.status(403).end();
      }
    }
    
    const app = await createApp();
    return app(req, res);
  } catch (error) {
    const Logger = require('@nestjs/common').Logger;
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
