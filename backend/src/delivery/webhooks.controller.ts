import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { DeliveryService } from './delivery.service';
import { Public } from '../auth/decorators/public.decorator';
import { appConfig } from '../config/app.config';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  constructor(private deliveryService: DeliveryService) {}

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
  }

  private decodePayloadWithoutVerification(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
    return JSON.parse(this.decodeBase64Url(parts[1]));
  }

  private verifyAndDecodeToken(token: string, secret: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    const header = JSON.parse(this.decodeBase64Url(headerPart));
    if (header?.alg !== 'HS256') {
      throw new Error(`Unsupported JWT alg: ${header?.alg || 'unknown'}`);
    }
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest('base64url');

    const providedBuffer = Buffer.from(signaturePart, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new Error('Invalid webhook token signature');
    }

    const payload = JSON.parse(this.decodeBase64Url(payloadPart));
    if (typeof payload?.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error('Webhook token expired');
      }
    }

    return payload;
  }

  @Public()
  @Post('wolt')
  async handleWoltWebhook(
    @Body() body: any,
    @Res() res: Response,
  ) {
    const token = body?.token;
    if (!token || typeof token !== 'string') {
      this.logger.warn('Wolt webhook payload missing token');
      return res.status(400).send('Webhook token required');
    }

    let webhookPayload: any;

    if (!appConfig.skipWebhookVerification) {
      let unsignedPayload: any = null;
      try {
        unsignedPayload = this.decodePayloadWithoutVerification(token);
      } catch (error: any) {
        this.logger.error('Failed to decode Wolt webhook token before verification', {
          error: error?.message || String(error),
        });
        return res.status(400).send('Invalid webhook token payload');
      }

      const secret = await this.deliveryService.resolveWoltWebhookSecretForUnsignedPayload(unsignedPayload);
      if (!secret) {
        this.logger.error('Wolt webhook secret not configured');
        return res.status(500).send('Webhook secret not configured');
      }

      try {
        webhookPayload = this.verifyAndDecodeToken(token, secret);
      } catch (error: any) {
        this.logger.error('Invalid Wolt webhook token signature', {
          error: error?.message || String(error),
        });
        return res.status(401).send('Invalid webhook token');
      }
    } else {
      this.logger.warn('⚠️  SECURITY WARNING: Wolt webhook verification is DISABLED via SKIP_WEBHOOK_VERIFICATION');
      try {
        webhookPayload = this.decodePayloadWithoutVerification(token);
      } catch (error: any) {
        this.logger.error('Failed to decode Wolt webhook token', {
          error: error?.message || String(error),
        });
        return res.status(400).send('Invalid webhook token payload');
      }
    }
    
    try {
      await this.deliveryService.handleWoltWebhook(webhookPayload);
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
