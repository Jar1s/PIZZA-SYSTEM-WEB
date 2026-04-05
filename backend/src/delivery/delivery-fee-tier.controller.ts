import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Logger, Query } from '@nestjs/common';
import { DeliveryFeeTierService, AddressForGeocoding } from './delivery-fee-tier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
    private tenantsService: TenantsService,
    private prisma: PrismaService,
  ) {}

  @Get()
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
          message: 'Adresa je mimo dosahu doručovania',
        };
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
