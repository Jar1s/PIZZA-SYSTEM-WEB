import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { CustomerService } from './customer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [PrismaModule, AuthModule, TenantsModule],
  controllers: [CustomerController, AdminCustomersController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}

