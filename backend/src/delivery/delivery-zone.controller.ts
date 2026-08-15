import { Controller, Post, Body, Param, Get, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { DeliveryZoneService, AddressForZone } from './delivery-zone.service';
import { DeliveryFeeTierService, AddressForGeocoding } from './delivery-fee-tier.service';
import { DeliveryService } from './delivery.service';
import { TenantsService } from '../tenants/tenants.service';

@Controller('delivery-zones')
export class DeliveryZoneController {
  private readonly logger = new Logger(DeliveryZoneController.name);

  constructor(
    private deliveryZoneService: DeliveryZoneService,
    private deliveryFeeTierService: DeliveryFeeTierService,
    private deliveryService: DeliveryService,
    private tenantsService: TenantsService,
  ) {}

  /**
   * Get delivery fee for address
   * POST /delivery-zones/:tenantSlug/calculate-fee
   * Uses distance-based calculation
   */
  @Public() // Public endpoint - used in checkout before user is logged in
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 fee calculations per minute
  @Post(':tenantSlug/calculate-fee')
  async calculateDeliveryFee(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: { address: AddressForZone & { street?: string; coordinates?: { lat: number; lng: number } } },
  ) {
    try {
      this.logger.log('calculateDeliveryFee called', {
        tenantSlug,
        address: body.address,
      });
      
      const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
      this.logger.debug('Tenant found', { tenantId: tenant.id, slug: tenant.slug });
      
      // Distance-based calculation only
      const distanceResult = await this.deliveryFeeTierService.getDeliveryFeeByDistance(
        tenant.id,
        {
          street: body.address.street,
          city: body.address.city,
          postalCode: body.address.postalCode,
          country: 'SK',
          coordinates: body.address.coordinates,
        }
      );

      if (!distanceResult) {
        this.logger.warn('No delivery tier found for distance', {
          tenantSlug,
          address: body.address,
        });
        return {
          available: false,
          message: 'Doprava nie je dostupná pre túto vzdialenosť',
        };
      }

      // Check if address is out of range
      if (distanceResult.isOutOfRange) {
        this.logger.warn('Address is outside delivery range', {
          tenantSlug,
          distanceMeters: distanceResult.distanceMeters,
        });
        return {
          available: false,
          message: 'Adresa je mimo dosahu doručovania',
        };
      }

      // Distance tiers alone let far-away addresses through (e.g. Senec, 23 km
      // out) and the customer would pay before Wolt refuses the dispatch. Ask
      // the courier-side boundary too: a definite "outside" blocks the address
      // BEFORE payment. Unknown (no Wolt config, missing coordinates, API
      // trouble) fails open — the post-payment dispatch alert still covers it.
      try {
        const areaCheck = await this.deliveryService.checkAreaByTenantSlug(
          tenantSlug,
          body.address,
        );
        if (areaCheck.insideArea === false) {
          this.logger.warn('Address is outside the Wolt delivery area', {
            tenantSlug,
            distanceMeters: distanceResult.distanceMeters,
            source: areaCheck.source,
          });
          return {
            available: false,
            message: 'Na túto adresu momentálne nedoručujeme — je mimo našej rozvozovej zóny.',
          };
        }
      } catch (error: any) {
        this.logger.warn('Wolt area check failed during fee calculation, allowing order', {
          tenantSlug,
          error: error?.message,
        });
      }

      this.logger.log('Delivery fee calculated by distance', {
        tenantSlug,
        distanceMeters: distanceResult.distanceMeters,
        deliveryFeeCents: distanceResult.deliveryFeeCents,
      });

      return {
        available: true,
        deliveryFeeCents: distanceResult.deliveryFeeCents,
        deliveryFeeEuros: (distanceResult.deliveryFeeCents / 100).toFixed(2),
        distanceMeters: distanceResult.distanceMeters,
        distanceKm: (distanceResult.distanceMeters / 1000).toFixed(2),
        minOrderCents: null,
        minOrderEuros: null,
        zoneName: null,
      };
    } catch (error: any) {
      this.logger.error('Error calculating delivery fee', {
        error: error.message,
        stack: error.stack,
        tenantSlug,
        address: body.address,
      });
      throw error;
    }
  }

  /**
   * Validate minimum order for address
   * POST /delivery-zones/:tenantSlug/validate-min-order
   */
  @Public() // Public endpoint - used in checkout before user is logged in
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 validations per minute
  @Post(':tenantSlug/validate-min-order')
  async validateMinOrder(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: { address: AddressForZone; orderTotalCents: number },
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const result = await this.deliveryZoneService.validateMinOrder(
      tenant.id,
      body.address,
      body.orderTotalCents,
    );

    return {
      valid: result.valid,
      minOrderCents: result.minOrderCents,
      minOrderEuros: result.minOrderCents
        ? (result.minOrderCents / 100).toFixed(2)
        : null,
      zoneName: result.zoneName,
      message: result.valid
        ? null
        : `Minimálna objednávka pre ${result.zoneName} je ${(result.minOrderCents! / 100).toFixed(2)}€`,
    };
  }
}
