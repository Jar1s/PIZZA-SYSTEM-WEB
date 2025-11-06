import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
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
    // Verify signature in production
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.WOLT_WEBHOOK_SECRET;
      if (!secret) {
        console.error('Wolt webhook secret not configured');
        return res.status(500).send('Webhook secret not configured');
      }
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
      
      // Constant-time comparison to prevent timing attacks
      if (!signature || !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )) {
        console.error('Invalid Wolt webhook signature');
        return res.status(401).send('Invalid webhook signature');
      }
    }
    
    try {
      await this.deliveryService.handleWoltWebhook(body);
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Wolt webhook error:', error);
      return res.status(500).send('Error processing webhook');
    }
  }
}


