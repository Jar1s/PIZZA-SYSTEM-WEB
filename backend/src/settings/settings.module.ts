import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TenantSettingsController } from './tenant-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [PrismaModule, TenantsModule],
  controllers: [SettingsController, TenantSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
