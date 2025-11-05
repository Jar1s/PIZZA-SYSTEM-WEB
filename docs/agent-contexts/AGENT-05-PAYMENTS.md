# 🎯 AGENT 5: PAYMENT INTEGRATION (Adyen/GoPay)

You are Agent 5 integrating payment providers with webhook handling.

## PROJECT CONTEXT
Payments are critical. Must handle Adyen (primary) and optionally GoPay. Use hosted checkout (redirect flow). Webhooks update order status.

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/payments/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Adyen hosted checkout integration
2. GoPay integration (optional for MVP)
3. Webhook signature verification
4. Payment status → Order status sync
5. 3D Secure support

## FILES TO CREATE

### 1. `/backend/src/payments/payments.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WebhooksController } from './webhooks.controller';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [OrdersModule, TenantsModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, AdyenService, GopayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
```

### 2. `/backend/src/payments/adyen.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { Client, CheckoutAPI } from '@adyen/api-library';
import { Order, Tenant } from '@pizza-ecosystem/shared';

@Injectable()
export class AdyenService {
  private getClient(apiKey: string) {
    return new Client({
      apiKey,
      environment: process.env.ADYEN_ENVIRONMENT || 'TEST',
    });
  }

  async createPaymentSession(order: Order, tenant: Tenant) {
    const client = this.getClient(tenant.paymentConfig.apiKey);
    const checkout = new CheckoutAPI(client);

    const session = await checkout.sessions({
      merchantAccount: tenant.paymentConfig.merchantAccount,
      amount: {
        currency: 'EUR',
        value: order.totalCents,
      },
      reference: order.id,
      returnUrl: `https://${tenant.domain}/checkout/success?orderId=${order.id}`,
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
    const crypto = require('crypto');
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
```

### 3. `/backend/src/payments/gopay.service.ts`
```typescript
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
    
    return {
      paymentId: 'gopay_' + order.id,
      redirectUrl: `https://gate.gopay.cz/gw/v3/...`,
    };
  }

  verifyWebhook(signature: string, payload: string): boolean {
    // GoPay signature verification
    return true; // TODO: Implement
  }
}
```

### 4. `/backend/src/payments/payments.service.ts`
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { OrderStatus } from '@pizza-ecosystem/shared';

@Injectable()
export class PaymentsService {
  constructor(
    private adyenService: AdyenService,
    private gopayService: GopayService,
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  async createPaymentSession(orderId: string) {
    const order = await this.ordersService.getOrderById(orderId);
    const tenant = await this.tenantsService.getTenantBySlug(
      order.tenantId // You'll need to resolve this properly
    );

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order already processed');
    }

    let paymentSession;

    switch (tenant.paymentProvider) {
      case 'adyen':
        paymentSession = await this.adyenService.createPaymentSession(order, tenant);
        break;
      case 'gopay':
        paymentSession = await this.gopayService.createPayment(order, tenant);
        break;
      default:
        throw new BadRequestException('Unsupported payment provider');
    }

    // Store payment reference
    await this.ordersService.updatePaymentRef(
      orderId,
      paymentSession.sessionId || paymentSession.paymentId,
      'pending'
    );

    return paymentSession;
  }

  async handleAdyenWebhook(notification: any) {
    const parsed = this.adyenService.parseWebhook(notification);
    const order = await this.ordersService.getOrderByPaymentRef(parsed.paymentRef);

    if (!order) {
      console.error('Order not found for payment ref:', parsed.paymentRef);
      return;
    }

    if (parsed.success && parsed.eventType === 'AUTHORISATION') {
      // Payment successful
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.PAID);
      
      // TODO: Trigger delivery creation (Agent 7 will handle this)
    } else {
      // Payment failed
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'failed');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.CANCELED);
    }
  }

  async handleGopayWebhook(data: any) {
    // GoPay webhook handling
    // Similar to Adyen
  }
}
```

### 5. `/backend/src/payments/payments.controller.ts`
```typescript
import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('session')
  async createSession(@Body() data: { orderId: string }) {
    return this.paymentsService.createPaymentSession(data.orderId);
  }
}
```

### 6. `/backend/src/payments/webhooks.controller.ts`
```typescript
import { Controller, Post, Body, Headers, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { AdyenService } from './adyen.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(
    private paymentsService: PaymentsService,
    private adyenService: AdyenService,
  ) {}

  @Post('adyen')
  async handleAdyenWebhook(
    @Body() body: any,
    @Headers('hmac-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Verify signature
    const rawBody = JSON.stringify(body);
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    
    if (!this.adyenService.verifyWebhookSignature(rawBody, signature, hmacKey)) {
      console.error('Invalid Adyen webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // Process notification
    const notification = body.notificationItems?.[0]?.NotificationRequestItem;
    if (notification) {
      await this.paymentsService.handleAdyenWebhook(notification);
    }

    // Adyen requires [accepted] response
    return res.status(200).send('[accepted]');
  }

  @Post('gopay')
  async handleGopayWebhook(@Body() body: any, @Res() res: Response) {
    await this.paymentsService.handleGopayWebhook(body);
    return res.status(200).send('OK');
  }
}
```

### 7. `/backend/.env.example` (Add payment keys)
```bash
# Adyen
ADYEN_API_KEY=your_api_key
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
ADYEN_ENVIRONMENT=TEST  # or LIVE
ADYEN_HMAC_KEY=your_hmac_key_for_webhooks

# GoPay
GOPAY_GOID=your_gopay_id
GOPAY_CLIENT_ID=your_client_id
GOPAY_CLIENT_SECRET=your_client_secret
```

## DELIVERABLES CHECKLIST
- [ ] Adyen payment session creation
- [ ] Adyen webhook handler with signature verification
- [ ] GoPay integration (basic)
- [ ] Payment → Order status sync
- [ ] Environment variables documented
- [ ] Test with Adyen test cards

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 2 (database)
- ✅ Agent 4 (orders - updates status)

## WHO NEEDS YOUR OUTPUT
- Agent 6 (Frontend - initiates payment)
- Agent 7 (Delivery - triggered after payment)

## WHEN TO START
⏳ **WAIT for Agent 4** to complete orders

## SETUP COMMANDS
```bash
cd backend
npm install @adyen/api-library
```

## TEST YOUR WORK
```bash
# Create payment session
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_id_here"}'

# Test webhook (use Adyen test tool or ngrok)
# Adyen test cards: https://docs.adyen.com/development-resources/test-cards/test-card-numbers
# 4111 1111 1111 1111 (success)
# 4000 0000 0000 0002 (decline)
```

## ADYEN SETUP GUIDE
1. Create Adyen test account: https://ca-test.adyen.com/
2. Get API key from Settings → API credentials
3. Get Merchant Account from Settings → Account
4. Set up webhook: Settings → Webhooks → Add webhook
   - URL: https://your-domain.com/api/webhooks/adyen
   - Generate HMAC key
5. Test with Adyen checkout: https://checkoutshopper-test.adyen.com/

## COMPLETION SIGNAL
Create `/backend/src/payments/AGENT-5-COMPLETE.md`:
```markdown
# Agent 5 Complete ✅

## What I Built
- Adyen hosted checkout integration
- Webhook handler with signature verification
- Payment → Order status automation
- GoPay placeholder (can be implemented later)

## API Endpoints
- POST /api/payments/session → Create payment session
- POST /api/webhooks/adyen → Adyen webhook (internal)
- POST /api/webhooks/gopay → GoPay webhook (internal)

## Environment Variables
Add to backend/.env:
- ADYEN_API_KEY
- ADYEN_MERCHANT_ACCOUNT
- ADYEN_ENVIRONMENT (TEST/LIVE)
- ADYEN_HMAC_KEY

## Test Cards (Adyen TEST mode)
- 4111 1111 1111 1111 → Success
- 4000 0000 0000 0002 → Decline
- Any CVV, any future expiry date

## Next Agents Can Start
✅ Agent 6 (Frontend can now process payments)
✅ Agent 7 (Delivery triggered after payment success)
```

BEGIN when Agent 4 signals complete!


