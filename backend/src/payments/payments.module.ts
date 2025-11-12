import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WepayService } from './wepay.service';
import { WebhooksController } from './webhooks.controller';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { TenantsModule } from '../tenants/tenants.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [OrdersModule, TenantsModule, DeliveryModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, AdyenService, GopayService, WepayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}


