import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TenantsService } from '../tenants/tenants.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private tenantsService: TenantsService,
  ) {}

  @Get('all')
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
  async getTenantAnalytics(
    @Param('tenantSlug') tenantSlug: string,
    @Query('days') days: string = '30',
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const daysNum = parseInt(days, 10) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    return this.analyticsService.getAnalytics(tenant.id, startDate, endDate);
  }
}

