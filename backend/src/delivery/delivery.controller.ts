import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('quote')
  async getQuote(@Body() data: { tenantId: string; dropoffAddress: any }) {
    return this.deliveryService.getQuote(data.tenantId, data.dropoffAddress);
  }

  @Post('create')
  async createDelivery(@Body() data: { orderId: string }) {
    return this.deliveryService.createDeliveryForOrder(data.orderId);
  }

  @Get(':id')
  async getDelivery(@Param('id') id: string) {
    return this.deliveryService.getDeliveryById(id);
  }
}













