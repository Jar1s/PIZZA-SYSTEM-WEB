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
    
    // TODO: Implement WePay API call when credentials are available
    // For MVP, return mock redirect URL
    
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
    // const wepayApi = new WePayClient({
    //   clientId: wepayConfig.clientId,
    //   clientSecret: wepayConfig.clientSecret,
    //   environment: wepayConfig.environment || 'sandbox',
    // });
    //
    // const payment = await wepayApi.payments.create({
    //   account_id: wepayConfig.accountId,
    //   amount: order.totalCents / 100, // WePay uses dollars
    //   currency: 'EUR',
    //   reference_id: order.id,
    //   callback_uri: `${tenant.domain}/checkout/return?provider=wepay`,
    // });
    //
    // return {
    //   paymentId: payment.id,
    //   redirectUrl: payment.hosted_checkout.uri,
    // };
    
    // Placeholder return for production without credentials
    this.logger.warn('⚠️  WePay credentials not configured - using placeholder');
    
    return {
      paymentId: 'wepay_' + order.id,
      redirectUrl: `https://checkout.wepay.com/mock/${order.id}`,
    };
  }

  verifyWebhook(signature: string, payload: string, secret: string): boolean {
    // WePay webhook signature verification
    // WePay uses HMAC-SHA256 similar to Adyen
    // TODO: Implement proper verification when credentials available
    
    if (process.env.NODE_ENV === 'development') {
      this.logger.warn('⚠️  WePay webhook verification skipped in DEV mode');
      return true; // Skip verification in dev
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

