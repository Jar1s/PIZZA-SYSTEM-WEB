export interface PaymentSession {
  id: string;
  sessionData: string;       // Provider-specific
  redirectUrl: string;
  expiresAt: Date;
}

export interface PaymentWebhook {
  provider: PaymentProvider;
  eventType: string;
  orderId: string;
  paymentRef: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  raw: Record<string, any>;
}

export type PaymentProvider = 'adyen' | 'gopay' | 'gpwebpay';


