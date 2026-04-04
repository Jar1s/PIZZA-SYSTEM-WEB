import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TenantsService } from '../tenants/tenants.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private analyticsService: AnalyticsService,
    private tenantsService: TenantsService,
  ) {
    this.logger.log('AnalyticsController initialized');
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getAllAnalytics(
    @Query('days') days: string = '30',
  ) {
    const daysNum = parseInt(days, 10) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    return this.analyticsService.getAllTenantsAnalytics(startDate, endDate);
  }

  @Get(':tenantSlug')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getTenantAnalytics(
    @Param('tenantSlug') tenantSlug: string,
    @Query('days') days: string = '30',
  ) {
    this.logger.log(`getTenantAnalytics called with tenantSlug: ${tenantSlug}, days: ${days}`);
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const daysNum = parseInt(days, 10) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const result = await this.analyticsService.getAnalytics(tenant.id, startDate, endDate);
    this.logger.log(`getTenantAnalytics returned ${result.totalOrders} orders`);
    return result;
  }
}
