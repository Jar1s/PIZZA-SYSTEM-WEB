import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController, TrackingController } from './orders.controller';
import { OrderStatusService } from './order-status.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, TenantsModule, EmailModule],
  controllers: [OrdersController, TrackingController],
  providers: [OrdersService, OrderStatusService],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}


