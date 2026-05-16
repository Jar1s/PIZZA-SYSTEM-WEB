import { Controller, Post, Body, Get, Param, Logger, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

interface RequestUser {
  id: string;
  role: string;
  tenantId?: string | null;
  email?: string | null;
}

interface ShipmentPromiseData {
  promiseId?: string;
  feeCents?: number;
  etaMinutes?: number;
  pickupEtaMinutes?: number;
  dropoffEtaMinutes?: number;
  validUntil?: string;
  currency?: string;
  distance?: number;
}

interface CheckAreaBody {
  tenantSlug: string;
  dropoffAddress: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
}

@Controller('delivery')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'OPERATOR')
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(private deliveryService: DeliveryService) {}

  @Post('quote')
  async getQuote(
    @Body() data: { tenantId: string; dropoffAddress: any },
    @Req() req: { user?: RequestUser },
  ) {
    return this.deliveryService.getQuote(data.tenantId, data.dropoffAddress, req.user);
  }

  @Post('check-availability')
  async checkAvailability(
    @Body() data: { orderId: string; minPreparationTimeMinutes?: number },
    @Req() req: { user?: RequestUser },
  ) {
    const { minPreparationTimeMinutes } = data;

    if (minPreparationTimeMinutes !== undefined) {
      if (!Number.isInteger(minPreparationTimeMinutes) || minPreparationTimeMinutes < 0 || minPreparationTimeMinutes > 180) {
        throw new BadRequestException('minPreparationTimeMinutes must be integer between 0 and 180');
      }
    }

    this.logger.log(`[checkAvailability] Request for order: ${data.orderId}`);
    try {
      const result = await this.deliveryService.getShipmentPromiseForOrder(data.orderId, req.user, minPreparationTimeMinutes);
      this.logger.log(`[checkAvailability] Success for order: ${data.orderId}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[checkAvailability] Failed for order: ${data.orderId}`, {
        error: error.message,
        status: error.status,
      });
      throw error;
    }
  }

  @Post('create')
  async createDelivery(
    @Body() data: { orderId: string; promiseId?: string; minPreparationTimeMinutes?: number },
    @Req() req: { user?: RequestUser },
  ) {
    const { minPreparationTimeMinutes } = data;

    if (minPreparationTimeMinutes !== undefined) {
      if (!Number.isInteger(minPreparationTimeMinutes) || minPreparationTimeMinutes < 0 || minPreparationTimeMinutes > 180) {
        throw new BadRequestException('minPreparationTimeMinutes must be integer between 0 and 180');
      }
    }

    return this.deliveryService.createDeliveryForOrder(
      data.orderId,
      data.promiseId,
      minPreparationTimeMinutes,
      req.user,
    );
  }

  @Post('cancel')
  async cancelDelivery(
    @Body() data: { orderId: string },
    @Req() req: { user?: RequestUser },
  ) {
    if (!data?.orderId || typeof data.orderId !== 'string') {
      throw new BadRequestException('orderId is required');
    }

    return this.deliveryService.cancelDeliveryForOrder(data.orderId, req.user);
  }

  @Post('check-area')
  async checkArea(
    @Body() data: CheckAreaBody,
    @Req() req: { user?: RequestUser },
  ) {
    if (!data?.tenantSlug || typeof data.tenantSlug !== 'string') {
      throw new BadRequestException('tenantSlug is required');
    }
    if (!data?.dropoffAddress || typeof data.dropoffAddress !== 'object') {
      throw new BadRequestException('dropoffAddress is required');
    }

    return this.deliveryService.checkAreaByTenantSlug(
      data.tenantSlug,
      data.dropoffAddress,
      req.user,
    );
  }

  @Post('areas/refresh')
  async refreshAreas(
    @Body() data: { tenantSlug: string },
    @Req() req: { user?: RequestUser },
  ) {
    if (!data?.tenantSlug || typeof data.tenantSlug !== 'string') {
      throw new BadRequestException('tenantSlug is required');
    }

    return this.deliveryService.refreshAreasForTenantSlug(data.tenantSlug, req.user);
  }

  @Get(':id')
  async getDelivery(@Param('id') id: string, @Req() req: { user?: RequestUser }) {
    return this.deliveryService.getDeliveryById(id, req.user);
  }
}









