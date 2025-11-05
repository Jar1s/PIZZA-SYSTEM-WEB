import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveryModule } from './delivery/delivery.module';

@Module({
  imports: [
    PrismaModule,
    TenantsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    DeliveryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

