import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Logger, Query } from '@nestjs/common';
import { DeliveryAreaCacheService, OUTSIDE_WOLT_ZONE_MESSAGE } from './delivery-area-cache.service';
import { DeliveryFeeTierService, AddressForGeocoding } from './delivery-fee-tier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { TenantsService } from '../tenants/tenants.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('delivery-fee-tiers')
@UseGuards(JwtAuthGuard)
export class DeliveryFeeTierController {
  private readonly logger = new Logger(DeliveryFeeTierController.name);

  constructor(
    private deliveryFeeTierService: DeliveryFeeTierService,
    private deliveryAreaCacheService: DeliveryAreaCacheService,
    private tenantsService: TenantsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getAllTiers(@Query('tenantSlug') tenantSlug?: string) {
    let tenantId: string | null = null;

    if (tenantSlug) {
      const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
      tenantId = tenant.id;
    }

    return this.prisma.deliveryFeeTier.findMany({
      where: tenantId
        ? {
            OR: [{ tenantId }, { tenantId: null }],
          }
        : undefined,
      orderBy: [
        { tenantId: 'asc' },
        { priority: 'desc' },
        { minDistanceMeters: 'asc' },
      ],
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async createTier(@Body() body: {
    tenantId?: string | null;
    minDistanceMeters: number;
    maxDistanceMeters: number;
    deliveryFeeCents: number;
    isActive?: boolean;
    priority?: number;
  }) {
    return this.prisma.deliveryFeeTier.create({
      data: {
        tenantId: body.tenantId || null,
        minDistanceMeters: body.minDistanceMeters,
        maxDistanceMeters: body.maxDistanceMeters,
        deliveryFeeCents: body.deliveryFeeCents,
        isActive: body.isActive ?? true,
        priority: body.priority ?? 0,
      },
    });
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async updateTier(
    @Param('id') id: string,
    @Body() body: {
      minDistanceMeters?: number;
      maxDistanceMeters?: number;
      deliveryFeeCents?: number;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    return this.prisma.deliveryFeeTier.update({
      where: { id },
      data: body,
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async deleteTier(@Param('id') id: string) {
    return this.prisma.deliveryFeeTier.delete({
      where: { id },
    });
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post(':tenantSlug/calculate-fee')
  async calculateDeliveryFee(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: { address: AddressForGeocoding },
  ) {
    try {
      this.logger.log('calculateDeliveryFee called', {
        tenantSlug,
        address: body.address,
      });
      
      const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
      this.logger.debug('Tenant found', { tenantId: tenant.id, slug: tenant.slug });
      
      const result = await this.deliveryFeeTierService.getDeliveryFeeByDistance(
        tenant.id,
        body.address,
      );

      if (!result) {
        this.logger.warn('No delivery tier found for distance', {
          tenantSlug,
          address: body.address,
        });
        return {
          available: false,
          reason: 'no_tier',
          message: 'Doprava nie je dostupná pre túto vzdialenosť',
        };
      }

      // Check if address is out of range
      if (result.isOutOfRange) {
        this.logger.warn('Address is outside delivery range', {
          tenantSlug,
          distanceMeters: result.distanceMeters,
        });
        return {
          available: false,
          reason: 'out_of_range',
          message: 'Adresa je mimo dosahu doručovania',
        };
      }

      // Same rule as order creation: definitely outside the Wolt zone → not available.
      if (result.customerCoordinates) {
        const zone = await this.deliveryAreaCacheService.checkTenantPoint(
          { id: tenant.id, deliveryConfig: (tenant as any).deliveryConfig },
          result.customerCoordinates,
        );
        if (zone.insideArea === false) {
          this.logger.warn('Address outside Wolt delivery zone', {
            tenantSlug,
            distanceMeters: result.distanceMeters,
            source: zone.source,
          });
          return {
            available: false,
            reason: 'outside_wolt_zone',
            message: OUTSIDE_WOLT_ZONE_MESSAGE,
          };
        }
      }

      this.logger.log('Delivery fee calculated by distance', {
        tenantSlug,
        distanceMeters: result.distanceMeters,
        deliveryFeeCents: result.deliveryFeeCents,
      });

      return {
        available: true,
        deliveryFeeCents: result.deliveryFeeCents,
        deliveryFeeEuros: (result.deliveryFeeCents / 100).toFixed(2),
        distanceMeters: result.distanceMeters,
        distanceKm: (result.distanceMeters / 1000).toFixed(2),
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
}
