import { Controller, Post, Body, Param, Get, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DeliveryZoneService, AddressForZone } from './delivery-zone.service';
import { TenantsService } from '../tenants/tenants.service';

@Controller('delivery-zones')
export class DeliveryZoneController {
  private readonly logger = new Logger(DeliveryZoneController.name);

  constructor(
    private deliveryZoneService: DeliveryZoneService,
    private tenantsService: TenantsService,
  ) {}

  /**
   * Get delivery fee for address
   * POST /delivery-zones/:tenantSlug/calculate-fee
   */
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 fee calculations per minute
  @Post(':tenantSlug/calculate-fee')
  async calculateDeliveryFee(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: { address: AddressForZone },
  ) {
    try {
      this.logger.log('calculateDeliveryFee called', {
        tenantSlug,
        address: body.address,
      });
      
      const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
      this.logger.debug('Tenant found', { tenantId: tenant.id, slug: tenant.slug });
      
      const result = await this.deliveryZoneService.getDeliveryFee(
        tenant.id,
        body.address,
      );

      if (!result) {
        this.logger.warn('No delivery zone found for address', {
          tenantSlug,
          address: body.address,
        });
        return {
          available: false,
          message: 'Doprava nie je dostupná pre túto adresu',
        };
      }

      this.logger.log('Delivery fee calculated', {
        tenantSlug,
        zoneName: result.zoneName,
        deliveryFeeCents: result.deliveryFeeCents,
        minOrderCents: result.minOrderCents,
      });

      return {
        available: true,
        deliveryFeeCents: result.deliveryFeeCents,
        deliveryFeeEuros: (result.deliveryFeeCents / 100).toFixed(2),
        minOrderCents: result.minOrderCents,
        minOrderEuros: result.minOrderCents
          ? (result.minOrderCents / 100).toFixed(2)
          : null,
        zoneName: result.zoneName,
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

