import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AnalyticsModule } from './analytics/analytics.module';
import { DatabaseErrorInterceptor } from './common/interceptors/database-error.interceptor';
import { HealthModule } from './health/health.module';
import { SettingsModule } from './settings/settings.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    // Rate limiting configuration
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 req/min in prod, 1000 in dev
    }]),
    PrismaModule,
    TenantsModule,
    ProductsModule,
    OrdersModule,
    DeliveryModule,
    AuthModule,
    AnalyticsModule,
    HealthModule,
    SettingsModule,
    CustomerModule,
  ],
  controllers: [AppController],
  providers: [
    // Global JWT Auth Guard - fail-closed security (all routes protected by default)
    // Use @Public() decorator to mark public endpoints
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Enable throttling in both development and production
    // Development has higher limit (1000 req/min) to avoid blocking normal usage
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global database error interceptor - handles connection errors and attempts reconnection
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseErrorInterceptor,
    },
  ],
})
export class AppModule {}
