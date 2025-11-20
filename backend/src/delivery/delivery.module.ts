import { Module, forwardRef } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { WoltDriveService } from './wolt-drive.service';
import { DeliveryZoneService } from './delivery-zone.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryZoneController } from './delivery-zone.controller';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from '../orders/orders.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => OrdersModule), TenantsModule],
  controllers: [DeliveryController, DeliveryZoneController, WebhooksController],
  providers: [DeliveryService, WoltDriveService, DeliveryZoneService],
  exports: [DeliveryService, DeliveryZoneService],
})
export class DeliveryModule {}

















