# Order Tracking - Testing Guide

## Quick Test

### 1. Start the Services
Make sure both backend and frontend are running:

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Create a Test Order

1. Go to `http://localhost:3000`
2. Add items to cart
3. Proceed to checkout
4. Fill in customer details
5. Complete the order
6. **Copy the Order ID** from the success page

### 3. Test the Tracking Page

Visit: `http://localhost:3000/track/{YOUR_ORDER_ID}`

Example: `http://localhost:3000/track/cm2x1y2z3a4b5c6d7e8f9g0h1`

### 4. What to Verify

#### ✅ Status Timeline
- [ ] Timeline displays all 6 stages
- [ ] Current status is highlighted (green + pulsing animation)
- [ ] Progress bar fills to current status
- [ ] Past statuses are marked complete
- [ ] Future statuses are grayed out

#### ✅ Order Details
- [ ] Order ID displayed (first 8 chars uppercase)
- [ ] Order date formatted in Slovak locale
- [ ] All order items listed with quantities
- [ ] Prices calculated correctly
- [ ] Tax shown (20%)
- [ ] Delivery fee shown (if applicable)
- [ ] Total amount correct

#### ✅ Delivery Address
- [ ] Customer name displayed
- [ ] Street address shown
- [ ] City and postal code visible
- [ ] Delivery instructions shown (if provided)

#### ✅ Real-time Updates
- [ ] Page auto-refreshes every 15 seconds
- [ ] Status changes appear automatically
- [ ] Polling stops when order is delivered/canceled

#### ✅ Delivery Information (if delivery exists)
- [ ] Courier tracking link displayed
- [ ] ETA shown in minutes
- [ ] Status badges appear (courier assigned, picked up)

#### ✅ Error Handling
- [ ] Invalid order ID shows not-found page
- [ ] Not-found page has working "Back to Home" link

#### ✅ Contact Support
- [ ] Email link works with pre-filled subject
- [ ] Phone number displayed

### 5. Test Status Changes

Use the admin dashboard or backend API to change order status:

```bash
# Update order status
curl -X PATCH http://localhost:3000/api/demo-restaurant/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

Wait 15 seconds and watch the tracking page update automatically.

### 6. Test Canceled Orders

```bash
curl -X PATCH http://localhost:3000/api/demo-restaurant/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CANCELED"}'
```

The page should show the canceled status with red styling.

## Browser Testing

Test on multiple devices/browsers:
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Desktop Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Performance Testing

- [ ] Page loads in < 2 seconds
- [ ] Polling doesn't cause memory leaks
- [ ] No console errors
- [ ] Smooth animations

## Edge Cases

1. **Very long order ID**: Test display truncation
2. **Many items**: Ensure scrolling works
3. **No delivery**: Check DeliveryInfo doesn't show
4. **Special characters in customer name/address**: Test encoding
5. **Network failure**: Check error handling in polling

## API Endpoints Used

- `GET /api/track/:orderId` - Fetch order details (public, no auth)

## Common Issues

### Order not found
- Check order ID is correct
- Verify backend is running
- Check network tab for 404 response

### No auto-refresh
- Check browser console for errors
- Verify order status is not DELIVERED or CANCELED
- Check polling interval (should be 15000ms)

### Styling issues
- Verify Tailwind CSS is compiled
- Check for conflicting styles
- Test on different screen sizes

## Next Steps After Testing

If everything works:
1. ✅ Mark Agent 9 as complete
2. Move to Agent 10 (DevOps) if needed
3. Consider WebSocket upgrade for instant updates
4. Implement email/SMS with tracking links

---

Happy Testing! 🎉







