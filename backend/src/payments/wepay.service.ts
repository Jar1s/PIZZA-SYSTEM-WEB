import { Injectable, Logger } from '@nestjs/common';
import { Order, Tenant } from '@pizza-ecosystem/shared';
import * as crypto from 'crypto';

@Injectable()
export class WepayService {
  private readonly logger = new Logger(WepayService.name);

  async createPayment(order: Order, tenant: Tenant) {
    // WePay API integration
    // https://developer.wepay.com/
    
    const wepayConfig = tenant.paymentConfig as any;
    
    if (process.env.NODE_ENV === 'development' || !wepayConfig?.clientId) {
      // Development/Mock mode
      this.logger.warn('⚠️  WePay in DEV mode - using mock redirect URL');
      
      const tenantDomain = tenant.domain || `${tenant.subdomain}.localhost:3001`;
      
      return {
        paymentId: 'wepay_' + order.id,
        redirectUrl: `http://${tenantDomain}/checkout/mock-payment?orderId=${order.id}&provider=wepay`,
      };
    }
    
    // Production: Real WePay API call
    try {
      const apiUrl = wepayConfig.environment === 'production' 
        ? 'https://api.wepay.com' 
        : 'https://stage.wepay.com';
      
      // Step 1: Get access token (OAuth2)
      const tokenResponse = await fetch(`${apiUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: wepayConfig.clientId,
          client_secret: wepayConfig.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get WePay access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Create payment
      const paymentResponse = await fetch(`${apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: wepayConfig.accountId,
          amount: order.totalCents / 100, // WePay uses dollars
          currency: 'EUR',
          reference_id: order.id,
          callback_uri: `${tenant.domain || `http://${tenant.subdomain}.localhost:3001`}/checkout/return?provider=wepay`,
          hosted_checkout: {
            mode: 'iframe',
            redirect_uri: `${tenant.domain || `http://${tenant.subdomain}.localhost:3001`}/checkout/return?provider=wepay`,
          },
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(`WePay API error: ${errorData.error_description || paymentResponse.statusText}`);
      }

      const paymentData = await paymentResponse.json();
      
      this.logger.log(`✅ WePay payment created: ${paymentData.id}`);
      
      return {
        paymentId: paymentData.id,
        redirectUrl: paymentData.hosted_checkout?.uri || paymentData.checkout_uri,
      };
    } catch (error: any) {
      this.logger.error('WePay payment creation failed:', error);
      // Fallback to placeholder
      return {
        paymentId: 'wepay_' + order.id,
        redirectUrl: `https://checkout.wepay.com/mock/${order.id}`,
      };
    }
  }

  verifyWebhook(signature: string, payload: string, secret: string): boolean {
    // WePay webhook signature verification
    // WePay uses HMAC-SHA256 similar to Adyen
    
    // CRITICAL: Use explicit env variable, not NODE_ENV
    const skipVerification = process.env.SKIP_WEBHOOK_VERIFICATION === 'true';
    if (skipVerification) {
      this.logger.warn('⚠️  SECURITY WARNING: WePay webhook verification is DISABLED via SKIP_WEBHOOK_VERIFICATION');
      return true;
    }
    
    if (!secret) {
      this.logger.warn('⚠️  WePay HMAC key not configured - skipping verification');
      return true; // Skip if not configured
    }
    
    // Production verification
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
      this.logger.error('WePay signature verification error:', error);
      return false;
    }
  }

  parseWebhook(data: any) {
    // Parse WePay webhook notification
    // WePay webhook format may vary, this is a standard structure
    return {
      eventType: data.event_type || data.state || data.event,
      success: data.state === 'captured' || 
               data.state === 'authorized' || 
               data.status === 'success' ||
               data.event_type === 'payment.captured',
      paymentRef: data.payment_id || data.id || data.paymentId,
      merchantReference: data.reference_id || data.order_number || data.orderId,
      amount: data.amount ? Math.round(data.amount * 100) : null, // Convert to cents
    };
  }
}





