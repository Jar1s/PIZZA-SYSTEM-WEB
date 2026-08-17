import { Controller, Get, Header, Param, Query, Res, UseGuards, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { TenantsService } from '../tenants/tenants.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { localDateKey, resolveAnalyticsPeriod } from './analytics-period';

interface PeriodQuery {
  days?: string;
  from?: string;
  to?: string;
}

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private analyticsService: AnalyticsService,
    private tenantsService: TenantsService,
  ) {}

  private csvFilename(prefix: string, start: Date, end: Date): string {
    return `${prefix}_${localDateKey(start)}_${localDateKey(end)}.csv`;
  }

  // NOTE: the literal "all" routes must be declared before ":tenantSlug"

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getAllAnalytics(@Query() query: PeriodQuery) {
    const { start, end } = resolveAnalyticsPeriod(query);
    return this.analyticsService.getAllTenantsAnalytics(start, end);
  }

  @Get('all/export')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportAll(@Query() query: PeriodQuery, @Res() res: Response) {
    const { start, end } = resolveAnalyticsPeriod(query);
    const csv = await this.analyticsService.exportOrdersCsv(null, start, end);
    res.setHeader('Content-Disposition', `attachment; filename="${this.csvFilename('objednavky_vsetky', start, end)}"`);
    res.send(csv);
  }

  @Get(':tenantSlug')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getTenantAnalytics(@Param('tenantSlug') tenantSlug: string, @Query() query: PeriodQuery) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const { start, end } = resolveAnalyticsPeriod(query);
    const result = await this.analyticsService.getAnalytics(tenant.id, start, end);
    this.logger.debug(`analytics ${tenantSlug} ${localDateKey(start)}..${localDateKey(end)}: ${result.totalOrders} orders`);
    return result;
  }

  @Get(':tenantSlug/export')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportTenant(@Param('tenantSlug') tenantSlug: string, @Query() query: PeriodQuery, @Res() res: Response) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const { start, end } = resolveAnalyticsPeriod(query);
    const csv = await this.analyticsService.exportOrdersCsv([tenant.id], start, end);
    res.setHeader('Content-Disposition', `attachment; filename="${this.csvFilename(`objednavky_${tenant.slug}`, start, end)}"`);
    res.send(csv);
  }
}
