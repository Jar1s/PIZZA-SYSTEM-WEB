import { Controller, Post, Body, Headers, Req, Res, HttpCode, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WepayService } from './wepay.service';
import { appConfig } from '../config/app.config';
import { Public } from '../auth/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  constructor(
    private paymentsService: PaymentsService,
    private adyenService: AdyenService,
    private gopayService: GopayService,
    private wepayService: WepayService,
  ) {}

  @Public()
  @Post('adyen')
  @HttpCode(200)
  async handleAdyenWebhook(
    @Body() body: any,
    @Headers('hmac-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // SECURITY FIX: Use raw body for signature verification
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available for Adyen webhook');
      return res.status(500).send('Server configuration error');
    }
    
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    
    if (!hmacKey) {
      this.logger.error('ADYEN_HMAC_KEY not configured');
      return res.status(500).send('Server configuration error');
    }

    // Use raw body as string for signature verification
    const rawBodyString = rawBody.toString('utf8');
    if (!this.adyenService.verifyWebhookSignature(rawBodyString, signature, hmacKey)) {
      this.logger.error('Invalid Adyen webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // Process notification
    const notification = body.notificationItems?.[0]?.NotificationRequestItem;
    if (notification) {
      try {
        await this.paymentsService.handleAdyenWebhook(notification);
      } catch (error) {
        // Distinguish between fatal and transient errors
        const isTransientError = this.isTransientError(error);
        if (isTransientError) {
          this.logger.error('Transient error processing Adyen webhook (will retry):', error);
          return res.status(500).send('Internal server error');
        } else {
          this.logger.error('Fatal error processing Adyen webhook (no retry):', error);
          // Return 200 to prevent retries for fatal errors
        }
      }
    }

    // Adyen requires [accepted] response
    return res.status(200).send('[accepted]');
  }

  @Public()
  @Post('gopay')
  @HttpCode(200)
  async handleGopayWebhook(
    @Body() body: any,
    @Headers('signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // SECURITY FIX: Use raw body for signature verification
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available for GoPay webhook');
      return res.status(500).send('Server configuration error');
    }
    
    // Get client secret from env (GoPay uses client secret for webhook verification)
    const clientSecret = process.env.GOPAY_CLIENT_SECRET;
    
    // Use raw body as string for signature verification
    const rawBodyString = rawBody.toString('utf8');
    if (!this.gopayService.verifyWebhook(signature, rawBodyString, clientSecret)) {
      this.logger.error('Invalid GoPay webhook signature');
      return res.status(401).send('Invalid signature');
    }

    try {
      await this.paymentsService.handleGopayWebhook(body);
    } catch (error) {
      // Distinguish between fatal and transient errors
      const isTransientError = this.isTransientError(error);
      if (isTransientError) {
        this.logger.error('Transient error processing GoPay webhook (will retry):', error);
        return res.status(500).send('Internal server error');
      } else {
        this.logger.error('Fatal error processing GoPay webhook (no retry):', error);
        // Continue to return 200 for fatal errors
      }
    }

    return res.status(200).send('OK');
  }

  @Public()
  @Post('wepay')
  @HttpCode(200)
  async handleWepayWebhook(
    @Body() body: any,
    @Headers('x-wepay-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // SECURITY FIX: Use raw body for signature verification
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available for WePay webhook');
      return res.status(500).send('Server configuration error');
    }
    
    const tenantId = body.tenant_id || req.headers['x-tenant-id'];
    
    // CRITICAL: Always verify signature unless explicitly skipped via env variable
    // This prevents security issues if NODE_ENV is misconfigured
    if (!appConfig.skipWebhookVerification && signature) {
      const hmacKey = process.env.WEPAY_HMAC_KEY || '';
      // Use raw body as string for signature verification
      const rawBodyString = rawBody.toString('utf8');
      if (!this.wepayService.verifyWebhook(signature, rawBodyString, hmacKey)) {
        this.logger.error('Invalid WePay webhook signature');
        return res.status(401).send('Invalid signature');
      }
    } else if (appConfig.skipWebhookVerification) {
      this.logger.warn('⚠️  SECURITY WARNING: WePay webhook verification is DISABLED via SKIP_WEBHOOK_VERIFICATION');
    }

    try {
      await this.paymentsService.handleWepayWebhook(body, signature);
    } catch (error) {
      // Distinguish between fatal and transient errors
      const isTransientError = this.isTransientError(error);
      if (isTransientError) {
        this.logger.error('Transient error processing WePay webhook (will retry):', error);
        return res.status(500).send({ status: 'error', message: 'Internal server error' });
      } else {
        this.logger.error('Fatal error processing WePay webhook (no retry):', error);
        // Continue to return 200 for fatal errors
      }
    }

    return res.status(200).send({ status: 'accepted' });
  }

  /**
   * Determine if an error is transient (should retry) or fatal (should not retry)
   * Transient errors: database connection issues, network timeouts, temporary service unavailability
   * Fatal errors: invalid data, business logic errors, validation failures
   */
  private isTransientError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    
    // Database connection errors
    if (errorCode === 'econnrefused' || errorCode === 'etimedout' || errorCode === 'enotfound') {
      return true;
    }
    
    // Prisma connection errors
    if (errorMessage.includes('connection') || errorMessage.includes('timeout') || 
        errorMessage.includes('network') || errorMessage.includes('econnrefused')) {
      return true;
    }
    
    // Prisma specific error codes
    if (errorCode === 'p1001' || errorCode === 'p1002' || errorCode === 'p1008') {
      return true; // Connection errors
    }
    
    // HTTP timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('econnreset')) {
      return true;
    }
    
    // All other errors are considered fatal (invalid data, validation, etc.)
    return false;
  }
}









