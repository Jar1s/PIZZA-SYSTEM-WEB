import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveryModule } from './delivery/delivery.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CustomerModule } from './customer/customer.module';
import { TrackingModule } from './tracking/tracking.module';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 req/min in prod, 1000 in dev
    }]),
    PrismaModule,
    TenantsModule,
    AuthModule,
    CustomerModule, // Register CustomerModule BEFORE OrdersModule to avoid route conflicts
    ProductsModule,
    OrdersModule, // Must be imported before TrackingModule to avoid circular dependency
    TrackingModule, // TrackingModule depends on OrdersModule
    PaymentsModule,
    DeliveryModule,
    EmailModule,
    AnalyticsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    // Global JWT Auth Guard - fail-closed security (all routes protected by default)
    // Use @Public() decorator to mark public endpoints
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Only enable throttling in production
    ...(process.env.NODE_ENV === 'production' ? [{
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }] : []),
  ],
})
export class AppModule {}

