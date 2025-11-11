import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { WoltDriveService } from './wolt-drive.service';
import { DeliveryController } from './delivery.controller';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from '../orders/orders.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrdersModule, TenantsModule],
  controllers: [DeliveryController, WebhooksController],
  providers: [DeliveryService, WoltDriveService],
  exports: [DeliveryService],
})
export class DeliveryModule {}








