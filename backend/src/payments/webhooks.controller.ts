import { Controller, Post, Body, Headers, Req, Res, HttpCode, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WepayService } from './wepay.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(
    private paymentsService: PaymentsService,
    private adyenService: AdyenService,
    private gopayService: GopayService,
    private wepayService: WepayService,
  ) {}

  @Post('adyen')
  @HttpCode(200)
  async handleAdyenWebhook(
    @Body() body: any,
    @Headers('hmac-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Verify signature
    const rawBody = JSON.stringify(body);
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    
    if (!hmacKey) {
      console.error('ADYEN_HMAC_KEY not configured');
      return res.status(500).send('Server configuration error');
    }

    if (!this.adyenService.verifyWebhookSignature(rawBody, signature, hmacKey)) {
      console.error('Invalid Adyen webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // Process notification
    const notification = body.notificationItems?.[0]?.NotificationRequestItem;
    if (notification) {
      try {
        await this.paymentsService.handleAdyenWebhook(notification);
      } catch (error) {
        console.error('Error processing Adyen webhook:', error);
        // Still return [accepted] to avoid retries for processing errors
      }
    }

    // Adyen requires [accepted] response
    return res.status(200).send('[accepted]');
  }

  @Post('gopay')
  @HttpCode(200)
  async handleGopayWebhook(
    @Body() body: any,
    @Headers('signature') signature: string,
    @Res() res: Response,
  ) {
    // Verify signature
    const rawBody = JSON.stringify(body);
    
    if (!this.gopayService.verifyWebhook(signature, rawBody)) {
      console.error('Invalid GoPay webhook signature');
      return res.status(401).send('Invalid signature');
    }

    try {
      await this.paymentsService.handleGopayWebhook(body);
    } catch (error) {
      console.error('Error processing GoPay webhook:', error);
    }

    return res.status(200).send('OK');
  }

  @Post('wepay')
  @HttpCode(200)
  async handleWepayWebhook(
    @Body() body: any,
    @Headers('x-wepay-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawBody = JSON.stringify(body);
    const tenantId = body.tenant_id || req.headers['x-tenant-id'];
    
    // Verify signature if in production
    if (process.env.NODE_ENV === 'production' && signature) {
      const hmacKey = process.env.WEPAY_HMAC_KEY || '';
      if (!this.wepayService.verifyWebhook(signature, rawBody, hmacKey)) {
        console.error('Invalid WePay webhook signature');
        return res.status(401).send('Invalid signature');
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Skip verification in dev mode
      console.log('⚠️  WePay webhook verification skipped in DEV mode');
    }

    try {
      await this.paymentsService.handleWepayWebhook(body, signature);
    } catch (error) {
      console.error('Error processing WePay webhook:', error);
      // Still return success to avoid retries for processing errors
    }

    return res.status(200).send({ status: 'accepted' });
  }
}









