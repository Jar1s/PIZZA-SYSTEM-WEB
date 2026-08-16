import { isPlausibleCoordinatePair } from '../utils/coordinates';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateHaversineDistance } from './utils/distance.util';
import { DeliveryConfig } from '../types/tenant.types';

export interface AddressForGeocoding {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName?: string;
}

export interface DeliveryFeeByDistanceResult {
  deliveryFeeCents: number;
  distanceMeters: number;
  tierId?: string;
  isOutOfRange?: boolean; // true if distance > max tier
}

@Injectable()
export class DeliveryFeeTierService {
  private readonly logger = new Logger(DeliveryFeeTierService.name);
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000;

  constructor(private prisma: PrismaService) {}

  async geocodeAddress(address: AddressForGeocoding): Promise<GeocodeResult> {
    if (
      address.coordinates?.lat != null &&
      address.coordinates?.lng != null &&
      isPlausibleCoordinatePair(Number(address.coordinates.lat), Number(address.coordinates.lng))
    ) {
      return {
        lat: address.coordinates.lat,
        lng: address.coordinates.lng,
      };
    }

    try {
      return await this.geocodeWithRetry(address, true);
    } catch (error) {
      this.logger.warn('Detailed geocoding failed, trying simplified address', {
        error: error instanceof Error ? error.message : String(error),
        address,
      });

      try {
        const simplifiedAddress: AddressForGeocoding = {
          city: address.city,
          postalCode: address.postalCode,
          country: address.country,
        };
        return await this.geocodeWithRetry(simplifiedAddress, false);
      } catch (fallbackError) {
        this.logger.warn('Simplified geocoding failed, trying backup service', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          address,
        });

        // BACKUP: Try backup geocoding service
        try {
          return await this.geocodeWithBackupService(address);
        } catch (backupError) {
          this.logger.error('All geocoding services failed', {
            error: backupError instanceof Error ? backupError.message : String(backupError),
            address,
          });
          throw new BadRequestException(
            'Failed to geocode address. Please check the address and try again.'
          );
        }
      }
    }
  }

  private async geocodeWithRetry(
    address: AddressForGeocoding,
    isDetailed: boolean,
  ): Promise<GeocodeResult> {
    const queryParts: string[] = [];
    if (isDetailed && address.street) queryParts.push(address.street);
    if (address.city) queryParts.push(address.city);
    if (address.postalCode) queryParts.push(address.postalCode);
    if (address.country) queryParts.push(address.country);

    if (queryParts.length === 0) {
      throw new BadRequestException('Address is required for geocoding');
    }

    const query = queryParts.join(', ');
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'PizzaOrderingApp/1.0',
            'Accept-Language': 'sk,en',
          },
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          
          this.logger.warn(`Rate limited by Nominatim API, waiting ${delay}ms before retry ${attempt + 1}/${this.MAX_RETRIES}`);
          await this.delay(delay);
          continue;
        }

        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data: any[] = await response.json();

        if (!data || data.length === 0) {
          throw new BadRequestException('Address not found. Please check the address.');
        }

        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
        };
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof BadRequestException) {
          throw error;
        }

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          this.logger.warn(`Geocoding attempt ${attempt + 1}/${this.MAX_RETRIES} failed, retrying in ${delay}ms`, {
            error: lastError.message,
          });
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Geocoding failed after all retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getDistanceToTier(distanceMeters: number, tier: { minDistanceMeters: number; maxDistanceMeters: number }): number {
    if (distanceMeters < tier.minDistanceMeters) {
      return tier.minDistanceMeters - distanceMeters;
    }
    if (distanceMeters > tier.maxDistanceMeters) {
      return distanceMeters - tier.maxDistanceMeters;
    }
    return 0;
  }

  private findClosestTier<T extends {
    id: string;
    minDistanceMeters: number;
    maxDistanceMeters: number;
    deliveryFeeCents: number;
  }>(
    distanceMeters: number,
    tiers: T[],
  ): T | null {
    if (tiers.length === 0) {
      return null;
    }

    return tiers.reduce((closest, tier) => {
      const closestDistance = this.getDistanceToTier(distanceMeters, closest);
      const tierDistance = this.getDistanceToTier(distanceMeters, tier);

      if (tierDistance < closestDistance) {
        return tier;
      }

      if (tierDistance === closestDistance && tier.maxDistanceMeters > closest.maxDistanceMeters) {
        return tier;
      }

      return closest;
    });
  }

  // BACKUP geocoding service (alternative Nominatim endpoint format)
  private async geocodeWithBackupService(address: AddressForGeocoding): Promise<GeocodeResult> {
    if (!address.postalCode && !address.city) {
      throw new BadRequestException('Postal code or city is required for backup geocoding');
    }

    // Use postalcode + city format (more reliable for Slovak addresses)
    const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(address.postalCode || '')}&city=${encodeURIComponent(address.city || '')}&country=${encodeURIComponent(address.country || 'SK')}&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PizzaOrderingApp/1.0',
          'Accept-Language': 'sk,en',
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.INITIAL_RETRY_DELAY;
        this.logger.warn(`Backup geocoding rate limited, waiting ${delay}ms`);
        await this.delay(delay);
        // Retry once
        const retryResponse = await fetch(url, {
          headers: {
            'User-Agent': 'PizzaOrderingApp/1.0',
            'Accept-Language': 'sk,en',
          },
        });
        if (!retryResponse.ok) {
          throw new Error(`Backup geocoding API error: ${retryResponse.status}`);
        }
        const retryData: any[] = await retryResponse.json();
        if (!retryData || retryData.length === 0) {
          throw new BadRequestException('Address not found in backup service.');
        }
        const result = retryData[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
        };
      }

      if (!response.ok) {
        throw new Error(`Backup geocoding API error: ${response.status}`);
      }

      const data: any[] = await response.json();

      if (!data || data.length === 0) {
        throw new BadRequestException('Address not found in backup service.');
      }

      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Backup geocoding failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getDeliveryFeeByDistance(
    tenantId: string,
    address: AddressForGeocoding,
  ): Promise<DeliveryFeeByDistanceResult | null> {
    // Safety guard in case Prisma client isn't regenerated with deliveryFeeTier model
    if (!(this.prisma as any).deliveryFeeTier) {
      this.logger.error('Prisma client is missing deliveryFeeTier delegate. Run `prisma generate`.');
      throw new BadRequestException('Delivery calculation service is temporarily unavailable. Please try again.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { deliveryConfig: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const deliveryConfig = tenant.deliveryConfig as DeliveryConfig | null;
    const pickupAddress = deliveryConfig?.pickupAddress;

    if (!pickupAddress?.coordinates?.lat || !pickupAddress?.coordinates?.lng) {
      this.logger.error('Kitchen coordinates not configured', { tenantId });
      throw new BadRequestException(
        'Kitchen location is not configured. Please contact support.'
      );
    }

    const kitchenLat = pickupAddress.coordinates.lat;
    const kitchenLng = pickupAddress.coordinates.lng;

    // Load tiers BEFORE geocoding (needed to check max distance)
    let tiers;
    try {
      tiers = await this.prisma.deliveryFeeTier.findMany({
        where: {
          OR: [
            { tenantId },
            { tenantId: null },
          ],
          isActive: true,
        },
        orderBy: [
          { priority: 'desc' },
          { minDistanceMeters: 'asc' },
        ],
      });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to load delivery fee tiers from database', {
        tenantId,
        error: message,
      });
      const fallbackFee = deliveryConfig?.defaultFeeCents;
      if (fallbackFee !== undefined && typeof fallbackFee === 'number') {
        this.logger.warn('Using default delivery fee because tiers table is missing/unavailable', {
          tenantId,
          fallbackFee,
        });
        return {
          deliveryFeeCents: fallbackFee,
          distanceMeters: 0,
        };
      }
      throw new BadRequestException(
        'Delivery configuration is unavailable. Please contact support (database migration missing).'
      );
    }

    // Try to geocode and calculate distance
    let distanceMeters: number;
    try {
      const customerCoords = await this.geocodeAddress(address);
      const customerLat = customerCoords.lat;
      const customerLng = customerCoords.lng;

      distanceMeters = calculateHaversineDistance(
        kitchenLat,
        kitchenLng,
        customerLat,
        customerLng,
      );

      this.logger.debug('Distance calculated', {
        tenantId,
        distanceMeters,
        kitchen: { lat: kitchenLat, lng: kitchenLng },
        customer: { lat: customerLat, lng: customerLng },
      });
    } catch (geocodingError) {
      this.logger.error('Geocoding failed', {
        tenantId,
        error: geocodingError instanceof Error ? geocodingError.message : String(geocodingError),
        address,
      });
      const fallbackFee = deliveryConfig?.defaultFeeCents;
      if (fallbackFee !== undefined && typeof fallbackFee === 'number') {
        this.logger.warn('Using default delivery fee due to geocoding failure', {
          tenantId,
          fallbackFee,
        });
        return {
          deliveryFeeCents: fallbackFee,
          distanceMeters: 0,
        };
      }
      throw geocodingError; // Re-throw to let caller handle when no fallback fee
    }

    // Find matching tier
    const matchingTier = tiers.find(
      (tier) =>
        distanceMeters >= tier.minDistanceMeters &&
        distanceMeters <= tier.maxDistanceMeters,
    );

    if (matchingTier) {
      return {
        deliveryFeeCents: matchingTier.deliveryFeeCents,
        distanceMeters,
        tierId: matchingTier.id,
      };
    }

    const defaultFeeCents = deliveryConfig?.defaultFeeCents;
    if (defaultFeeCents !== undefined && typeof defaultFeeCents === 'number') {
      this.logger.warn('No tier matched exact distance, using default fee fallback', {
        tenantId,
        distanceMeters,
        defaultFeeCents,
      });
      return {
        deliveryFeeCents: defaultFeeCents,
        distanceMeters,
      };
    }

    const closestTier = this.findClosestTier(distanceMeters, tiers);
    if (closestTier) {
      this.logger.warn('No exact delivery tier match, using closest tier fallback', {
        tenantId,
        distanceMeters,
        fallbackTierId: closestTier.id,
        fallbackMinDistanceMeters: closestTier.minDistanceMeters,
        fallbackMaxDistanceMeters: closestTier.maxDistanceMeters,
        fallbackDeliveryFeeCents: closestTier.deliveryFeeCents,
      });
      return {
        deliveryFeeCents: closestTier.deliveryFeeCents,
        distanceMeters,
        tierId: closestTier.id,
      };
    }

    this.logger.warn('No delivery tiers configured for calculated distance', {
      tenantId,
      distanceMeters,
    });
    return null;
  }
}
