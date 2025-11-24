import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}
  @Public()
  @Get()
  getRoot() {
    return {
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
    };
  }

  @Public()
  @Get('health')
  async getHealth() {
    const checks: {
      status: string;
      timestamp: string;
      uptime: number;
      database: string;
      error?: string;
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: 'unknown',
    };

    // Test database connection
    try {
      const isConnected = await this.prisma.isConnected();
      if (isConnected) {
        checks.database = 'connected';
      } else {
        checks.database = 'disconnected';
        checks.status = 'degraded';
      }
    } catch (error) {
      checks.database = 'error';
      checks.status = 'degraded';
      checks.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return checks;
  }

  @Public()
  @Get('routes')
  getRoutes() {
    return {
      message: 'Complete list of all API routes',
      timestamp: new Date().toISOString(),
      routes: {
        health: [
          'GET  /api/health',
          'GET  /',
          'GET  /api/routes',
        ],
        tenants: [
          'GET  /api/tenants',
          'GET  /api/tenants/resolve?domain=',
          'GET  /api/tenants/:slug',
          'POST /api/tenants',
          'PATCH /api/tenants/:slug',
        ],
        products: [
          'GET    /api/:tenantSlug/products',
          'GET    /api/:tenantSlug/products?category=',
          'GET    /api/:tenantSlug/products/categories',
          'GET    /api/:tenantSlug/products/:id',
          'POST   /api/:tenantSlug/products',
          'PATCH  /api/:tenantSlug/products/:id',
          'DELETE /api/:tenantSlug/products/:id',
          'POST   /api/:tenantSlug/products/bulk-import',
        ],
        deliveryZones: [
          'POST /api/delivery-zones/:tenantSlug/calculate-fee',
          'POST /api/delivery-zones/:tenantSlug/validate-min-order',
        ],
        auth: {
          customer: [
            'POST /api/auth/customer/check-email',
            'POST /api/auth/customer/register',
            'POST /api/auth/customer/login',
            'POST /api/auth/customer/set-password',
            'POST /api/auth/customer/refresh',
            'POST /api/auth/customer/logout',
            'GET  /api/auth/customer/me',
            'POST /api/auth/customer/send-sms-code',
            'POST /api/auth/customer/verify-sms',
            'POST /api/auth/customer/verify-phone',
          ],
          oauth: [
            'GET /api/auth/google',
            'GET /api/auth/apple',
            'GET /api/auth/oauth/callback',
          ],
        },
        orders: [
          'POST   /api/:tenantSlug/orders',
          'GET    /api/:tenantSlug/orders',
          'GET    /api/:tenantSlug/orders?status=',
          'GET    /api/:tenantSlug/orders?startDate=&endDate=',
          'GET    /api/:tenantSlug/orders/:id',
          'PATCH  /api/:tenantSlug/orders/:id/status',
          'POST   /api/:tenantSlug/orders/:id/sync-storyous',
        ],
        tracking: [
          'GET /api/track/:orderId',
        ],
        customer: [
          'GET    /api/customer/account/profile',
          'PATCH  /api/customer/account/profile',
          'GET    /api/customer/account/addresses',
          'POST   /api/customer/account/addresses',
          'PATCH  /api/customer/account/addresses/:id',
          'DELETE /api/customer/account/addresses/:id',
          'GET    /api/customer/account/orders',
        ],
        payments: [
          'POST /api/payments/session',
        ],
        webhooks: [
          'POST /api/webhooks/adyen',
          'POST /api/webhooks/gopay',
          'POST /api/webhooks/delivery',
        ],
        analytics: [
          'GET /api/analytics/:tenantSlug/dashboard',
        ],
        upload: [
          'POST /api/upload',
        ],
      },
      note: 'For detailed documentation, see backend/API-ROUTES.md',
    };
  }
}

