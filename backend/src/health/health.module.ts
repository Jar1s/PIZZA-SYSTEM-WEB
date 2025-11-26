import { Module } from '@nestjs/common';
import { HealthMonitorService } from './health-monitor.service';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, TenantsModule, AuthModule],
  controllers: [HealthController],
  providers: [HealthMonitorService],
  exports: [HealthMonitorService],
})
export class HealthModule {}

