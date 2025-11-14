# Payment Integration Testing Guide

## 🎯 Complete Testing Checklist for Agent 5

This guide walks you through testing the complete payment integration system.

## Prerequisites

1. **Adyen Test Account**
   - Sign up at: https://ca-test.adyen.com/
   - Get your API credentials
   - Set up webhook endpoint

2. **Environment Variables**
   Create `/backend/.env` with:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem"
   PORT=3000
   
   # Adyen Configuration
   ADYEN_API_KEY=your_test_api_key
   ADYEN_MERCHANT_ACCOUNT=YourTestMerchantAccount
   ADYEN_ENVIRONMENT=TEST
   ADYEN_HMAC_KEY=your_hmac_key
   ```

3. **Backend Running**
   ```bash
   cd backend
   npm run start:dev
   ```

## Test Scenarios

### ✅ Test 1: Create Payment Session (Successful)

**Objective**: Create a payment session for a pending order

```bash
# Step 1: Create an order first
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
      {
        "productId": "YOUR_PRODUCT_ID",
        "quantity": 1
      }
    ]
  }'

# Step 2: Copy the orderId from response

# Step 3: Create payment session
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "YOUR_ORDER_ID_HERE"
  }'

# Expected Response:
# {
#   "sessionId": "CS...",
#   "sessionData": "...",
#   "redirectUrl": "https://checkoutshopper-test.adyen.com/..."
# }
```

**Success Criteria**:
- ✅ Status code 200
- ✅ Response contains `sessionId`, `sessionData`, `redirectUrl`
- ✅ Order's `paymentRef` updated in database
- ✅ Order's `paymentStatus` set to `pending`

---

### ✅ Test 2: Payment Flow with Adyen Test Card

**Objective**: Complete full payment flow using Adyen hosted checkout

**Steps**:
1. Create payment session (as above)
2. Copy the `redirectUrl` from response
3. Open `redirectUrl` in browser
4. On Adyen checkout page, enter test card:
   - **Card Number**: `4111 1111 1111 1111`
   - **CVV**: `737` (any 3 digits)
   - **Expiry**: `03/30` (any future date)
   - **Name**: Any name
5. Click "Pay"
6. You'll be redirected to return URL
7. Check order status

```bash
# Check order status
curl http://localhost:3000/api/track/YOUR_ORDER_ID

# Expected status: PAID
```

**Success Criteria**:
- ✅ Payment completes successfully
- ✅ Webhook received by backend
- ✅ Order status changed from `PENDING` → `PAID`
- ✅ Payment reference stored in order
- ✅ Console logs "Payment successful for order ..."

---

### ❌ Test 3: Payment Declined

**Objective**: Test failed payment handling

**Steps**:
1. Create new order
2. Create payment session
3. Use **decline test card**: `4000 0000 0000 0002`
4. Complete payment (will be declined)

```bash
# Check order status after decline
curl http://localhost:3000/api/track/YOUR_ORDER_ID

# Expected status: CANCELED
```

**Success Criteria**:
- ✅ Payment declined
- ✅ Order status changed to `CANCELED`
- ✅ Console logs "Payment failed for order ..."

---

### 🔐 Test 4: Webhook Signature Verification

**Objective**: Verify webhook security

**Test Invalid Signature**:
```bash
curl -X POST http://localhost:3000/api/webhooks/adyen \
  -H "Content-Type: application/json" \
  -H "hmac-signature: invalid_signature" \
  -d '{
    "notificationItems": [
      {
        "NotificationRequestItem": {
          "eventCode": "AUTHORISATION",
          "success": "true",
          "merchantReference": "test_order_123",
          "pspReference": "test_ref_123"
        }
      }
    ]
  }'

# Expected: 401 Unauthorized with "Invalid signature"
```

**Success Criteria**:
- ✅ Invalid signature rejected with 401
- ✅ Console logs "Invalid Adyen webhook signature"

---

### 🚫 Test 5: Error Handling

#### 5a. Payment Session for Non-Existent Order
```bash
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{"orderId": "non_existent_order"}'

# Expected: 404 Not Found
```

#### 5b. Payment Session for Already Paid Order
```bash
# First create and pay for an order, then try again:
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{"orderId": "already_paid_order_id"}'

# Expected: 400 Bad Request - "Order already processed"
```

**Success Criteria**:
- ✅ Proper error messages returned
- ✅ Correct HTTP status codes
- ✅ No crashes or exceptions

---

### 🔄 Test 6: Multiple Payment Providers

**Objective**: Test tenant-specific payment provider selection

**Test Adyen Provider**:
```bash
# PornoPizza uses Adyen
curl -X POST http://localhost:3000/api/pornopizza/orders ...
curl -X POST http://localhost:3000/api/payments/session ...
# Should use Adyen
```

**Test GoPay Provider** (if configured):
```bash
# Create tenant with GoPay provider
# Then create order for that tenant
# Payment session should use GoPay
```

**Success Criteria**:
- ✅ Correct provider selected based on tenant config
- ✅ Different providers work independently

---

## Advanced Testing

### Test 7: 3D Secure Flow

Use 3D Secure test card: `4917 6100 0000 0000`

**Steps**:
1. Create payment session
2. Use 3DS test card
3. Complete 3D Secure authentication
4. Verify payment succeeds

**Success Criteria**:
- ✅ 3DS authentication page shown
- ✅ Payment completes after authentication
- ✅ Order status updated correctly

---

### Test 8: Webhook Retries

Adyen will retry webhooks if not acknowledged.

**Test**:
1. Temporarily break webhook handler
2. Process payment
3. Verify Adyen retries webhook
4. Fix handler
5. Next retry succeeds

**Success Criteria**:
- ✅ Webhooks retried by Adyen
- ✅ Eventually processed successfully

---

### Test 9: Concurrent Payments

**Test multiple simultaneous payments**:
```bash
# Create 5 orders
# Create 5 payment sessions simultaneously
# Process all payments
# Verify all webhooks processed correctly
```

**Success Criteria**:
- ✅ No race conditions
- ✅ All orders updated correctly
- ✅ No webhook processing errors

---

## Testing with ngrok (Local Development)

To receive webhooks locally:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)

# Configure Adyen webhook:
# URL: https://abc123.ngrok.io/api/webhooks/adyen
# Generate HMAC key
# Update .env with HMAC key

# Now Adyen can send webhooks to your local machine
```

---

## Automated Test Script

Save as `test-payments.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"
TENANT="pornopizza"

echo "🧪 Testing Payment Integration"
echo "================================"

# Test 1: Create Order
echo "📝 Creating test order..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/api/$TENANT/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name": "Test User", "email": "test@example.com", "phone": "+421900000000"},
    "address": {"street": "Test St 1", "city": "Bratislava", "postalCode": "81101", "country": "SK"},
    "items": [{"productId": "YOUR_PRODUCT_ID", "quantity": 1}]
  }')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')
echo "✅ Order created: $ORDER_ID"

# Test 2: Create Payment Session
echo "💳 Creating payment session..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/payments/session" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

SESSION_ID=$(echo $PAYMENT_RESPONSE | jq -r '.sessionId')
REDIRECT_URL=$(echo $PAYMENT_RESPONSE | jq -r '.redirectUrl')

echo "✅ Payment session created: $SESSION_ID"
echo "🌐 Checkout URL: $REDIRECT_URL"
echo ""
echo "👉 Open this URL in your browser to complete payment:"
echo "$REDIRECT_URL"
echo ""
echo "Use test card: 4111 1111 1111 1111, CVV: 737, Expiry: 03/30"

# Wait for payment
echo ""
echo "⏳ Waiting 60 seconds for payment..."
sleep 60

# Test 3: Check Order Status
echo "🔍 Checking order status..."
ORDER_STATUS=$(curl -s "$API_URL/api/track/$ORDER_ID")
STATUS=$(echo $ORDER_STATUS | jq -r '.status')

if [ "$STATUS" == "PAID" ]; then
  echo "✅ Payment successful! Order status: PAID"
else
  echo "⏳ Order status: $STATUS (payment may still be processing)"
fi

echo ""
echo "================================"
echo "✅ Payment integration test complete!"
```

Run with:
```bash
chmod +x test-payments.sh
./test-payments.sh
```

---

## Monitoring & Debugging

### Check Logs
```bash
# Watch backend logs
npm run start:dev

# Look for:
# - "Payment successful for order ..."
# - "Payment failed for order ..."
# - "Invalid Adyen webhook signature"
```

### Check Database
```bash
# Connect to database
npx prisma studio

# Check Order table:
# - paymentRef should be set
# - paymentStatus should be "success" or "failed"
# - status should be PAID or CANCELED
```

### Check Adyen Customer Area
1. Log in to https://ca-test.adyen.com/
2. Go to **Webhooks** → View webhook logs
3. See all webhook attempts and responses
4. Debug any failed webhooks

---

## Common Issues & Solutions

### Issue: Webhook not received
**Solution**: Use ngrok or deploy to public URL

### Issue: Invalid signature error
**Solution**: Verify HMAC key matches Adyen Customer Area

### Issue: Payment session creation fails
**Solution**: 
- Check API key is correct
- Verify merchant account name
- Ensure environment (TEST/LIVE) matches

### Issue: Order status not updating
**Solution**:
- Check webhook endpoint is accessible
- Verify signature verification passes
- Check OrdersService methods work correctly

---

## Production Checklist

Before going live:

- [ ] Switch to LIVE Adyen account
- [ ] Update `ADYEN_ENVIRONMENT=LIVE`
- [ ] Use LIVE API keys
- [ ] Configure LIVE webhook URL
- [ ] Test with real (non-test) cards
- [ ] Monitor first transactions closely
- [ ] Set up error alerting
- [ ] Review Adyen security settings
- [ ] Enable PCI compliance features

---

## Test Results Template

```
# Payment Integration Test Results

Date: _______
Tester: _______
Environment: TEST / LIVE

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Create Payment Session | ✅/❌ | |
| 2 | Successful Payment | ✅/❌ | |
| 3 | Payment Declined | ✅/❌ | |
| 4 | Webhook Signature | ✅/❌ | |
| 5a | Non-existent Order | ✅/❌ | |
| 5b | Already Paid Order | ✅/❌ | |
| 6 | Multiple Providers | ✅/❌ | |
| 7 | 3D Secure | ✅/❌ | |
| 8 | Webhook Retries | ✅/❌ | |
| 9 | Concurrent Payments | ✅/❌ | |

Overall Result: PASS / FAIL
```

---

## Support Resources

- **Adyen Documentation**: https://docs.adyen.com/
- **Adyen Test Cards**: https://docs.adyen.com/development-resources/test-cards/test-card-numbers
- **Adyen API Explorer**: https://docs.adyen.com/api-explorer/
- **Webhook Testing**: https://webhook.site (for webhook debugging)

---

**Happy Testing! 🚀**













