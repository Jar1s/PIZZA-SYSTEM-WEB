import { Module } from '@nestjs/common';
import { TrackingController } from '../orders/orders.controller';
import { OrdersService } from '../orders/orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, EmailModule, TenantsModule, AuthModule],
  controllers: [TrackingController],
  providers: [OrdersService],
})
export class TrackingModule {}


