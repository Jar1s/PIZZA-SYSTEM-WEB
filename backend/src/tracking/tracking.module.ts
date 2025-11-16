import { Module } from '@nestjs/common';
import { TrackingController } from '../orders/orders.controller';
import { OrdersModule } from '../orders/orders.module'; // Import OrdersModule instead of re-providing OrdersService
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    OrdersModule, // This exports OrdersService with all its dependencies (including StoryousModule)
    PrismaModule, 
    EmailModule, 
    TenantsModule, 
    AuthModule
  ],
  controllers: [TrackingController],
  // Remove OrdersService from providers - it's provided by OrdersModule
})
export class TrackingModule {}


