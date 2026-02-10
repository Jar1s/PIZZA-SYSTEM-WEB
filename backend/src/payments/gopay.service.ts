import { Injectable, Logger } from '@nestjs/common';
import { Order, Tenant } from '@pizza-ecosystem/shared';
import * as crypto from 'crypto';

@Injectable()
export class GopayService {
  private readonly logger = new Logger(GopayService.name);
  private getTenantFrontendBaseUrl(tenant: Tenant): string {
    const rawDomain = (tenant.domain || '').trim();
    if (rawDomain) {
      const withProtocol = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
      return withProtocol.replace(/\/+$/, '');
    }

    if (process.env.NODE_ENV === 'development') {
      return `http://${tenant.subdomain}.localhost:3001`;
    }

    return `https://${tenant.subdomain}.example.com`;
  }

  async createPayment(order: Order, tenant: Tenant) {
    // GoPay REST API integration
    // https://doc.gopay.com/
    
    const gopayConfig = tenant.paymentConfig as any;
    
    if (process.env.NODE_ENV === 'development' || !gopayConfig?.clientId) {
      // Development/Mock mode
      this.logger.warn('⚠️  GoPay in DEV mode - using mock redirect URL');
      const tenantFrontendBaseUrl = this.getTenantFrontendBaseUrl(tenant);
      
      return {
        paymentId: 'gopay_' + order.id,
        redirectUrl: `${tenantFrontendBaseUrl}/checkout/mock-payment?orderId=${order.id}&provider=gopay`,
      };
    }
    
    // Production: Real GoPay API call
    try {
      const apiUrl = gopayConfig.environment === 'production'
        ? 'https://gate.gopay.cz'
        : 'https://gw.sandbox.gopay.com';
      
      // Step 1: Get access token (OAuth2)
      // GoPay requires Basic Authentication with ClientId:ClientSecret
      const clientId = gopayConfig.clientId;
      const clientSecret = gopayConfig.clientSecret;
      
      if (!clientId || !clientSecret) {
        throw new Error('GoPay clientId and clientSecret are required');
      }
      
      // Create Basic Auth header (Base64 encoded ClientId:ClientSecret)
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const tokenResponse = await fetch(`${apiUrl}/api/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'payment-create',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        this.logger.error(`GoPay OAuth2 token request failed: ${tokenResponse.status} ${errorText}`);
        throw new Error(`Failed to get GoPay access token: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        this.logger.error('GoPay OAuth2 response missing access_token', tokenData);
        throw new Error('GoPay OAuth2 response missing access token');
      }
      
      const accessToken = tokenData.access_token;
      this.logger.debug(`GoPay access token obtained, expires in: ${tokenData.expires_in || 'unknown'} seconds`);

      // Step 2: Create payment
      // Get currency from tenant (defaults to EUR if not specified)
      const tenantCurrency = (tenant as any).currency || 'EUR';
      // GoPay supports CZK, EUR, USD - validate currency
      const supportedCurrencies = ['CZK', 'EUR', 'USD'];
      const currency = supportedCurrencies.includes(tenantCurrency) ? tenantCurrency : 'EUR';
      
      if (tenantCurrency !== currency) {
        this.logger.warn(`GoPay: Unsupported currency ${tenantCurrency}, using EUR instead`);
      }
      
      const tenantFrontendBaseUrl = this.getTenantFrontendBaseUrl(tenant);
      const backendBaseUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

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
          currency: currency,
          order_number: order.id,
          items: order.items.map(item => ({
            name: item.productName,
            amount: item.priceCents * item.quantity,
            count: item.quantity,
          })),
          callback: {
            return_url: `${tenantFrontendBaseUrl}/checkout/return?provider=gopay&orderId=${order.id}`,
            notification_url: `${backendBaseUrl}/api/webhooks/gopay`,
          },
        }),
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { description: errorText };
        }
        this.logger.error(`GoPay payment creation failed: ${paymentResponse.status}`, {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          error: errorData,
        });
        throw new Error(`GoPay API error: ${errorData.description || errorData.message || paymentResponse.statusText}`);
      }

      const paymentData = await paymentResponse.json();
      
      // Validate response
      if (!paymentData.id) {
        this.logger.error('GoPay payment response missing id', paymentData);
        throw new Error('GoPay payment response missing payment id');
      }
      
      if (!paymentData.gw_url) {
        this.logger.error('GoPay payment response missing gw_url', paymentData);
        throw new Error('GoPay payment response missing redirect URL (gw_url)');
      }
      
      this.logger.log(`✅ GoPay payment created: ${paymentData.id}`, {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        state: paymentData.state,
      });
      
      return {
        paymentId: paymentData.id.toString(),
        redirectUrl: paymentData.gw_url,
      };
    } catch (error: any) {
      this.logger.error('GoPay payment creation failed:', {
        error: error.message,
        stack: error.stack,
        orderId: order.id,
        tenantId: tenant.id,
      });
      // Re-throw error instead of returning fallback to let caller handle it
      throw error;
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
    const state = data.state?.toUpperCase();
    
    // Map GoPay states to success/failure
    // PAID = success, CANCELED/TIMEOUTED = failure
    const success = state === 'PAID';
    
    this.logger.debug(`GoPay webhook parsed:`, {
      state: state,
      paymentId: data.id,
      orderNumber: data.order_number,
      amount: data.amount,
      success: success,
    });
    
    return {
      eventType: state,
      success: success,
      paymentRef: data.id?.toString(),
      merchantReference: data.order_number,
      amount: data.amount,
    };
  }

  async refundPayment(paymentId: string, amountCents: number, tenant: Tenant): Promise<void> {
    // GoPay refund API integration
    // https://doc.gopay.com/
    
    const gopayConfig = tenant.paymentConfig as any;
    
    if (process.env.NODE_ENV === 'development' || !gopayConfig?.clientId) {
      // Development/Mock mode
      this.logger.warn(`⚠️  GoPay refund in DEV mode - skipping refund for payment ${paymentId}`);
      return;
    }
    
    try {
      const apiUrl = gopayConfig.environment === 'production'
        ? 'https://gate.gopay.cz'
        : 'https://gw.sandbox.gopay.com';
      
      // Step 1: Get access token with scope 'payment-all' (required for refund)
      const clientId = gopayConfig.clientId;
      const clientSecret = gopayConfig.clientSecret;
      
      if (!clientId || !clientSecret) {
        throw new Error('GoPay clientId and clientSecret are required for refund');
      }
      
      // Create Basic Auth header
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const tokenResponse = await fetch(`${apiUrl}/api/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'payment-all', // Required scope for refund operations
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        this.logger.error(`GoPay OAuth2 token request failed for refund: ${tokenResponse.status} ${errorText}`);
        throw new Error(`Failed to get GoPay access token for refund: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        this.logger.error('GoPay OAuth2 response missing access_token for refund', tokenData);
        throw new Error('GoPay OAuth2 response missing access token for refund');
      }
      
      const accessToken = tokenData.access_token;

      // Step 2: Create refund
      const refundResponse = await fetch(`${apiUrl}/api/payments/payment/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          amount: amountCents.toString(),
        }),
      });

      if (!refundResponse.ok) {
        const errorText = await refundResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { description: errorText };
        }
        this.logger.error(`GoPay refund failed: ${refundResponse.status}`, {
          status: refundResponse.status,
          statusText: refundResponse.statusText,
          error: errorData,
          paymentId,
          amountCents,
        });
        throw new Error(`GoPay refund error: ${errorData.description || errorData.message || refundResponse.statusText}`);
      }

      const refundData = await refundResponse.json();
      
      this.logger.log(`✅ GoPay refund initiated: ${paymentId}`, {
        paymentId,
        amountCents,
        result: refundData.result,
        refundId: refundData.id,
      });
    } catch (error: any) {
      this.logger.error('GoPay refund failed:', {
        error: error.message,
        stack: error.stack,
        paymentId,
        amountCents,
        tenantId: tenant.id,
      });
      throw error;
    }
  }
}












