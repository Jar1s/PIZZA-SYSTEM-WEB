import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // Validate JWT_SECRET in production
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('❌ JWT_SECRET environment variable is required in production!');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Change it in production!');
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security!');
  }
  
  const app = await NestFactory.create(AppModule);
  
  // Handle root route before setting global prefix
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/' && req.method === 'GET') {
      return res.json({
        message: 'Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          tenants: '/api/tenants',
          products: '/api/:tenantSlug/products',
          orders: '/api/:tenantSlug/orders',
          auth: '/api/auth',
          customer: '/api/customer',
        },
        note: 'All endpoints are prefixed with /api',
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
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL || 'https://pornopizza.sk',
          'https://pornopizza.sk',
          'https://www.pornopizza.sk',
          'https://pizzavnudzi.sk',
          'https://www.pizzavnudzi.sk',
          // Add admin domain if needed
        ]
      : [
          'http://localhost:3001',
          'http://localhost:3000',
          'http://pornopizza.localhost:3001',
          'http://pizzavnudzi.localhost:3001',
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Backend server running on http://localhost:${port}`);
}

bootstrap();


