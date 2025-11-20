import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersController, AdminOrdersController } from './orders.controller';
import { OrderStatusService } from './order-status.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { StoryousModule } from '../storyous/storyous.module';
import { ProductsModule } from '../products/products.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    PrismaModule, 
    TenantsModule, 
    EmailModule, 
    AuthModule, 
    StoryousModule, 
    ProductsModule,
    forwardRef(() => DeliveryModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderStatusService],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}


