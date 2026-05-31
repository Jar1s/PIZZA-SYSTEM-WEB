import { Controller, Get, Param, Query, Post, Body, Patch, NotFoundException, Logger, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('tenants')
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private tenantsService: TenantsService) {}

  private redactPublicTenant(tenant: any) {
    if (!tenant || typeof tenant !== 'object') {
      return tenant;
    }

    const paymentConfig = tenant.paymentConfig && typeof tenant.paymentConfig === 'object'
      ? tenant.paymentConfig
      : {};
    const deliveryConfig = tenant.deliveryConfig && typeof tenant.deliveryConfig === 'object'
      ? tenant.deliveryConfig
      : {};

    const publicPaymentConfig = {
      provider: paymentConfig.provider,
      environment: paymentConfig.environment,
      cardOnDeliveryEnabled: paymentConfig.cardOnDeliveryEnabled,
      cashOnDeliveryEnabled: paymentConfig.cashOnDeliveryEnabled,
    };

    const publicDeliveryConfig = {
      provider: deliveryConfig.provider,
    };

    return {
      ...tenant,
      paymentConfig: publicPaymentConfig,
      deliveryConfig: publicDeliveryConfig,
      emailConfig: undefined,
    };
  }

  @Public()
  @Get()
  async getAllTenants(@Query('includeInactive') includeInactive?: string) {
    const tenants = await this.tenantsService.getAllTenants(includeInactive === 'true');
    return tenants.map((tenant) => this.redactPublicTenant(tenant));
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
    try {
      const tenant = await this.tenantsService.getTenantBySlug(slug);
      return this.redactPublicTenant(tenant);
    } catch (error: any) {
      this.logger.error('[getTenant] Error resolving tenant', {
        slug,
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      throw error;
    }
  }

  @Post()
  async createTenant(@Body() data: any) {
    return this.tenantsService.createTenant(data);
  }

  @Patch(':slug')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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









