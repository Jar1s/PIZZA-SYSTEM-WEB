import { Module, forwardRef } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { WoltDriveService } from './wolt-drive.service';
import { DeliveryZoneService } from './delivery-zone.service';
import { DeliveryFeeTierService } from './delivery-fee-tier.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryZoneController } from './delivery-zone.controller';
import { DeliveryFeeTierController } from './delivery-fee-tier.controller';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from '../orders/orders.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => OrdersModule), TenantsModule],
  controllers: [DeliveryController, DeliveryZoneController, DeliveryFeeTierController, WebhooksController],
  providers: [DeliveryService, WoltDriveService, DeliveryZoneService, DeliveryFeeTierService],
  exports: [DeliveryService, DeliveryZoneService, DeliveryFeeTierService],
})
export class DeliveryModule {}
