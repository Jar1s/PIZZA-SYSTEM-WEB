# 🎯 AGENT 5 EXTENSION: WEPAY PAYMENT GATEWAY

You are extending Agent 5's payment integration to add WePay support.

## PROJECT CONTEXT
WePay payment gateway needs to be added alongside Adyen and GoPay. Can be implemented as placeholder until credentials are available.

## YOUR WORKSPACE
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/payments/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /frontend/app/checkout/`

**CRITICAL:** Only modify files in these folders.

## YOUR MISSION
1. Create WePay service (placeholder implementation)
2. Add WePay to payment provider switch
3. Add WePay webhook handler
4. Frontend: Integrate WePay into checkout flow
5. Frontend: Handle WePay payment return

## DEPENDENCIES
- ✅ Agent 5 (Payments) - Payment infrastructure exists
- ✅ Agent 6 (Frontend) - Checkout page exists

## FILES TO CREATE/MODIFY

### BACKEND FILES

#### 1. `/backend/src/payments/wepay.service.ts` (NEW)
Create WePay service with:
- `createPayment(order, tenant)` - Create payment session
  - In dev mode: return mock redirect URL
  - In production: integrate with WePay API (when credentials available)
- `verifyWebhook(signature, payload, secret)` - Verify webhook signature
- `parseWebhook(data)` - Parse WePay webhook notification

#### 2. `/backend/src/payments/payments.service.ts` (MODIFY)
Add WePay case to switch:
```typescript
case 'wepay':
  paymentSession = await this.wepayService.createPayment(order, tenant);
  break;
```

Add `handleWepayWebhook()` method similar to `handleAdyenWebhook()`

#### 3. `/backend/src/payments/payments.module.ts` (MODIFY)
Add `WepayService` to providers

#### 4. `/backend/src/payments/webhooks.controller.ts` (MODIFY)
Add endpoint:
- `POST /api/webhooks/wepay` - WePay webhook handler

### FRONTEND FILES

#### 5. `/frontend/app/checkout/page.tsx` (MODIFY)
Enable payment integration:
- After creating order, call `createPaymentSession(orderId)`
- If `redirectUrl` exists, redirect to payment gateway
- If no redirect URL, go to success page

#### 6. `/frontend/app/checkout/mock-payment/page.tsx` (NEW - for testing)
Create mock payment page for development:
- Shows order ID and provider
- "Simulate Successful Payment" button
- "Cancel Payment" button
- Redirects to return page after simulation

#### 7. `/frontend/app/checkout/return/page.tsx` (NEW - optional)
Handle payment return:
- Get orderId and status from URL params
- Redirect to success page if success
- Redirect to checkout with error if failed

## IMPLEMENTATION DETAILS

### WePay Service Structure
```typescript
@Injectable()
export class WepayService {
  async createPayment(order: Order, tenant: Tenant) {
    // In dev mode: return mock redirect URL
    // In production: integrate with WePay API
  }

  verifyWebhook(signature: string, payload: string, secret: string): boolean {
    // Verify HMAC-SHA256 signature
    // Skip in dev mode
  }

  parseWebhook(data: any) {
    // Parse WePay webhook notification
    // Return standardized format
  }
}
```

### Payment Service Update
```typescript
// In payments.service.ts switch statement:
case 'wepay':
  paymentSession = await this.wepayService.createPayment(order, tenant);
  break;

// Add webhook handler:
async handleWepayWebhook(data: any, signature?: string) {
  const parsed = this.wepayService.parseWebhook(data);
  // Update order status based on payment result
}
```

### Frontend Checkout Update
```typescript
// In checkout/page.tsx:
const order = await createOrder(tenant, orderData);

// Create payment session
try {
  const payment = await createPaymentSession(order.id);
  if (payment.redirectUrl) {
    window.location.href = payment.redirectUrl;
    return;
  }
} catch (paymentError) {
  console.error('Payment session creation failed:', paymentError);
}

// If no redirect, go to success page
router.push(`/order/success?orderId=${order.id}`);
```

## CODE EXAMPLES

### WePay Service Implementation
```typescript
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
    
    if (process.env.NODE_ENV === 'development' || !wepayConfig.clientId) {
      // Development/Mock mode
      this.logger.warn('⚠️  WePay in DEV mode - using mock redirect URL');
      
      return {
        paymentId: 'wepay_' + order.id,
        redirectUrl: `http://localhost:3001/checkout/mock-payment?orderId=${order.id}&provider=wepay`,
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
    
    // Placeholder return
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
    
    // Production verification
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  }

  parseWebhook(data: any) {
    // Parse WePay webhook notification
    return {
      eventType: data.event_type || data.state,
      success: data.state === 'captured' || data.state === 'authorized',
      paymentRef: data.payment_id || data.id,
      merchantReference: data.reference_id || data.order_number,
      amount: data.amount ? Math.round(data.amount * 100) : null, // Convert to cents
    };
  }
}
```

### Payment Service Update
```typescript
// In payments.service.ts, add to switch:
switch (tenant.paymentProvider) {
  case 'adyen':
    paymentSession = await this.adyenService.createPaymentSession(order, tenant);
    break;
  case 'gopay':
    paymentSession = await this.gopayService.createPayment(order, tenant);
    break;
  case 'wepay':
    paymentSession = await this.wepayService.createPayment(order, tenant);
    break;
  default:
    throw new BadRequestException('Unsupported payment provider');
}

// Add webhook handler:
async handleWepayWebhook(data: any, signature?: string) {
  const parsed = this.wepayService.parseWebhook(data);
  
  const order = await this.ordersService.getOrderById(parsed.merchantReference);

  if (!order) {
    console.error('Order not found for WePay reference:', parsed.merchantReference);
    return;
  }

  if (parsed.success) {
    await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
    await this.orderStatusService.updateStatus(order.id, OrderStatus.PAID);
    
    // Create delivery
    try {
      await this.deliveryService.createDeliveryForOrder(order.id);
      console.log(`WePay payment successful for order ${order.id}, delivery created`);
    } catch (error) {
      console.error('Failed to create delivery:', error);
    }
  } else {
    await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'failed');
    await this.orderStatusService.updateStatus(order.id, OrderStatus.CANCELED);
    console.log(`WePay payment failed for order ${order.id}`);
  }
}
```

### Webhook Controller Update
```typescript
// In webhooks.controller.ts:
@Post('wepay')
async handleWepayWebhook(
  @Body() data: any,
  @Headers('x-wepay-signature') signature?: string,
  @Req() req: Request,
) {
  const rawBody = JSON.stringify(data);
  const tenantId = data.tenant_id || req.headers['x-tenant-id'];
  
  // Verify signature if in production
  if (process.env.NODE_ENV === 'production' && signature) {
    const hmacKey = process.env.WEPAY_HMAC_KEY || '';
    if (!this.wepayService.verifyWebhook(signature, rawBody, hmacKey)) {
      throw new UnauthorizedException('Invalid WePay webhook signature');
    }
  }
  
  await this.paymentsService.handleWepayWebhook(data, signature);
  return { status: 'accepted' };
}
```

### Frontend Checkout Update
```typescript
// In frontend/app/checkout/page.tsx:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Create order
    const order = await createOrder(tenant, {
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
      address: {
        street: formData.street,
        city: formData.city,
        postalCode: formData.postalCode,
        country: 'SK',
      },
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        modifiers: item.modifiers,
      })),
    });
    
    // Create payment session
    try {
      const payment = await createPaymentSession(order.id);
      
      if (payment.redirectUrl) {
        // Redirect to payment gateway (Adyen, GoPay, or WePay)
        window.location.href = payment.redirectUrl;
        return;
      }
    } catch (paymentError) {
      console.error('Payment session creation failed:', paymentError);
      // Continue to success page even if payment fails (for testing)
    }
    
    // If no redirect URL, go to success page
    router.push(`/order/success?orderId=${order.id}`);
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
    
    if (errorMessage.includes('not found') || errorMessage.includes('inactive')) {
      alert('Some items in your cart are no longer available. Please refresh the page and add items again.');
      clearCart();
      router.push('/');
    } else {
      alert(`Failed to process order: ${errorMessage}. Please try again.`);
    }
  } finally {
    setLoading(false);
  }
};
```

### Mock Payment Page
```typescript
// frontend/app/checkout/mock-payment/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function MockPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const provider = searchParams.get('provider');
  const [processing, setProcessing] = useState(false);

  const handleSuccess = () => {
    setProcessing(true);
    // Simulate payment success
    setTimeout(() => {
      router.push(`/checkout/return?orderId=${orderId}&status=success&provider=${provider}`);
    }, 1500);
  };

  const handleCancel = () => {
    router.push(`/checkout/return?orderId=${orderId}&status=canceled&provider=${provider}`);
  };

  if (!orderId) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Mock Payment ({provider})</h2>
        <p className="text-gray-600 mb-6">
          This is a mock payment page for testing. Order ID: {orderId}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleSuccess}
            disabled={processing}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Simulate Successful Payment'}
          </button>
          
          <button
            onClick={handleCancel}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Payment Return Page
```typescript
// frontend/app/checkout/return/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');
  const provider = searchParams.get('provider');

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    // Redirect based on payment status
    if (status === 'success') {
      router.push(`/order/success?orderId=${orderId}`);
    } else {
      router.push(`/checkout?error=payment_failed&orderId=${orderId}`);
    }
  }, [orderId, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p>Processing payment...</p>
      </div>
    </div>
  );
}
```

## TESTING
1. Create order → should redirect to WePay (mock in dev)
2. Complete mock payment → should redirect to success page
3. Check order status → should be PAID
4. Test webhook (manually call endpoint)
5. Test cancel payment → should redirect to checkout with error

## COMPLETION CRITERIA
- [ ] WePay service created (`wepay.service.ts`)
- [ ] Payment provider switch updated
- [ ] Webhook handler added
- [ ] Frontend checkout integrated
- [ ] Mock payment page for testing
- [ ] Payment return page created
- [ ] Tested end-to-end
- [ ] Update `/backend/src/payments/AGENT-5-COMPLETE.md`

## ENVIRONMENT VARIABLES (Future - for production)
```env
# WePay Configuration
WEPAY_CLIENT_ID=your_client_id
WEPAY_CLIENT_SECRET=your_client_secret
WEPAY_ACCOUNT_ID=your_account_id
WEPAY_ENVIRONMENT=sandbox  # or production
WEPAY_HMAC_KEY=your_webhook_hmac_key
```

## NOTES
- WePay service is placeholder until credentials are available
- In development, uses mock redirect URL
- In production, will use real WePay API
- Webhook verification can be skipped in dev mode
- Mock payment page allows testing without real credentials
- Follow same pattern as Adyen and GoPay services
- Use HMAC-SHA256 for webhook verification (same as Adyen)

## START IMPLEMENTATION NOW

Begin by:
1. Creating the WePay service
2. Adding to payment provider switch
3. Adding webhook handler
4. Updating frontend checkout
5. Creating mock payment page
6. Testing end-to-end

Good luck! 🚀

