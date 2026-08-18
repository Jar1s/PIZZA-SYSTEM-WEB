import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  SettingsService,
  TenantDeliverySettings,
  TenantOperationsSettings,
  TenantPaymentSettings,
} from './settings.service';

@Controller('settings/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TenantSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':tenantSlug/operations')
  async getOperations(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<TenantOperationsSettings> {
    return this.settingsService.getTenantOperationsSettings(tenantSlug);
  }

  @Put(':tenantSlug/operations')
  async updateOperations(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: { maintenanceMode?: boolean; openingHours?: Record<string, any> | null },
  ): Promise<TenantOperationsSettings> {
    return this.settingsService.updateTenantOperationsSettings(tenantSlug, data || {});
  }

  @Get(':tenantSlug/payment')
  async getPayment(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<TenantPaymentSettings> {
    return this.settingsService.getTenantPaymentSettings(tenantSlug);
  }

  @Put(':tenantSlug/payment')
  async updatePayment(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: { paymentConfig?: Record<string, any> | null },
  ): Promise<TenantPaymentSettings> {
    return this.settingsService.updateTenantPaymentSettings(tenantSlug, data || {});
  }

  @Get(':tenantSlug/delivery')
  async getDelivery(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<TenantDeliverySettings> {
    return this.settingsService.getTenantDeliverySettings(tenantSlug);
  }

  @Post(':tenantSlug/delivery/apply-to-all')
  async applyDeliveryToAll(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<{ source: string; applied: string[]; skipped: string[] }> {
    return this.settingsService.applyDeliverySettingsToAllTenants(tenantSlug);
  }

  @Put(':tenantSlug/delivery')
  async updateDelivery(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: { deliveryConfig?: Record<string, any> | null },
  ): Promise<TenantDeliverySettings> {
    return this.settingsService.updateTenantDeliverySettings(tenantSlug, data || {});
  }
}
