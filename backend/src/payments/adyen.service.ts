import { Injectable } from '@nestjs/common';
import { Client, CheckoutAPI, EnvironmentEnum } from '@adyen/api-library';
import { Order, Tenant } from '@pizza-ecosystem/shared';
import * as crypto from 'crypto';

@Injectable()
export class AdyenService {
  private getClient(apiKey: string) {
    const environment = process.env.ADYEN_ENVIRONMENT === 'LIVE' 
      ? EnvironmentEnum.LIVE 
      : EnvironmentEnum.TEST;
    
    return new Client({
      apiKey,
      environment,
    });
  }

  async createPaymentSession(order: Order, tenant: Tenant) {
    const client = this.getClient(tenant.paymentConfig.apiKey);
    const checkout = new CheckoutAPI(client);

    const session = await checkout.PaymentsApi.sessions({
      merchantAccount: tenant.paymentConfig.merchantAccount,
      amount: {
        currency: 'EUR',
        value: order.totalCents,
      },
      reference: order.id,
      returnUrl: `https://${tenant.domain || tenant.subdomain + '.example.com'}/checkout/success?orderId=${order.id}`,
      countryCode: 'SK',
      shopperLocale: 'sk_SK',
      lineItems: order.items.map(item => ({
        description: item.productName,
        quantity: item.quantity,
        amountIncludingTax: item.priceCents * item.quantity,
      })),
      metadata: {
        orderId: order.id,
        tenantId: tenant.id,
      },
    });

    return {
      sessionId: session.id,
      sessionData: session.sessionData,
      redirectUrl: session.url,
    };
  }

  verifyWebhookSignature(payload: string, signature: string, hmacKey: string): boolean {
    const hmac = crypto.createHmac('sha256', hmacKey);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('base64');
    return calculatedSignature === signature;
  }

  parseWebhook(notification: any) {
    return {
      eventType: notification.eventCode,
      success: notification.success === 'true',
      paymentRef: notification.pspReference,
      merchantReference: notification.merchantReference, // This is orderId
      amount: notification.amount?.value,
    };
  }
}

