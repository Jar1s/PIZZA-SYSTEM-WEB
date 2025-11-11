import { Controller, Get, Param, Query, Post, Body, Patch } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('api/tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  async getAllTenants() {
    return this.tenantsService.getAllTenants();
  }

  @Get('resolve')
  async resolveTenant(@Query('domain') domain: string) {
    return this.tenantsService.getTenantByDomain(domain);
  }

  @Get(':slug')
  async getTenant(@Param('slug') slug: string) {
    return this.tenantsService.getTenantBySlug(slug);
  }

  @Post()
  async createTenant(@Body() data: any) {
    return this.tenantsService.createTenant(data);
  }

  @Patch(':slug')
  async updateTenant(@Param('slug') slug: string, @Body() data: any) {
    return this.tenantsService.updateTenant(slug, data);
  }
}








