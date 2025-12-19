import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('quote')
  async getQuote(@Body() data: { tenantId: string; dropoffAddress: any }) {
    return this.deliveryService.getQuote(data.tenantId, data.dropoffAddress);
  }

  @Post('check-availability')
  async checkAvailability(@Body() data: { orderId: string }) {
    return this.deliveryService.getShipmentPromiseForOrder(data.orderId);
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













