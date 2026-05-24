import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { TenantSettingsController } from './tenant-settings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StoryousModule } from '../storyous/storyous.module';

@Module({
  imports: [PrismaModule, TenantsModule, forwardRef(() => StoryousModule)],
  controllers: [SettingsController, TenantSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
