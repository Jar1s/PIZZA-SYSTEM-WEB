import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersController, AdminOrdersController, TrackingController } from './orders.controller';
import { OrderStatusService } from './order-status.service';
import { OrderNumberService } from './order-number.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { StoryousModule } from '../storyous/storyous.module';
import { SettingsModule } from '../settings/settings.module';
import { ProductsModule } from '../products/products.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { PaymentsModule } from '../payments/payments.module';
import { getJwtSecret } from '../config/app.config';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, 
    TenantsModule, 
    EmailModule, 
    AuthModule, 
    SettingsModule,
    StoryousModule,
    ProductsModule,
    NotificationsModule,
    forwardRef(() => DeliveryModule),
    forwardRef(() => PaymentsModule),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [OrdersController, AdminOrdersController, TrackingController],
  providers: [OrdersService, OrderStatusService, OrderNumberService],
  exports: [OrdersService, OrderStatusService, OrderNumberService],
})
export class OrdersModule {}
