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

  app.enableCors({
    origin: appConfig.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
  });

  await app.init();
  
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app(req, res);
}

