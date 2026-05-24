import { Controller, Get, Put, Post, Body, UseGuards, Query, BadRequestException } from '@nestjs/common';
import {
  SettingsService,
  StoryousSettings,
  StoryousAutoPrintReadiness,
  StoryousModifierMappingInput,
  StoryousModifierMappingRecord,
  StoryousModifierAutoFillResponse,
} from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantsService } from '../tenants/tenants.service';
import { StoryousService } from '../storyous/storyous.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SettingsController {
  constructor(
    private settingsService: SettingsService,
    private tenantsService: TenantsService,
    private storyousService: StoryousService,
  ) {}

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

  @Get('storyous/modifier-mappings')
  async getStoryousModifierMappings(
    @Query('tenantSlug') tenantSlug?: string,
  ): Promise<StoryousModifierMappingRecord[]> {
    if (!tenantSlug) {
      throw new BadRequestException('tenantSlug query parameter is required');
    }

    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.settingsService.getStoryousModifierMappings(tenant.id);
  }

  @Put('storyous/modifier-mappings')
  async replaceStoryousModifierMappings(
    @Query('tenantSlug') tenantSlug: string | undefined,
    @Body() data: { mappings?: StoryousModifierMappingInput[] },
  ): Promise<StoryousModifierMappingRecord[]> {
    if (!tenantSlug) {
      throw new BadRequestException('tenantSlug query parameter is required');
    }

    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.settingsService.replaceStoryousModifierMappings(tenant.id, data?.mappings || []);
  }

  @Post('storyous/modifier-mappings/autofill')
  async autoFillStoryousModifierMappings(
    @Query('tenantSlug') tenantSlug?: string,
  ): Promise<StoryousModifierAutoFillResponse> {
    if (!tenantSlug) {
      throw new BadRequestException('tenantSlug query parameter is required');
    }

    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const storyousSettings = await this.settingsService.getStoryousSettings();

    if (!storyousSettings?.clientId || !storyousSettings?.clientSecret) {
      throw new BadRequestException('Storyous credentials are missing');
    }

    if (!storyousSettings?.merchantId || !storyousSettings?.placeId) {
      throw new BadRequestException('Storyous merchantId/placeId are missing');
    }

    const additions = await this.storyousService.getMenuAdditions(
      storyousSettings.merchantId,
      storyousSettings.placeId,
    );

    return this.settingsService.autoFillStoryousModifierMappings(tenant.id, additions);
  }
}
