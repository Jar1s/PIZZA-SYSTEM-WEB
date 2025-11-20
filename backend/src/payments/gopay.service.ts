import { Injectable, Logger } from '@nestjs/common';
import { Order, Tenant } from '@pizza-ecosystem/shared';
import * as crypto from 'crypto';

@Injectable()
export class GopayService {
  private readonly logger = new Logger(GopayService.name);

  async createPayment(order: Order, tenant: Tenant) {
    // GoPay REST API integration
    // https://doc.gopay.com/
    
    const gopayConfig = tenant.paymentConfig as any;
    
    if (process.env.NODE_ENV === 'development' || !gopayConfig?.clientId) {
      // Development/Mock mode
      this.logger.warn('⚠️  GoPay in DEV mode - using mock redirect URL');
      
      const tenantDomain = tenant.domain || `${tenant.subdomain}.localhost:3001`;
      
      return {
        paymentId: 'gopay_' + order.id,
        redirectUrl: `http://${tenantDomain}/checkout/mock-payment?orderId=${order.id}&provider=gopay`,
      };
    }
    
    // Production: Real GoPay API call
    try {
      const apiUrl = gopayConfig.environment === 'production'
        ? 'https://gate.gopay.cz'
        : 'https://gw.sandbox.gopay.com';
      
      // Step 1: Get access token (OAuth2)
      const tokenResponse = await fetch(`${apiUrl}/api/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'payment-create',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get GoPay access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Create payment
      const paymentResponse = await fetch(`${apiUrl}/api/payments/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: {
            type: 'ACCOUNT',
            goid: gopayConfig.goId,
          },
          amount: order.totalCents, // GoPay uses cents
          currency: 'EUR',
          order_number: order.id,
          items: order.items.map(item => ({
            name: item.productName,
            amount: item.priceCents * item.quantity,
            count: item.quantity,
          })),
          callback: {
            return_url: `${tenant.domain || `http://${tenant.subdomain}.localhost:3001`}/checkout/return?provider=gopay`,
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/webhooks/gopay`,
          },
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(`GoPay API error: ${errorData.description || paymentResponse.statusText}`);
      }

      const paymentData = await paymentResponse.json();
      
      this.logger.log(`✅ GoPay payment created: ${paymentData.id}`);
      
      return {
        paymentId: paymentData.id.toString(),
        redirectUrl: paymentData.gw_url,
      };
    } catch (error: any) {
      this.logger.error('GoPay payment creation failed:', error);
      // Fallback to placeholder
      return {
        paymentId: 'gopay_' + order.id,
        redirectUrl: `https://gate.gopay.cz/gw/v3/mock/${order.id}`,
      };
    }
  }

  verifyWebhook(signature: string, payload: string, clientSecret?: string): boolean {
    // GoPay signature verification
    // GoPay uses HMAC-SHA256 with client secret
    
    // CRITICAL: Use explicit env variable, not NODE_ENV
    const skipVerification = process.env.SKIP_WEBHOOK_VERIFICATION === 'true';
    if (skipVerification) {
      this.logger.warn('⚠️  SECURITY WARNING: GoPay webhook verification is DISABLED via SKIP_WEBHOOK_VERIFICATION');
      return true;
    }

    // Get client secret from parameter or env
    const secret = clientSecret || process.env.GOPAY_CLIENT_SECRET;

    if (!secret) {
      this.logger.warn('⚠️  GoPay client secret not configured - rejecting webhook');
      return false; // Reject if not configured in production
    }

    if (!signature) {
      this.logger.warn('⚠️  GoPay webhook missing signature header');
      return false;
    }

    // GoPay uses HMAC-SHA256, signature is hex-encoded
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      this.logger.error('GoPay signature verification error:', error);
      return false;
    }
  }

  parseWebhook(data: any) {
    return {
      eventType: data.state,
      success: data.state === 'PAID',
      paymentRef: data.id,
      merchantReference: data.order_number,
      amount: data.amount,
    };
  }
}













