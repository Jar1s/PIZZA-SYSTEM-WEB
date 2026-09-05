import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoryousCatalogAddition, autoFillStoryousModifierMappings } from './storyous-mapping.util';

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

export interface StoryousModifierAutoFillResponse {
  mappings: StoryousModifierMappingRecord[];
  matchedCount: number;
  unmatchedCount: number;
  ambiguousCount: number;
  additionsCount: number;
  unmatchedOptions: Array<{ optionId: string; label: string }>;
  ambiguousOptions: Array<{
    optionId: string;
    label: string;
    matches: StoryousCatalogAddition[];
  }>;
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
  paymentConfig: Record<string, any>;
}

export interface TenantDeliverySettings {
  tenantId: string;
  tenantSlug: string;
  tenantSubdomain: string;
  deliveryConfig: Record<string, any>;
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async getTenantBySlug(tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
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
      throw new BadRequestException(`Tenant ${tenantSlug} not found`);
    }

    return tenant;
  }

  private toRecord(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, any>) }
      : {};
  }

  private toNullableRecord(value: unknown): Record<string, any> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ...(value as Record<string, any>) }
      : null;
  }

  async getTenantOperationsSettings(tenantSlug: string): Promise<TenantOperationsSettings> {
    const tenant = await this.getTenantBySlug(tenantSlug);
    const theme = this.toRecord(tenant.theme);

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantSubdomain: tenant.subdomain,
      primaryColor: typeof theme.primaryColor === 'string' ? theme.primaryColor : null,
      secondaryColor: typeof theme.secondaryColor === 'string' ? theme.secondaryColor : null,
      maintenanceMode: theme.maintenanceMode === true,
      openingHours: this.toNullableRecord(theme.openingHours),
    };
  }

  async updateTenantOperationsSettings(
    tenantSlug: string,
    data: { maintenanceMode?: boolean; openingHours?: Record<string, any> | null },
  ): Promise<TenantOperationsSettings> {
    const tenant = await this.getTenantBySlug(tenantSlug);
    const theme = this.toRecord(tenant.theme);

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        theme: {
          ...theme,
          ...(data.maintenanceMode !== undefined ? { maintenanceMode: data.maintenanceMode } : {}),
          ...(data.openingHours !== undefined ? { openingHours: data.openingHours } : {}),
        } as Prisma.InputJsonValue,
      },
    });

    return this.getTenantOperationsSettings(tenantSlug);
  }

  async getTenantPaymentSettings(tenantSlug: string): Promise<TenantPaymentSettings> {
    const tenant = await this.getTenantBySlug(tenantSlug);

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantSubdomain: tenant.subdomain,
      paymentProvider: tenant.paymentProvider || null,
      paymentConfig: this.toRecord(tenant.paymentConfig),
    };
  }

  async updateTenantPaymentSettings(
    tenantSlug: string,
    data: { paymentConfig?: Record<string, any> | null },
  ): Promise<TenantPaymentSettings> {
    const tenant = await this.getTenantBySlug(tenantSlug);
    const currentPaymentConfig = this.toRecord(tenant.paymentConfig);
    const incomingPaymentConfig = this.toRecord(data.paymentConfig);

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        paymentConfig: {
          ...currentPaymentConfig,
          ...incomingPaymentConfig,
        } as Prisma.InputJsonValue,
      },
    });

    return this.getTenantPaymentSettings(tenantSlug);
  }

  async getTenantDeliverySettings(tenantSlug: string): Promise<TenantDeliverySettings> {
    const tenant = await this.getTenantBySlug(tenantSlug);

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantSubdomain: tenant.subdomain,
      deliveryConfig: this.toRecord(tenant.deliveryConfig),
    };
  }

  async updateTenantDeliverySettings(
    tenantSlug: string,
    data: { deliveryConfig?: Record<string, any> | null },
  ): Promise<TenantDeliverySettings> {
    const tenant = await this.getTenantBySlug(tenantSlug);
    const currentDeliveryConfig = this.toRecord(tenant.deliveryConfig);
    const incomingDeliveryConfig = this.toRecord(data.deliveryConfig);

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        deliveryConfig: {
          ...currentDeliveryConfig,
          ...incomingDeliveryConfig,
        } as Prisma.InputJsonValue,
      },
    });

    return this.getTenantDeliverySettings(tenantSlug);
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

  async autoFillStoryousModifierMappings(
    tenantId: string,
    additions: StoryousCatalogAddition[],
  ): Promise<StoryousModifierAutoFillResponse> {
    const result = autoFillStoryousModifierMappings(additions);
    const mappings = await this.replaceStoryousModifierMappings(tenantId, result.mappings);

    return {
      mappings,
      matchedCount: result.matchedCount,
      unmatchedCount: result.unmatchedOptions.length,
      ambiguousCount: result.ambiguousOptions.length,
      additionsCount: result.additionsCount,
      unmatchedOptions: result.unmatchedOptions,
      ambiguousOptions: result.ambiguousOptions,
    };
  }
}
