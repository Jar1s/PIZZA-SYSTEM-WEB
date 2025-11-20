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
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant ${slug} not found`);
    }
    
    // Validate response with Zod
    try {
      return TenantResponseSchema.parse(tenant) as unknown as Tenant;
    } catch (error) {
      this.logger.error(`Tenant response validation failed for ${slug}`, { error, tenant });
      return tenant as any as Tenant;
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
    
    // Validate response with Zod
    try {
      return TenantResponseSchema.parse(tenant) as unknown as Tenant;
    } catch (error) {
      this.logger.error(`Tenant response validation failed for domain ${domain}`, { error, tenant });
      return tenant as any as Tenant;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
    });
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
    // Get existing tenant data for merging JSON fields
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { theme: true, paymentConfig: true, deliveryConfig: true },
    });
    
    // If theme is being updated, merge it with existing theme
    if (data.theme && typeof data.theme === 'object') {
      if (existingTenant && existingTenant.theme) {
        const existingTheme = existingTenant.theme as any;
        data.theme = {
          ...existingTheme,
          ...data.theme,
        };
      }
    }
    
    // If paymentConfig is being updated, merge it with existing paymentConfig
    if (data.paymentConfig && typeof data.paymentConfig === 'object') {
      if (existingTenant && existingTenant.paymentConfig) {
        const existingPaymentConfig = existingTenant.paymentConfig as any;
        data.paymentConfig = {
          ...existingPaymentConfig,
          ...data.paymentConfig,
        };
      }
    }
    
    // If deliveryConfig is being updated, merge it with existing deliveryConfig
    if (data.deliveryConfig && typeof data.deliveryConfig === 'object') {
      if (existingTenant && existingTenant.deliveryConfig) {
        const existingDeliveryConfig = existingTenant.deliveryConfig as any;
        data.deliveryConfig = {
          ...existingDeliveryConfig,
          ...data.deliveryConfig,
        };
      }
    }
    
    const tenant = await this.prisma.tenant.update({
      where: { slug },
      data,
    });
    return tenant as any as Tenant;
  }
}

