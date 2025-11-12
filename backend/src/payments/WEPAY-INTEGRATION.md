# WePay Payment Gateway Integration

**Status**: ✅ **COMPLETE** (Placeholder with Mock Support)  
**Date**: November 11, 2025  
**Extension**: Agent 5 Payment Integration

---

## 📋 Overview

WePay payment gateway has been integrated into the payment system alongside Adyen and GoPay. The implementation includes a placeholder service that can be completed when WePay credentials are available.

---

## ✅ Implementation Summary

### Backend Files Created/Modified

1. **`wepay.service.ts`** (NEW) ✅
   - WePay service with payment creation
   - Webhook signature verification (HMAC-SHA256)
   - Webhook parsing
   - Mock redirect URL in development mode

2. **`payments.service.ts`** (MODIFIED) ✅
   - Added WePay case to payment provider switch
   - Added `handleWepayWebhook()` method
   - Integrated with delivery service

3. **`payments.module.ts`** (MODIFIED) ✅
   - Added `WepayService` to providers

4. **`webhooks.controller.ts`** (MODIFIED) ✅
   - Added `POST /api/webhooks/wepay` endpoint
   - Signature verification (production only)
   - Dev mode skips verification

### Frontend Files Created/Modified

5. **`checkout/page.tsx`** (MODIFIED) ✅
   - Integrated payment session creation
   - Redirects to payment gateway on success
   - Handles payment errors gracefully

6. **`checkout/mock-payment/page.tsx`** (NEW) ✅
   - Mock payment page for testing
   - Simulates successful/canceled payments
   - Only available in development mode

7. **`checkout/return/page.tsx`** (NEW) ✅
   - Handles payment return from gateway
   - Redirects to success page or checkout with error
   - Shows processing message

### Shared Types

8. **`shared/types/payment.types.ts`** (MODIFIED) ✅
   - Added `'wepay'` to `PaymentProvider` type

---

## 🔌 API Endpoints

### Webhook Endpoint

**POST `/api/webhooks/wepay`**

- **Purpose**: Receives WePay payment notifications
- **Headers**: 
  - `x-wepay-signature` (optional in dev, required in production)
- **Body**: WePay webhook notification
- **Response**: `{ status: 'accepted' }`
- **Security**: HMAC-SHA256 signature verification (production only)

---

## 🔧 Configuration

### Development Mode

In development mode, WePay uses mock redirect URLs:

```typescript
// Returns mock redirect URL
redirectUrl: `http://localhost:3001/checkout/mock-payment?orderId=${order.id}&provider=wepay`
```

### Production Mode

When WePay credentials are available, update `wepay.service.ts`:

```typescript
// Uncomment and implement:
const wepayApi = new WePayClient({
  clientId: wepayConfig.clientId,
  clientSecret: wepayConfig.clientSecret,
  environment: wepayConfig.environment || 'sandbox',
});

const payment = await wepayApi.payments.create({
  account_id: wepayConfig.accountId,
  amount: order.totalCents / 100,
  currency: 'EUR',
  reference_id: order.id,
  callback_uri: `${tenant.domain}/checkout/return?provider=wepay`,
});
```

### Environment Variables

Add to `backend/.env` (for production):

```bash
# WePay Configuration
WEPAY_CLIENT_ID=your_client_id
WEPAY_CLIENT_SECRET=your_client_secret
WEPAY_ACCOUNT_ID=your_account_id
WEPAY_ENVIRONMENT=sandbox  # or production
WEPAY_HMAC_KEY=your_webhook_hmac_key
```

---

## 🧪 Testing

### Mock Payment Flow

1. **Create Order**:
   ```bash
   curl -X POST http://localhost:3000/api/pornopizza/orders \
     -H "Content-Type: application/json" \
     -d '{
       "customer": {"name": "Test", "email": "test@example.com", "phone": "+421900000000"},
       "address": {"street": "Test St 1", "city": "Bratislava", "postalCode": "81101", "country": "SK"},
       "items": [{"productId": "PRODUCT_ID", "quantity": 1}]
     }'
   ```

2. **Create Payment Session**:
   ```bash
   curl -X POST http://localhost:3000/api/payments/session \
     -H "Content-Type: application/json" \
     -d '{"orderId": "ORDER_ID"}'
   ```

3. **Redirect to Mock Payment**:
   - Opens `/checkout/mock-payment?orderId=...&provider=wepay`
   - Click "Simulate Successful Payment"
   - Redirects to return page
   - Redirects to success page

4. **Verify Order Status**:
   ```bash
   curl http://localhost:3000/api/track/ORDER_ID
   # Should show status: PAID
   ```

### Webhook Testing

```bash
# Test WePay webhook (dev mode - no signature required)
curl -X POST http://localhost:3000/api/webhooks/wepay \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "wepay_123",
    "reference_id": "ORDER_ID",
    "state": "captured",
    "amount": 25.50
  }'
```

---

## 🔄 Payment Flow

```
1. Customer completes checkout
   ↓
2. Order created (PENDING)
   ↓
3. Payment session created
   ↓
4. Redirect to WePay (or mock in dev)
   ↓
5. Customer pays
   ↓
6. WePay sends webhook
   ↓
7. Backend verifies signature
   ↓
8. Order status updated (PAID/CANCELED)
   ↓
9. Delivery created (if successful)
```

---

## 🔒 Security

### Webhook Signature Verification

- **Algorithm**: HMAC-SHA256
- **Header**: `x-wepay-signature`
- **Dev Mode**: Verification skipped
- **Production**: Verification required

### Implementation

```typescript
verifyWebhook(signature: string, payload: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}
```

---

## 📊 Features

### ✅ Implemented

- [x] WePay service structure
- [x] Payment session creation (mock in dev)
- [x] Webhook handler
- [x] Signature verification (production)
- [x] Order status automation
- [x] Delivery integration
- [x] Mock payment page for testing
- [x] Payment return handling
- [x] Frontend checkout integration

### ⏳ Pending (When Credentials Available)

- [ ] Real WePay API integration
- [ ] OAuth2 token management
- [ ] Production webhook testing
- [ ] Error handling for API failures
- [ ] Retry logic for failed payments

---

## 🔗 Integration Points

### Dependencies

- ✅ **PaymentsService** - Orchestrates payment flow
- ✅ **OrdersService** - Updates order status
- ✅ **OrderStatusService** - Manages status transitions
- ✅ **DeliveryService** - Creates delivery after payment
- ✅ **TenantsService** - Retrieves tenant payment config

### Used By

- ✅ **Frontend Checkout** - Initiates payment
- ✅ **Webhook Controller** - Receives notifications
- ✅ **Payment Service** - Processes webhooks

---

## 📝 Code Structure

### WePay Service

```typescript
@Injectable()
export class WepayService {
  async createPayment(order: Order, tenant: Tenant) {
    // Dev mode: mock redirect
    // Production: real WePay API
  }

  verifyWebhook(signature: string, payload: string, secret: string): boolean {
    // HMAC-SHA256 verification
  }

  parseWebhook(data: any) {
    // Standardized webhook parsing
  }
}
```

### Payment Service Integration

```typescript
switch (tenant.paymentProvider) {
  case 'wepay':
    paymentSession = await this.wepayService.createPayment(order, tenant);
    break;
}
```

### Webhook Handler

```typescript
async handleWepayWebhook(data: any, signature?: string) {
  const parsed = this.wepayService.parseWebhook(data);
  // Update order status
  // Create delivery if successful
}
```

---

## 🐛 Troubleshooting

### Issue: Mock payment page not showing

**Solution**: Ensure `NODE_ENV=development` and tenant has `paymentProvider: 'wepay'`

### Issue: Webhook not received

**Solution**: 
- Check webhook URL is publicly accessible
- Verify HMAC key matches WePay dashboard
- Check WePay webhook logs

### Issue: Order status not updating

**Solution**:
- Verify webhook endpoint is accessible
- Check signature verification passes
- Review backend logs for errors
- Verify order exists with correct ID

---

## 📚 Resources

- **WePay Documentation**: https://developer.wepay.com/
- **WePay API Reference**: https://developer.wepay.com/api
- **Webhook Guide**: https://developer.wepay.com/docs/webhooks

---

## ✅ Completion Checklist

- [x] WePay service created
- [x] Payment provider switch updated
- [x] Webhook handler added
- [x] Frontend checkout integrated
- [x] Mock payment page created
- [x] Payment return page created
- [x] Shared types updated
- [x] Documentation updated
- [x] Tested end-to-end (mock flow)

---

## 🚀 Next Steps

1. **Get WePay Credentials**:
   - Sign up for WePay account
   - Get API credentials
   - Configure webhook endpoint

2. **Complete Integration**:
   - Uncomment WePay API code in `wepay.service.ts`
   - Install WePay SDK (if available)
   - Test with real API

3. **Production Testing**:
   - Test with real payments
   - Verify webhook signature
   - Monitor first transactions

---

**Status**: ✅ **READY FOR TESTING** (Mock Mode)  
**Production**: ⏳ **PENDING CREDENTIALS**

---

*WePay integration complete! Ready to process payments when credentials are available.* 💳✨

