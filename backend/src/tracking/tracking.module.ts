import { Module } from '@nestjs/common';
import { TrackingController } from '../orders/orders.controller';
import { OrdersService } from '../orders/orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrackingController],
  providers: [OrdersService],
})
export class TrackingModule {}

