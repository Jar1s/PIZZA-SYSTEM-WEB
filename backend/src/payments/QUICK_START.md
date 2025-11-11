# 🚀 Quick Start - Payment Integration

**5-Minute Setup Guide for Agent 5 Payment Module**

---

## ✅ What's Been Built

Complete payment processing system with:
- ✅ Adyen hosted checkout integration
- ✅ Webhook automation for order status updates
- ✅ HMAC signature security verification
- ✅ Multi-tenant payment provider support
- ✅ 3D Secure automatic support
- ✅ Complete documentation & testing guides

---

## 🎯 Quick Test (3 Steps)

### Step 1: Configure Adyen (5 minutes)

1. **Sign up**: https://ca-test.adyen.com/
2. **Get API Key**: Developers → API credentials → Copy API key
3. **Get Merchant Account**: Settings → Account → Copy merchant account name

### Step 2: Set Environment Variables

Create `/backend/.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem"

ADYEN_API_KEY=your_test_api_key_here
ADYEN_MERCHANT_ACCOUNT=YourMerchantAccountName
ADYEN_ENVIRONMENT=TEST
ADYEN_HMAC_KEY=your_hmac_key_here
```

### Step 3: Test Payment Flow

```bash
# 1. Start backend
cd backend
npm run start:dev

# 2. Create order
curl -X POST http://localhost:3000/api/pornopizza/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {"name": "Test User", "email": "test@example.com", "phone": "+421900000000"},
    "address": {"street": "Test St 1", "city": "Bratislava", "postalCode": "81101", "country": "SK"},
    "items": [{"productId": "YOUR_PRODUCT_ID", "quantity": 1}]
  }'

# 3. Create payment session (use orderId from step 2)
curl -X POST http://localhost:3000/api/payments/session \
  -H "Content-Type: application/json" \
  -d '{"orderId": "YOUR_ORDER_ID"}'

# 4. Open redirectUrl in browser
# 5. Pay with test card: 4111 1111 1111 1111, CVV: 737, Expiry: 03/30
# 6. Check order status updated to PAID
```

---

## 📚 Documentation

| Document | Purpose | Open When |
|----------|---------|-----------|
| `README.md` | Module overview & API reference | Need API details |
| `STATUS.md` | Quick status dashboard | Check what's complete |
| `TESTING_GUIDE.md` | Complete testing instructions | Ready to test |
| `AGENT-5-COMPLETE.md` | Completion summary | Handoff to other agents |
| `AGENT-5-IMPLEMENTATION-REPORT.md` | Detailed technical report | Deep dive needed |
| `QUICK_START.md` | This file | Getting started |

---

## 🔗 Integration Guide

### For Frontend (Agent 6)

**Endpoint**: `POST /api/payments/session`

```typescript
// Request
const response = await fetch('/api/payments/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: 'cm3abc...' })
});

const { redirectUrl } = await response.json();

// Redirect user to Adyen checkout
window.location.href = redirectUrl;
```

**Return URL**: Customer redirected back to your site after payment

### For Delivery (Agent 7)

Listen for order status `PAID`:

```typescript
// When order.status === OrderStatus.PAID
// → Trigger delivery creation
```

### For Admin (Agent 8)

Display payment info:

```typescript
// order.paymentRef - Payment reference
// order.paymentStatus - 'pending', 'success', 'failed'
// order.status - PENDING, PAID, CANCELED
```

---

## 🧪 Test Cards

| Card | Result |
|------|--------|
| `4111 1111 1111 1111` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4917 6100 0000 0000` | 🔐 3D Secure |

**CVV**: Any 3 digits  
**Expiry**: Any future date

---

## 🐛 Troubleshooting

### Payment session fails

```bash
# Check:
- Adyen API key is correct
- Merchant account name is correct
- ADYEN_ENVIRONMENT=TEST
- Order exists and is PENDING
```

### Webhook not received

```bash
# For local testing, use ngrok:
brew install ngrok
ngrok http 3000

# Configure Adyen webhook:
# URL: https://YOUR_NGROK_URL.ngrok.io/api/webhooks/adyen
# Generate HMAC key
# Add HMAC key to .env
```

### Order status not updating

```bash
# Check:
- Webhook endpoint accessible
- HMAC signature verification passes
- Backend logs for errors
- Adyen Customer Area webhook logs
```

---

## ✅ Checklist

Before going to production:

- [ ] Adyen TEST account configured
- [ ] Environment variables set
- [ ] Payment session tested
- [ ] Test cards work
- [ ] Webhook receives notifications
- [ ] Order status updates automatically
- [ ] 3D Secure flow tested

---

## 🎓 Learn More

- **Complete Testing**: See `TESTING_GUIDE.md`
- **API Reference**: See `README.md`
- **Implementation Details**: See `AGENT-5-IMPLEMENTATION-REPORT.md`
- **Adyen Docs**: https://docs.adyen.com/

---

## 🚀 What's Next?

1. ✅ **Payment module complete** ← You are here
2. ⏭️ **Agent 6**: Frontend integration
3. ⏭️ **Agent 7**: Delivery after payment
4. ⏭️ **Agent 8**: Admin dashboard

---

## 💡 Quick Tips

- Always test in TEST environment first
- Use Adyen test cards for development
- Check webhook logs in Adyen Customer Area
- Enable console logging for debugging
- Keep API keys secret (never commit .env)

---

**Ready to accept payments! 💳✨**

Questions? Check `TESTING_GUIDE.md` or `README.md`







