import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('api/delivery')
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
}













