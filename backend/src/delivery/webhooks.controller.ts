import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { DeliveryService } from './delivery.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('wolt')
  async handleWoltWebhook(
    @Body() body: any,
    @Headers('x-wolt-signature') signature: string,
    @Res() res: Response,
  ) {
    // TODO: Verify Wolt webhook signature
    // For now, accept all webhooks in development
    
    try {
      await this.deliveryService.handleWoltWebhook(body);
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Wolt webhook error:', error);
      return res.status(500).send('Error processing webhook');
    }
  }
}


