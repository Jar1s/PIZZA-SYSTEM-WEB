import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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
        storyous: updatedStoryous,
      },
      update: {
        storyous: updatedStoryous,
      },
    });
    
    return updatedStoryous as unknown as StoryousSettings;
  }
}
