import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryFeeResponseSchema } from '../common/schemas/delivery.schema';

export interface AddressForZone {
  postalCode?: string;
  city?: string;
  cityPart?: string; // Časť mesta (napr. "Jarovce", "Staré Mesto")
}

export interface DeliveryZoneResult {
  zoneId: string;
  zoneName: string;
  deliveryFeeCents: number;
  minOrderCents: number | null;
}

@Injectable()
export class DeliveryZoneService {
  private readonly logger = new Logger(DeliveryZoneService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find delivery zone for given address
   * Returns zone with highest priority that matches the address
   */
  async findZoneForAddress(
    tenantId: string,
    address: AddressForZone,
  ): Promise<DeliveryZoneResult | null> {
    // Get all active zones for tenant, ordered by priority (descending)
    const zones = await this.prisma.deliveryZone.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        priority: 'desc', // Higher priority first
      },
    });

    if (zones.length === 0) {
      this.logger.warn(`No delivery zones found for tenant ${tenantId}`);
      return null;
    }

    // Normalize address data for comparison
    const normalizedPostalCode = address.postalCode?.trim().toUpperCase();
    const normalizedCity = address.city?.trim().toLowerCase();
    const normalizedCityPart = address.cityPart?.trim().toLowerCase();

    // Find matching zone (check in priority order)
    for (const zone of zones) {
      // Check postal code match
      if (normalizedPostalCode && Array.isArray(zone.postalCodes) && zone.postalCodes.length > 0) {
        const matchingPostalCode = zone.postalCodes.some(
          (pc) => pc && typeof pc === 'string' && pc.trim().toUpperCase() === normalizedPostalCode,
        );
        if (matchingPostalCode) {
          this.logger.log(
            `Zone ${zone.name} matched by postal code ${normalizedPostalCode}`,
          );
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            deliveryFeeCents: zone.deliveryFeeCents,
            minOrderCents: zone.minOrderCents,
          };
        }
      }

      // Check city name match
      if (normalizedCity && Array.isArray(zone.cityNames) && zone.cityNames.length > 0) {
        const matchingCity = zone.cityNames.some(
          (cn) => cn && typeof cn === 'string' && cn.trim().toLowerCase() === normalizedCity,
        );
        if (matchingCity) {
          this.logger.log(`Zone ${zone.name} matched by city ${normalizedCity}`);
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            deliveryFeeCents: zone.deliveryFeeCents,
            minOrderCents: zone.minOrderCents,
          };
        }
      }

      // Check city part match
      if (normalizedCityPart && Array.isArray(zone.cityParts) && zone.cityParts.length > 0) {
        const matchingCityPart = zone.cityParts.some(
          (cp) => cp && typeof cp === 'string' && cp.trim().toLowerCase() === normalizedCityPart,
        );
        if (matchingCityPart) {
          this.logger.log(
            `Zone ${zone.name} matched by city part ${normalizedCityPart}`,
          );
          return {
            zoneId: zone.id,
            zoneName: zone.name,
            deliveryFeeCents: zone.deliveryFeeCents,
            minOrderCents: zone.minOrderCents,
          };
        }
      }
    }

    // No zone found
    this.logger.warn(
      `No delivery zone found for address: ${JSON.stringify(address)}`,
    );
    return null;
  }

  /**
   * Get delivery fee for address
   * Returns delivery fee in cents, or null if no zone found
   */
  async getDeliveryFee(
    tenantId: string,
    address: AddressForZone,
  ): Promise<{ deliveryFeeCents: number; minOrderCents: number | null; zoneName: string } | null> {
    const zone = await this.findZoneForAddress(tenantId, address);
    
    if (!zone) {
      return null;
    }

    const result = {
      deliveryFeeCents: zone.deliveryFeeCents,
      minOrderCents: zone.minOrderCents ?? null,
      zoneName: zone.zoneName,
    };

    // Validate response with Zod
    try {
      const validated = DeliveryFeeResponseSchema.parse(result);
      // Return in expected format (without isAvailable for backward compatibility)
      return {
        deliveryFeeCents: validated.deliveryFeeCents,
        minOrderCents: validated.minOrderCents,
        zoneName: validated.zoneName,
      };
    } catch (error) {
      this.logger.error(`Delivery fee response validation failed`, { error, tenantId, address, result });
      // Return with proper structure as fallback
      return {
        deliveryFeeCents: zone.deliveryFeeCents,
        minOrderCents: zone.minOrderCents ?? null,
        zoneName: zone.zoneName,
      };
    }
  }

  /**
   * Validate if order total meets minimum order requirement for zone
   */
  async validateMinOrder(
    tenantId: string,
    address: AddressForZone,
    orderTotalCents: number,
  ): Promise<{ valid: boolean; minOrderCents: number | null; zoneName: string | null }> {
    const zone = await this.findZoneForAddress(tenantId, address);

    if (!zone) {
      // No zone found - allow order (or you might want to reject)
      return { valid: true, minOrderCents: null, zoneName: null };
    }

    if (zone.minOrderCents === null) {
      // No minimum order requirement
      return { valid: true, minOrderCents: null, zoneName: zone.zoneName };
    }

    const valid = orderTotalCents >= zone.minOrderCents;
    return {
      valid,
      minOrderCents: zone.minOrderCents,
      zoneName: zone.zoneName,
    };
  }
}

