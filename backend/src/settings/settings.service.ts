import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { DeliveryConfig, PaymentConfig, TenantTheme } from '../types/tenant.types';

export interface StoryousSettings {
  clientId: string;
  clientSecret: string;
  merchantId: string;
  placeId: string;
  enabled: boolean;
  autoSync: boolean;
  defaultDeliveryLeadMinutes: number;
  autoAcceptPrintMode: boolean;
  receiptIncludeModifierLines: boolean;
  receiptIncludeOrderNumber: boolean;
}

export interface StoryousModifierMappingRecord {
  id: string;
  tenantId: string;
  optionId: string;
  externalAdditionId: string;
  labelOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryousModifierMappingInput {
  optionId: string;
  externalAdditionId: string;
  labelOverride?: string | null;
}

export interface StoryousAutoPrintReadiness {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  checks: {
    enabled: boolean;
    credentialsConfigured: boolean;
    merchantPlaceConfigured: boolean;
    autoAcceptPrintMode: boolean;
    receiptIncludeModifierLines: boolean;
    receiptIncludeOrderNumber: boolean;
  };
}

export interface TenantOperationsSettings {
  tenantId: string;
  tenantSlug: string;
  tenantSubdomain: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  maintenanceMode: boolean;
  openingHours: Record<string, any> | null;
}

export interface TenantPaymentSettings {
  tenantId: string;
  tenantSlug: string;
  tenantSubdomain: string;
  paymentProvider: string | null;
  paymentConfig: PaymentConfig;
}

export interface TenantDeliverySettings {
  tenantId: string;
  tenantSlug: string;
  tenantSubdomain: string;
  deliveryConfig: DeliveryConfig;
}

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private tenantsService: TenantsService,
  ) {}

  private normalizeTenantSlug(slug: string): string {
    const trimmed = String(slug || '').trim();
    if (trimmed === 'p0rnopizza') return 'pornopizza';
    if (trimmed === 'pizzaparty') return 'partypizza';
    return trimmed;
  }

  private getTenantLookupCandidates(slug: string): string[] {
    const normalized = this.normalizeTenantSlug(slug);
    const candidates = new Set<string>([normalized]);

    if (normalized === 'pornopizza') candidates.add('p0rnopizza');
    if (normalized === 'partypizza') candidates.add('pizzaparty');
    if (normalized === 'p0rnopizza') candidates.add('pornopizza');
    if (normalized === 'pizzaparty') candidates.add('partypizza');

    return Array.from(candidates);
  }

  private async getTenantForSettings(tenantSlug: string) {
    const candidates = this.getTenantLookupCandidates(tenantSlug);
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: { in: candidates } },
          { subdomain: { in: candidates } },
        ],
      },
      select: {
        id: true,
        slug: true,
        subdomain: true,
        theme: true,
        paymentProvider: true,
        paymentConfig: true,
        deliveryConfig: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantSlug} not found`);
    }

    return tenant;
  }

  async getStoryousSettings(): Promise<StoryousSettings | null> {
    const settings = await this.prisma.globalSettings.findUnique({
      where: { id: 'global' },
    });
    
    if (!settings?.storyous) {
      return null;
    }
    
    const raw = settings.storyous as unknown as Partial<StoryousSettings>;
    return {
      clientId: raw.clientId || '',
      clientSecret: raw.clientSecret || '',
      merchantId: raw.merchantId || '',
      placeId: raw.placeId || '',
      enabled: raw.enabled ?? false,
      autoSync: raw.autoSync ?? false,
      defaultDeliveryLeadMinutes: raw.defaultDeliveryLeadMinutes ?? 45,
      autoAcceptPrintMode: raw.autoAcceptPrintMode ?? true,
      receiptIncludeModifierLines: raw.receiptIncludeModifierLines ?? true,
      receiptIncludeOrderNumber: raw.receiptIncludeOrderNumber ?? true,
    };
  }

  async updateStoryousSettings(data: Partial<StoryousSettings>): Promise<StoryousSettings> {
    const existing = await this.prisma.globalSettings.findUnique({
      where: { id: 'global' },
    });
    
    const currentStoryous = ((existing?.storyous as unknown as Partial<StoryousSettings>) || {});
    const updatedStoryous: StoryousSettings = {
      clientId: data.clientId ?? currentStoryous.clientId ?? '',
      clientSecret: data.clientSecret ?? currentStoryous.clientSecret ?? '',
      merchantId: data.merchantId ?? currentStoryous.merchantId ?? '',
      placeId: data.placeId ?? currentStoryous.placeId ?? '',
      enabled: data.enabled ?? currentStoryous.enabled ?? false,
      autoSync: data.autoSync ?? currentStoryous.autoSync ?? false,
      defaultDeliveryLeadMinutes:
        data.defaultDeliveryLeadMinutes ?? currentStoryous.defaultDeliveryLeadMinutes ?? 45,
      autoAcceptPrintMode: data.autoAcceptPrintMode ?? currentStoryous.autoAcceptPrintMode ?? true,
      receiptIncludeModifierLines:
        data.receiptIncludeModifierLines ?? currentStoryous.receiptIncludeModifierLines ?? true,
      receiptIncludeOrderNumber:
        data.receiptIncludeOrderNumber ?? currentStoryous.receiptIncludeOrderNumber ?? true,
    };
    
    await this.prisma.globalSettings.upsert({
      where: { id: 'global' },
      create: {
        id: 'global',
        storyous: updatedStoryous as unknown as Prisma.InputJsonValue,
      },
      update: {
        storyous: updatedStoryous as unknown as Prisma.InputJsonValue,
      },
    });
    
    return updatedStoryous as unknown as StoryousSettings;
  }

  async getStoryousAutoPrintReadiness(): Promise<StoryousAutoPrintReadiness> {
    const settings = await this.getStoryousSettings();

    const checks = {
      enabled: Boolean(settings?.enabled),
      credentialsConfigured: Boolean(
        settings?.clientId?.trim() && settings?.clientSecret?.trim(),
      ),
      merchantPlaceConfigured: Boolean(
        settings?.merchantId?.trim() && settings?.placeId?.trim(),
      ),
      autoAcceptPrintMode: Boolean(settings?.autoAcceptPrintMode ?? false),
      receiptIncludeModifierLines: Boolean(settings?.receiptIncludeModifierLines ?? false),
      receiptIncludeOrderNumber: Boolean(settings?.receiptIncludeOrderNumber ?? false),
    };

    const blockers: string[] = [];
    const warnings: string[] = [];

    if (!checks.enabled) {
      blockers.push('Storyous integrácia nie je aktivovaná.');
    }
    if (!checks.credentialsConfigured) {
      blockers.push('Chýba Storyous ClientID alebo Client Secret.');
    }
    if (!checks.merchantPlaceConfigured) {
      blockers.push('Chýba Storyous MerchantID alebo PlaceID.');
    }

    if (!checks.autoAcceptPrintMode) {
      warnings.push('Auto-confirm v Storyous je vypnutý. Prevádzka môže vyžadovať ručné prijatie objednávky.');
    }
    if (!checks.receiptIncludeModifierLines) {
      warnings.push('Tlač modifikátorov je vypnutá. Bloček nemusí obsahovať + riadky.');
    }
    if (!checks.receiptIncludeOrderNumber) {
      warnings.push('Tlač čísla objednávky je vypnutá.');
    }

    return {
      ready: blockers.length === 0,
      blockers,
      warnings,
      checks,
    };
  }

  async getStoryousModifierMappings(tenantId: string): Promise<StoryousModifierMappingRecord[]> {
    return this.prisma.storyousModifierMapping.findMany({
      where: { tenantId },
      orderBy: [{ optionId: 'asc' }],
    });
  }

  async replaceStoryousModifierMappings(
    tenantId: string,
    mappings: StoryousModifierMappingInput[],
  ): Promise<StoryousModifierMappingRecord[]> {
    const normalizedMappings = mappings
      .map((mapping) => ({
        optionId: String(mapping.optionId || '').trim(),
        externalAdditionId: String(mapping.externalAdditionId || '').trim(),
        labelOverride: mapping.labelOverride == null ? null : String(mapping.labelOverride).trim() || null,
      }))
      .filter((mapping) => mapping.optionId.length > 0 && mapping.externalAdditionId.length > 0);

    await this.prisma.$transaction(async (tx) => {
      const incomingOptionIds = normalizedMappings.map((mapping) => mapping.optionId);

      await tx.storyousModifierMapping.deleteMany({
        where: {
          tenantId,
          ...(incomingOptionIds.length > 0
            ? { optionId: { notIn: incomingOptionIds } }
            : {}),
        },
      });

      for (const mapping of normalizedMappings) {
        await tx.storyousModifierMapping.upsert({
          where: {
            tenantId_optionId: {
              tenantId,
              optionId: mapping.optionId,
            },
          },
          create: {
            tenantId,
            optionId: mapping.optionId,
            externalAdditionId: mapping.externalAdditionId,
            labelOverride: mapping.labelOverride,
          },
          update: {
            externalAdditionId: mapping.externalAdditionId,
            labelOverride: mapping.labelOverride,
          },
        });
      }
    });

    return this.getStoryousModifierMappings(tenantId);
  }

  async getTenantOperationsSettings(tenantSlug: string): Promise<TenantOperationsSettings> {
    const tenant = await this.getTenantForSettings(tenantSlug);
    const theme = ((tenant.theme as TenantTheme | null) || {}) as TenantTheme;
    const themeRecord = (tenant.theme && typeof tenant.theme === 'object'
      ? tenant.theme
      : {}) as Record<string, any>;

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantSubdomain: tenant.subdomain,
      primaryColor: theme.primaryColor || null,
      secondaryColor: theme.secondaryColor || null,
      maintenanceMode: Boolean(theme.maintenanceMode),
      openingHours: themeRecord.openingHours || null,
    };
  }

  async updateTenantOperationsSettings(
    tenantSlug: string,
    data: {
      maintenanceMode?: boolean;
      openingHours?: Record<string, any> | null;
    },
  ): Promise<TenantOperationsSettings> {
    const tenant = await this.getTenantForSettings(tenantSlug);
    const nextTheme: Record<string, any> = {};

    if (data.maintenanceMode !== undefined) {
      nextTheme.maintenanceMode = Boolean(data.maintenanceMode);
    }
    if (data.openingHours !== undefined) {
      nextTheme.openingHours = data.openingHours;
    }

    if (Object.keys(nextTheme).length > 0) {
      await this.tenantsService.updateTenant(tenant.subdomain || tenant.slug, {
        theme: nextTheme,
      });
    }

    return this.getTenantOperationsSettings(tenant.subdomain || tenant.slug);
  }

  async getTenantPaymentSettings(tenantSlug: string): Promise<TenantPaymentSettings> {
    const tenant = await this.getTenantForSettings(tenantSlug);

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantSubdomain: tenant.subdomain,
      paymentProvider: tenant.paymentProvider || null,
      paymentConfig: ((tenant.paymentConfig as PaymentConfig | null) || {}) as PaymentConfig,
    };
  }

  async updateTenantPaymentSettings(
    tenantSlug: string,
    data: { paymentConfig?: PaymentConfig | null },
  ): Promise<TenantPaymentSettings> {
    const tenant = await this.getTenantForSettings(tenantSlug);

    await this.tenantsService.updateTenant(tenant.subdomain || tenant.slug, {
      paymentConfig: (data.paymentConfig || {}) as Record<string, any>,
    });

    return this.getTenantPaymentSettings(tenant.subdomain || tenant.slug);
  }

  async getTenantDeliverySettings(tenantSlug: string): Promise<TenantDeliverySettings> {
    const tenant = await this.getTenantForSettings(tenantSlug);

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantSubdomain: tenant.subdomain,
      deliveryConfig: ((tenant.deliveryConfig as DeliveryConfig | null) || {}) as DeliveryConfig,
    };
  }

  async updateTenantDeliverySettings(
    tenantSlug: string,
    data: { deliveryConfig?: DeliveryConfig | null },
  ): Promise<TenantDeliverySettings> {
    const tenant = await this.getTenantForSettings(tenantSlug);

    await this.tenantsService.updateTenant(tenant.subdomain || tenant.slug, {
      deliveryConfig: (data.deliveryConfig || {}) as Record<string, any>,
    });

    return this.getTenantDeliverySettings(tenant.subdomain || tenant.slug);
  }
}
