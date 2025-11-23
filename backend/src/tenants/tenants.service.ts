import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Tenant } from '@pizza-ecosystem/shared';
import { TenantResponseSchema } from '../common/schemas/tenant.schema';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private prisma: PrismaService) {}

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    
    // Validate response with Zod
    try {
      return TenantResponseSchema.parse(tenant) as unknown as Tenant;
    } catch (error) {
      this.logger.error(`Tenant response validation failed for ${id}`, { error, tenant });
      // Return unvalidated data as fallback (shouldn't happen in production)
      return tenant as any as Tenant;
    }
  }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    try {
      this.logger.log(`[getTenantBySlug] Looking for tenant with slug: ${slug}`);
      
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });
      
      if (!tenant) {
        this.logger.warn(`[getTenantBySlug] Tenant ${slug} not found in database`);
        throw new NotFoundException(`Tenant ${slug} not found`);
      }
      
      this.logger.log(`[getTenantBySlug] Tenant found: ${tenant.name} (id: ${tenant.id}, isActive: ${tenant.isActive})`);
      
      // Check if tenant is active
      if (!tenant.isActive) {
        this.logger.warn(`[getTenantBySlug] Tenant ${slug} is not active`);
        throw new NotFoundException(`Tenant ${slug} is not active`);
      }
      
      // Validate response with Zod
      try {
        return TenantResponseSchema.parse(tenant) as unknown as Tenant;
      } catch (error) {
        this.logger.error(`[getTenantBySlug] Tenant response validation failed for ${slug}`, { error, tenant });
        return tenant as any as Tenant;
      }
    } catch (error: any) {
      // Log Prisma errors with full details
      if (error.code) {
        this.logger.error(`[getTenantBySlug] Prisma error (code: ${error.code}): ${error.message}`, {
          code: error.code,
          meta: error.meta,
          stack: error.stack,
        });
      } else {
        this.logger.error(`[getTenantBySlug] Error getting tenant ${slug}:`, error);
      }
      throw error;
    }
  }

  async getTenantByDomain(domain: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { domain },
          { subdomain: domain.split('.')[0] },
        ],
      },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant for domain ${domain} not found`);
    }
    
    // Check if tenant is active
    if (!tenant.isActive) {
      throw new NotFoundException(`Tenant for domain ${domain} is not active`);
    }
    
    // Validate response with Zod
    try {
      return TenantResponseSchema.parse(tenant) as unknown as Tenant;
    } catch (error) {
      this.logger.error(`Tenant response validation failed for domain ${domain}`, { error, tenant });
      return tenant as any as Tenant;
    }
  }

  async getAllTenants(includeInactive: boolean = false): Promise<Tenant[]> {
    const whereClause = includeInactive ? {} : { isActive: true };
    this.logger.log(`getAllTenants called with includeInactive=${includeInactive}, whereClause:`, whereClause);
    
    const tenants = await this.prisma.tenant.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
    
    this.logger.log(`Found ${tenants.length} tenants:`, tenants.map(t => ({ slug: t.slug, name: t.name, isActive: t.isActive })));
    
    // Validate each tenant response with Zod
    return tenants.map(tenant => {
      try {
        return TenantResponseSchema.parse(tenant) as unknown as Tenant;
      } catch (error) {
        this.logger.error(`Tenant response validation failed`, { error, tenantId: tenant.id });
        return tenant as any as Tenant;
      }
    });
  }

  async createTenant(data: any): Promise<Tenant> {
    const tenant = await this.prisma.tenant.create({
      data,
    });
    return tenant as any as Tenant;
  }
  
  async updateTenant(slug: string, data: any): Promise<Tenant> {
    // IMPORTANT: This method only UPDATES existing tenants, it never DELETES them
    // When isActive is set to false, the tenant is just disabled, not removed
    // All tenant data (products, orders, etc.) remains intact
    
    // First, verify the tenant exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { theme: true, paymentConfig: true, deliveryConfig: true },
    });
    
    if (!existingTenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found`);
    }
    
    // If theme is being updated, merge it with existing theme
    if (data.theme && typeof data.theme === 'object') {
      if (existingTenant.theme) {
        const existingTheme = existingTenant.theme as any;
        data.theme = {
          ...existingTheme,
          ...data.theme,
        };
      }
    }
    
    // If paymentConfig is being updated, merge it with existing paymentConfig
    if (data.paymentConfig && typeof data.paymentConfig === 'object') {
      if (existingTenant.paymentConfig) {
        const existingPaymentConfig = existingTenant.paymentConfig as any;
        data.paymentConfig = {
          ...existingPaymentConfig,
          ...data.paymentConfig,
        };
      }
    }
    
    // If deliveryConfig is being updated, merge it with existing deliveryConfig
    if (data.deliveryConfig && typeof data.deliveryConfig === 'object') {
      if (existingTenant.deliveryConfig) {
        const existingDeliveryConfig = existingTenant.deliveryConfig as any;
        data.deliveryConfig = {
          ...existingDeliveryConfig,
          ...data.deliveryConfig,
        };
      }
    }
    
    // Update tenant - this only modifies the record, never deletes it
    const tenant = await this.prisma.tenant.update({
      where: { slug },
      data,
    });
    
    this.logger.log(`Tenant ${slug} updated. isActive: ${tenant.isActive}`);
    return tenant as any as Tenant;
  }
}

