import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import {
  SettingsService,
  StoryousSettings,
  StoryousAutoPrintReadiness,
} from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('storyous')
  async getStoryousSettings(): Promise<StoryousSettings | null> {
    return this.settingsService.getStoryousSettings();
  }

  @Get('storyous/auto-print-readiness')
  async getStoryousAutoPrintReadiness(): Promise<StoryousAutoPrintReadiness> {
    return this.settingsService.getStoryousAutoPrintReadiness();
  }

  @Put('storyous')
  async updateStoryousSettings(@Body() data: Partial<StoryousSettings>): Promise<StoryousSettings> {
    return this.settingsService.updateStoryousSettings(data);
  }
}
