import { Controller, Get, Param, Query, Post, Body, Patch, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Public()
  @Get()
  async getAllTenants(@Query('includeInactive') includeInactive?: string) {
    return this.tenantsService.getAllTenants(includeInactive === 'true');
  }

  @Public()
  @Get('resolve')
  async resolveTenant(@Query('domain') domain: string) {
    // Try exact domain match first
    let tenant = await this.tenantsService.findTenantByDomain(domain);
    
    // If not found, try subdomain extraction
    if (!tenant) {
      const subdomain = domain.split('.')[0];
      try {
        tenant = await this.tenantsService.getTenantBySlug(subdomain);
      } catch (error) {
        // Tenant not found by slug either
      }
    }
    
    if (!tenant) {
      throw new NotFoundException('Tenant not found for domain');
    }
    
    return { slug: tenant.slug, name: tenant.name };
  }

  @Public()
  @Get(':slug')
  async getTenant(@Param('slug') slug: string) {
    console.log('[TenantsController] getTenant called with slug:', slug);
    try {
      const tenant = await this.tenantsService.getTenantBySlug(slug);
      console.log('[TenantsController] Tenant found:', tenant?.name);
      return tenant;
    } catch (error: any) {
      console.error('[TenantsController] Error getting tenant:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
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

  /**
   * Clone a tenant with all its products, delivery zones, and product mappings
   * POST /api/tenants/:slug/clone
   */
  @Post(':slug/clone')
  async cloneTenant(
    @Param('slug') slug: string,
    @Body() cloneData: {
      name: string;
      slug: string;
      subdomain: string;
      domain?: string;
      theme?: any;
      emailConfig?: any;
      deliveryConfig?: any;
      productOverrides?: Record<string, { displayName?: string; description?: string; subHeader?: string; image?: string }>;
    }
  ) {
    return this.tenantsService.cloneTenant(slug, cloneData);
  }

  /**
   * Sync functional data from master tenant to other tenants
   * POST /api/tenants/sync-from-master
   */
  @Post('sync-from-master')
  async syncFromMaster(
    @Body() data: {
      masterSlug: string;
      targetSlugs?: string[];
    }
  ) {
    return this.tenantsService.syncFromMaster(data.masterSlug, data.targetSlugs);
  }
}











