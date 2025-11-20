import { Controller, Get, Param, Query, Post, Body, Patch } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Public()
  @Get()
  async getAllTenants() {
    return this.tenantsService.getAllTenants();
  }

  @Public()
  @Get('resolve')
  async resolveTenant(@Query('domain') domain: string) {
    return this.tenantsService.getTenantByDomain(domain);
  }

  @Public()
  @Get(':slug')
  async getTenant(@Param('slug') slug: string) {
    console.log('[TenantsController] getTenant called with slug:', slug);
    try {
      const tenant = await this.tenantsService.getTenantBySlug(slug);
      console.log('[TenantsController] Tenant found:', tenant?.name);
      return tenant;
    } catch (error) {
      console.error('[TenantsController] Error getting tenant:', error);
      throw error;
    }
  }

  @Post()
  async createTenant(@Body() data: any) {
    return this.tenantsService.createTenant(data);
  }

  @Public()
  @Patch(':slug')
  async updateTenant(@Param('slug') slug: string, @Body() data: any) {
    return this.tenantsService.updateTenant(slug, data);
  }
}













