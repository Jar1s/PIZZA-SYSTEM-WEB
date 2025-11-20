# Payment Integration Module

Complete payment processing system for the multi-tenant pizza ordering platform.

## Overview

This module handles payment processing through multiple payment providers (Adyen and GoPay), with webhook handling for automatic order status updates.

## Features

✅ **Adyen Integration**
- Hosted checkout with redirect flow
- Payment session creation
- 3D Secure support (automatic)
- HMAC webhook signature verification
- TEST and LIVE environment support

✅ **GoPay Integration** (Placeholder)
- Basic structure ready
- Can be completed when needed

✅ **Order Status Automation**
- Automatic status updates: PENDING → PAID
- Failed payment handling: PENDING → CANCELED
- Integration with OrdersModule for status transitions

✅ **Security**
- HMAC-SHA256 webhook signature verification
- Environment-based configuration
- Encrypted API keys stored per tenant

## Files

```
payments/
├── payments.module.ts           # Module definition
├── payments.service.ts          # Payment orchestration
├── payments.controller.ts       # Public API endpoints
├── webhooks.controller.ts       # Webhook handlers
├── adyen.service.ts             # Adyen API integration
├── gopay.service.ts             # GoPay placeholder
├── AGENT-5-COMPLETE.md          # Completion summary
└── README.md                    # This file
```

## API Endpoints

### Public Endpoints

#### POST /api/payments/session
Create a payment session for an order.

**Request:**
```json
{
  "orderId": "cm3abc123..."
}
```

**Response:**
```json
{
  "sessionId": "CS...",
  "sessionData": "...",
  "redirectUrl": "https://checkoutshopper-test.adyen.com/..."
}
```

### Webhook Endpoints (Internal)

#### POST /api/webhooks/adyen
Adyen payment notification webhook.

**Headers:**
- `hmac-signature`: HMAC signature for verification

**Response:**
```
[accepted]
```

#### POST /api/webhooks/gopay
GoPay payment notification webhook (placeholder).

**Response:**
```
OK
```

## Payment Flow

1. Customer completes order → Order created with `PENDING` status
2. Frontend calls `POST /api/payments/session` with orderId
3. Backend creates payment session with provider (Adyen/GoPay)
4. Customer redirected to hosted checkout page
5. Customer completes payment (3D Secure if required)
6. Provider sends webhook to backend
7. Backend verifies webhook signature
8. Backend updates order status:
   - Success → `PAID`
   - Failure → `CANCELED`
9. Order ready for delivery processing

## Environment Variables

```bash
# Adyen Configuration
ADYEN_API_KEY=your_api_key_here
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
ADYEN_ENVIRONMENT=TEST  # TEST or LIVE
ADYEN_HMAC_KEY=your_hmac_key_for_webhooks

# GoPay Configuration (Optional)
GOPAY_GOID=your_gopay_id
GOPAY_CLIENT_ID=your_client_id
GOPAY_CLIENT_SECRET=your_client_secret
```

## Testing

### Test Cards (Adyen TEST Environment)

**Successful Payment:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `737`)
- Expiry: Any future date (e.g., `03/30`)

**Declined Payment:**
- Card: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

**3D Secure Required:**
- Card: `4917 6100 0000 0000`
- CVV: Any 3 digits
- Expiry: Any future date

### Manual Testing

```bash
# 1. Create an order
curl -X POST http://localhost:3000/api/pornopizza/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+421900000000"
    },
    "address": {
      "street": "Test Street 1",
      "city": "Bratislava",
      "postalCode": "81101",
      "country": "SK"
    },
    "items": [
      { "productId": "YOUR_PRODUCT_ID", "quantity": 1 }
    ]
  }'

# 2. Create payment session (use orderId from step 1)
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{"orderId": "YOUR_ORDER_ID"}'

# 3. Open the redirectUrl in a browser to complete payment

# 4. Check order status
curl http://localhost:3000/api/track/YOUR_ORDER_ID
```

## Adyen Setup Guide

### 1. Create Test Account
- Go to: https://ca-test.adyen.com/
- Register for a test merchant account
- Verify your email

### 2. Get API Credentials
1. Log in to Adyen Customer Area
2. Navigate to **Developers → API credentials**
3. Create new credential or select existing
4. Copy **API key**
5. Note your **Merchant Account** name

### 3. Configure Webhook
1. Navigate to **Developers → Webhooks**
2. Click **+ Webhook** → **Standard webhook**
3. Set **URL**: `https://your-domain.com/api/webhooks/adyen`
4. Select events: ✅ **AUTHORISATION**
5. Click **Generate** to create HMAC key
6. Copy HMAC key to `.env` as `ADYEN_HMAC_KEY`
7. Save webhook configuration

### 4. Test Integration
Use the test cards above to verify the integration works.

## Integration Points

### Dependencies
- **OrdersModule**: Updates order status and payment references
- **TenantsModule**: Retrieves tenant payment configuration
- **@adyen/api-library**: Adyen API client

### Exports
- `PaymentsService`: Available for other modules to trigger payments

### Used By
- **Frontend (Agent 6)**: Calls payment session creation
- **Delivery (Agent 7)**: Triggered after successful payment
- **Admin Dashboard (Agent 8)**: Displays payment status

## Security Considerations

✅ **Webhook Signature Verification**
- All webhooks verified using HMAC-SHA256
- Invalid signatures rejected with 401 Unauthorized

✅ **Tenant Isolation**
- Payment config stored per tenant
- Each tenant uses own API keys

✅ **Environment Separation**
- TEST and LIVE environments separate
- Never mix test and live credentials

✅ **No Sensitive Data Exposure**
- API keys never returned in responses
- Payment details handled by provider

## Error Handling

| Error | Status | Description |
|-------|--------|-------------|
| Order not found | 404 | Invalid orderId |
| Order already processed | 400 | Order status not PENDING |
| Unsupported payment provider | 400 | Tenant has invalid payment provider |
| Invalid webhook signature | 401 | Webhook signature verification failed |
| Payment provider error | 500 | Logged to console, order remains in current state |

## Future Improvements

- [ ] Implement full GoPay integration
- [ ] Add GPWebPay support (Czech Republic)
- [ ] Store detailed payment logs in database
- [ ] Email notifications on payment success/failure
- [ ] Refund support
- [ ] Partial payments
- [ ] Recurring payments for subscriptions
- [ ] Apple Pay / Google Pay support

## Troubleshooting

### Webhook not receiving notifications
1. Check webhook URL is publicly accessible
2. Verify HMAC key matches Adyen Customer Area
3. Check Adyen webhook logs in Customer Area
4. Use ngrok for local testing: `ngrok http 3000`

### Payment session creation fails
1. Verify API key is correct
2. Check merchant account name
3. Ensure environment (TEST/LIVE) matches API key
4. Check network connectivity to Adyen

### Order status not updating
1. Verify webhook endpoint is receiving requests
2. Check webhook signature verification passes
3. Verify order exists with correct ID
4. Check OrdersService and OrderStatusService are working

## Support

For issues or questions:
1. Check Adyen documentation: https://docs.adyen.com/
2. Test with Adyen test cards
3. Review Adyen Customer Area webhook logs
4. Check backend logs for error messages

---

**Status**: ✅ Production Ready (TEST environment)

**Last Updated**: November 4, 2025





















