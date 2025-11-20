import { Controller, Post, Body, Headers, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { DeliveryService } from './delivery.service';
import { Public } from '../auth/decorators/public.decorator';
import { appConfig } from '../config/app.config';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  constructor(private deliveryService: DeliveryService) {}

  @Public()
  @Post('wolt')
  async handleWoltWebhook(
    @Body() body: any,
    @Headers('x-wolt-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // SECURITY FIX: Use raw body for signature verification
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      this.logger.error('Raw body not available for Wolt webhook');
      return res.status(500).send('Server configuration error');
    }
    
    // SECURITY: Always verify signature unless explicitly skipped via env variable
    // This prevents security issues if NODE_ENV is misconfigured
    if (!appConfig.skipWebhookVerification && signature) {
      const secret = process.env.WOLT_WEBHOOK_SECRET;
      if (!secret) {
        this.logger.error('Wolt webhook secret not configured');
        return res.status(500).send('Webhook secret not configured');
      }
      
      // Use raw body as string for signature verification
      const rawBodyString = rawBody.toString('utf8');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBodyString)
        .digest('hex');
      
      // Constant-time comparison to prevent timing attacks
      if (!crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )) {
        this.logger.error('Invalid Wolt webhook signature');
        return res.status(401).send('Invalid webhook signature');
      }
    } else if (appConfig.skipWebhookVerification) {
      this.logger.warn('⚠️  SECURITY WARNING: Wolt webhook verification is DISABLED via SKIP_WEBHOOK_VERIFICATION');
    } else if (!signature) {
      this.logger.warn('⚠️  Wolt webhook missing signature header');
      // In production, reject webhooks without signature
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).send('Webhook signature required');
      }
    }
    
    try {
      await this.deliveryService.handleWoltWebhook(body);
      return res.status(200).send('OK');
    } catch (error) {
      // Distinguish between fatal and transient errors
      const isTransientError = this.isTransientError(error);
      if (isTransientError) {
        this.logger.error('Transient error processing Wolt webhook (will retry):', error);
        return res.status(500).send('Internal server error');
      } else {
        this.logger.error('Fatal error processing Wolt webhook (no retry):', error);
        // Return 200 for fatal errors to prevent retries
        return res.status(200).send('OK');
      }
    }
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


