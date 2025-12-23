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
        
        // Special handling for openingHours - if it's provided, replace it entirely (don't deep merge)
        if (data.theme.openingHours !== undefined) {
          data.theme = {
            ...existingTheme,
            ...data.theme,
            openingHours: data.theme.openingHours, // Replace entirely, don't merge
          };
          this.logger.log(`[updateTenant] Updating openingHours for ${slug}:`, {
            enabled: data.theme.openingHours?.enabled,
            hasDays: !!data.theme.openingHours?.days,
          });
        } else {
          // Normal merge for other theme properties
          data.theme = {
            ...existingTheme,
            ...data.theme,
          };
        }
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
    
    // Log openingHours state after update for debugging
    const updatedTheme = tenant.theme as any;
    if (updatedTheme?.openingHours) {
      this.logger.log(`[updateTenant] OpeningHours after update for ${slug}:`, {
        enabled: updatedTheme.openingHours.enabled,
        timezone: updatedTheme.openingHours.timezone,
      });
    }
    
    this.logger.log(`Tenant ${slug} updated. isActive: ${tenant.isActive}`);
    return tenant as any as Tenant;
  }

  /**
   * Clone a tenant with all its products, delivery zones, and product mappings
   * Allows overriding specific fields like name, theme, emailConfig, etc.
   */
  async cloneTenant(
    sourceSlug: string,
    cloneData: {
      name: string;
      slug: string;
      subdomain: string;
      domain?: string;
      theme?: any;
      emailConfig?: any;
      deliveryConfig?: any;
      productOverrides?: Record<string, { displayName?: string; description?: string; subHeader?: string; image?: string }>;
    }
  ): Promise<Tenant> {
    this.logger.log(`[cloneTenant] Cloning tenant ${sourceSlug} to ${cloneData.slug}`);

    // Use transaction to ensure all-or-nothing operation
    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch source tenant with all related data
      const sourceTenant = await tx.tenant.findUnique({
        where: { slug: sourceSlug },
        include: {
          products: true,
          deliveryZones: true,
          productMappings: true,
        },
      });

      if (!sourceTenant) {
        throw new NotFoundException(`Source tenant ${sourceSlug} not found`);
      }

      this.logger.log(`[cloneTenant] Found source tenant with ${sourceTenant.products.length} products, ${sourceTenant.deliveryZones.length} zones, ${sourceTenant.productMappings.length} mappings`);

      // 2. Create new tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: cloneData.name,
          slug: cloneData.slug,
          subdomain: cloneData.subdomain,
          domain: cloneData.domain || null,
          currency: sourceTenant.currency,
          paymentProvider: sourceTenant.paymentProvider,
          theme: cloneData.theme || sourceTenant.theme,
          // Keep paymentConfig and deliveryConfig separate for each clone
          paymentConfig: cloneData.deliveryConfig ? {} : sourceTenant.paymentConfig,
          deliveryConfig: cloneData.deliveryConfig || {},
          emailConfig: cloneData.emailConfig || {},
          isActive: true,
        },
      });

      this.logger.log(`[cloneTenant] Created new tenant: ${newTenant.id}`);

      // 3. Clone products (with optional overrides)
      const productIdMap = new Map<string, string>(); // old ID -> new ID mapping

      for (const product of sourceTenant.products) {
        const override = cloneData.productOverrides?.[product.id];
        
        const newProduct = await tx.product.create({
          data: {
            tenantId: newTenant.id,
            name: product.name,
            displayName: override?.displayName || product.displayName,
            description: override?.description || product.description,
            subHeader: override?.subHeader || product.subHeader,
            priceCents: product.priceCents,
            taxRate: product.taxRate,
            category: product.category,
            image: override?.image || product.image,
            modifiers: product.modifiers,
            isActive: product.isActive,
            sortOrder: product.sortOrder,
            allergens: product.allergens,
            weight: product.weight,
          },
        });

        productIdMap.set(product.id, newProduct.id);
      }

      this.logger.log(`[cloneTenant] Cloned ${productIdMap.size} products`);

      // 4. Clone delivery zones
      const zoneIdMap = new Map<string, string>(); // old ID -> new ID mapping

      for (const zone of sourceTenant.deliveryZones) {
        const newZone = await tx.deliveryZone.create({
          data: {
            tenantId: newTenant.id,
            name: zone.name,
            coordinates: zone.coordinates,
            feeCents: zone.feeCents,
            minOrderCents: zone.minOrderCents,
            isActive: zone.isActive,
          },
        });

        zoneIdMap.set(zone.id, newZone.id);
      }

      this.logger.log(`[cloneTenant] Cloned ${zoneIdMap.size} delivery zones`);

      // 5. Clone product mappings
      for (const mapping of sourceTenant.productMappings) {
        const newProductId = productIdMap.get(mapping.productId);
        
        if (newProductId) {
          await tx.productMapping.create({
            data: {
              tenantId: newTenant.id,
              productId: newProductId,
              externalId: mapping.externalId,
              provider: mapping.provider,
            },
          });
        }
      }

      this.logger.log(`[cloneTenant] Cloned ${sourceTenant.productMappings.length} product mappings`);
      this.logger.log(`[cloneTenant] Successfully cloned tenant ${sourceSlug} to ${cloneData.slug}`);

      return newTenant as any as Tenant;
    });
  }

  /**
   * Sync functional data from master tenant to other tenants
   * Preserves individual branding (theme, emailConfig, paymentConfig, deliveryConfig)
   */
  async syncFromMaster(
    masterSlug: string,
    targetSlugs?: string[]
  ): Promise<{ success: boolean; synced: string[]; errors: string[] }> {
    this.logger.log(`[syncFromMaster] Starting sync from master tenant: ${masterSlug}`);

    const result = {
      success: true,
      synced: [] as string[],
      errors: [] as string[],
    };

    // Get master tenant with all data
    const masterTenant = await this.prisma.tenant.findUnique({
      where: { slug: masterSlug },
      include: {
        products: true,
        deliveryZones: true,
        productMappings: true,
      },
    });

    if (!masterTenant) {
      throw new NotFoundException(`Master tenant ${masterSlug} not found`);
    }

    // Get target tenants (all active tenants except master if not specified)
    const targetTenants = targetSlugs
      ? await this.prisma.tenant.findMany({
          where: {
            slug: { in: targetSlugs },
            isActive: true,
          },
        })
      : await this.prisma.tenant.findMany({
          where: {
            slug: { not: masterSlug },
            isActive: true,
          },
        });

    this.logger.log(`[syncFromMaster] Found ${targetTenants.length} target tenants to sync`);

    // Sync each tenant
    for (const targetTenant of targetTenants) {
      try {
        await this.syncTenantFromMaster(masterTenant, targetTenant);
        result.synced.push(targetTenant.slug);
        this.logger.log(`[syncFromMaster] Successfully synced ${targetTenant.slug}`);
      } catch (error) {
        result.success = false;
        result.errors.push(`${targetTenant.slug}: ${error.message}`);
        this.logger.error(`[syncFromMaster] Failed to sync ${targetTenant.slug}:`, error);
      }
    }

    this.logger.log(`[syncFromMaster] Sync complete. Synced: ${result.synced.length}, Errors: ${result.errors.length}`);
    return result;
  }

  /**
   * Internal method to sync a single tenant from master
   */
  private async syncTenantFromMaster(
    masterTenant: any,
    targetTenant: any
  ): Promise<void> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Delete existing products, zones, mappings (but keep tenant config)
      await tx.productMapping.deleteMany({ where: { tenantId: targetTenant.id } });
      await tx.product.deleteMany({ where: { tenantId: targetTenant.id } });
      await tx.deliveryZone.deleteMany({ where: { tenantId: targetTenant.id } });

      // 2. Clone products from master
      const productIdMap = new Map<string, string>();

      for (const product of masterTenant.products) {
        const newProduct = await tx.product.create({
          data: {
            tenantId: targetTenant.id,
            name: product.name,
            displayName: product.displayName,
            description: product.description,
            subHeader: product.subHeader,
            priceCents: product.priceCents,
            taxRate: product.taxRate,
            category: product.category,
            image: product.image,
            modifiers: product.modifiers,
            isActive: product.isActive,
            sortOrder: product.sortOrder,
            allergens: product.allergens,
            weight: product.weight,
          },
        });

        productIdMap.set(product.id, newProduct.id);
      }

      // 3. Clone delivery zones from master
      for (const zone of masterTenant.deliveryZones) {
        await tx.deliveryZone.create({
          data: {
            tenantId: targetTenant.id,
            name: zone.name,
            coordinates: zone.coordinates,
            feeCents: zone.feeCents,
            minOrderCents: zone.minOrderCents,
            isActive: zone.isActive,
          },
        });
      }

      // 4. Clone product mappings from master
      for (const mapping of masterTenant.productMappings) {
        const newProductId = productIdMap.get(mapping.productId);
        
        if (newProductId) {
          await tx.productMapping.create({
            data: {
              tenantId: targetTenant.id,
              productId: newProductId,
              externalId: mapping.externalId,
              provider: mapping.provider,
            },
          });
        }
      }

      // 5. Update StoryousConfig in theme (if enabled in master)
      const masterTheme = masterTenant.theme as any;
      const targetTheme = targetTenant.theme as any;

      if (masterTheme?.storyousConfig) {
        await tx.tenant.update({
          where: { id: targetTenant.id },
          data: {
            theme: {
              ...targetTheme,
              storyousConfig: masterTheme.storyousConfig,
            },
          },
        });
      }

      // NOTE: We do NOT sync theme, emailConfig, paymentConfig, deliveryConfig
      // Those remain individual per tenant
    });
  }
}

