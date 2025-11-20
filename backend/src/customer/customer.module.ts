import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { AdminCustomersController } from './admin-customers.controller';
import { CustomerService } from './customer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CustomerController, AdminCustomersController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}

