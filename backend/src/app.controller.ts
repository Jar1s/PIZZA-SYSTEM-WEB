import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
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
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

