import { Injectable } from '@nestjs/common';
import { Order, Tenant } from '@pizza-ecosystem/shared';

@Injectable()
export class GopayService {
  async createPayment(order: Order, tenant: Tenant) {
    // GoPay REST API integration
    // https://doc.gopay.com/
    
    const gopayConfig = tenant.paymentConfig;
    
    // TODO: Implement GoPay API call
    // For MVP, this can be left as placeholder
    // GoPay requires OAuth2 token, then create payment with POST /api/payments/payment
    
    return {
      paymentId: 'gopay_' + order.id,
      redirectUrl: `https://gate.gopay.cz/gw/v3/...`,
    };
  }

  verifyWebhook(signature: string, payload: string): boolean {
    // GoPay signature verification
    // GoPay uses HMAC-SHA256 similar to Adyen
    // TODO: Implement proper verification
    return true;
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








