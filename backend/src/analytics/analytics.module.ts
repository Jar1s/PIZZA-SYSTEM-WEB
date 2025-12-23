import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [PrismaModule, TenantsModule],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsModule.name);

  onModuleInit() {
    this.logger.log('✅ AnalyticsModule registered with AnalyticsController');
  }
}

