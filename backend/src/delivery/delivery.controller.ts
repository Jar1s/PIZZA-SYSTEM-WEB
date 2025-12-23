import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);

  constructor(private deliveryService: DeliveryService) {}

  @Post('quote')
  async getQuote(@Body() data: { tenantId: string; dropoffAddress: any }) {
    return this.deliveryService.getQuote(data.tenantId, data.dropoffAddress);
  }

  @Post('check-availability')
  async checkAvailability(@Body() data: { orderId: string }) {
    this.logger.log(`[checkAvailability] Request for order: ${data.orderId}`);
    try {
      const result = await this.deliveryService.getShipmentPromiseForOrder(data.orderId);
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
  async createDelivery(@Body() data: { orderId: string; promiseId?: string }) {
    return this.deliveryService.createDeliveryForOrder(data.orderId, data.promiseId);
  }

  @Get(':id')
  async getDelivery(@Param('id') id: string) {
    return this.deliveryService.getDeliveryById(id);
  }
}













