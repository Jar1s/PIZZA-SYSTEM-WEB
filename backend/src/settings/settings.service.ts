import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StoryousSettings {
  clientId: string;
  clientSecret: string;
  merchantId: string;
  placeId: string;
  enabled: boolean;
  autoSync: boolean;
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
    
    return settings.storyous as unknown as StoryousSettings;
  }

  async updateStoryousSettings(data: Partial<StoryousSettings>): Promise<StoryousSettings> {
    const existing = await this.prisma.globalSettings.findUnique({
      where: { id: 'global' },
    });
    
    const currentStoryous = (existing?.storyous as unknown as StoryousSettings) || {};
    const updatedStoryous = { ...currentStoryous, ...data };
    
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
