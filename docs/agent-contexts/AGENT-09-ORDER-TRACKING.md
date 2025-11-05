# 🎯 AGENT 9: ORDER TRACKING PAGE (Customer-Facing)

You are Agent 9 building the public order tracking page where customers can see their order status in real-time.

## PROJECT CONTEXT
After placing an order, customers get a tracking link: `/track/{orderId}`. They can see order status, ETA, courier info (when available), and live updates.

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /frontend/app/track/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Public tracking page (no auth required)
2. Order status timeline
3. Real-time status updates (polling)
4. Courier tracking link (Wolt)
5. ETA display
6. Contact support button

## FILES TO CREATE

### 1. `/frontend/app/track/[orderId]/page.tsx`
```typescript
import { OrderTracker } from '@/components/tracking/OrderTracker';
import { getOrder } from '@/lib/api';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { orderId: string };
}

export default async function TrackingPage({ params }: PageProps) {
  let order;
  
  try {
    order = await getOrder(params.orderId);
  } catch (error) {
    notFound();
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <OrderTracker order={order} />
      </div>
    </main>
  );
}
```

### 2. `/frontend/lib/api.ts` (Add tracking function)
```typescript
// Add this function to existing api.ts

export async function getOrder(orderId: string): Promise<Order> {
  const res = await fetch(`${API_URL}/api/track/${orderId}`, {
    cache: 'no-store', // Always fresh data
  });
  
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}
```

### 3. `/frontend/components/tracking/OrderTracker.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Order, OrderStatus } from '@/shared';
import { getOrder } from '@/lib/api';
import { StatusTimeline } from './StatusTimeline';
import { OrderDetails } from './OrderDetails';
import { DeliveryInfo } from './DeliveryInfo';

interface OrderTrackerProps {
  order: Order;
}

export function OrderTracker({ order: initialOrder }: OrderTrackerProps) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Poll for updates every 15 seconds if order is active
    const isActive = ![OrderStatus.DELIVERED, OrderStatus.CANCELED].includes(order.status);
    
    if (!isActive) return;
    
    const interval = setInterval(async () => {
      try {
        const updated = await getOrder(order.id);
        setOrder(updated);
      } catch (error) {
        console.error('Failed to refresh order:', error);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [order.id, order.status]);

  const customer = order.customer as any;
  const address = order.address as any;

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-gray-600">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Placed on {new Date(order.createdAt).toLocaleString('sk-SK')}
        </p>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Status</h2>
        <StatusTimeline status={order.status} />
      </div>

      {/* Delivery Info (if applicable) */}
      {order.deliveryId && (
        <DeliveryInfo order={order} />
      )}

      {/* Order Details */}
      <OrderDetails order={order} />

      {/* Support */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 mb-4">
          Need help with your order?
        </p>
        <a
          href={`mailto:support@example.com?subject=Order ${order.id}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Contact Support
        </a>
        <p className="text-sm text-gray-500 mt-2">
          or call: +421 900 000 000
        </p>
      </div>
    </div>
  );
}
```

### 4. `/frontend/components/tracking/StatusTimeline.tsx`
```typescript
'use client';

import { OrderStatus } from '@/shared';

interface StatusTimelineProps {
  status: OrderStatus;
}

const STATUSES = [
  { key: OrderStatus.PENDING, label: 'Order Received', icon: '📝' },
  { key: OrderStatus.PAID, label: 'Payment Confirmed', icon: '💳' },
  { key: OrderStatus.PREPARING, label: 'Preparing', icon: '👨‍🍳' },
  { key: OrderStatus.READY, label: 'Ready', icon: '✅' },
  { key: OrderStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery', icon: '🚗' },
  { key: OrderStatus.DELIVERED, label: 'Delivered', icon: '🎉' },
];

export function StatusTimeline({ status }: StatusTimelineProps) {
  const currentIndex = STATUSES.findIndex(s => s.key === status);
  
  if (status === OrderStatus.CANCELED) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">❌</div>
        <div className="text-2xl font-bold text-red-600">Order Canceled</div>
        <p className="text-gray-600 mt-2">
          This order has been canceled. Contact support for details.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (STATUSES.length - 1)) * 100}%` }}
        />
      </div>

      {/* Status Steps */}
      <div className="relative flex justify-between">
        {STATUSES.map((step, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 transition-all ${
                  isComplete
                    ? 'bg-green-500 text-white scale-110'
                    : 'bg-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-green-300 animate-pulse' : ''}`}
              >
                {step.icon}
              </div>

              {/* Label */}
              <div
                className={`text-sm font-medium text-center ${
                  isComplete ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </div>

              {/* Time (if current) */}
              {isCurrent && (
                <div className="text-xs text-gray-500 mt-1">
                  In progress...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 5. `/frontend/components/tracking/DeliveryInfo.tsx`
```typescript
'use client';

import { Order } from '@/shared';

interface DeliveryInfoProps {
  order: Order;
}

export function DeliveryInfo({ order }: DeliveryInfoProps) {
  // In real implementation, fetch delivery details from API
  const delivery = order.delivery as any;
  
  if (!delivery) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
      
      {delivery.trackingUrl && (
        <div className="mb-4">
          <a
            href={delivery.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <span className="mr-2">📍</span>
            Track Courier Live
          </a>
        </div>
      )}
      
      {delivery.quote?.etaMinutes && (
        <div className="text-gray-600">
          <span className="font-semibold">Estimated Delivery:</span>{' '}
          {delivery.quote.etaMinutes} minutes
        </div>
      )}
      
      {delivery.status === 'courier_assigned' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="font-semibold text-blue-900">Courier Assigned</div>
          <div className="text-sm text-blue-700 mt-1">
            Your delivery courier is on the way to pick up your order!
          </div>
        </div>
      )}
      
      {delivery.status === 'picked_up' && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <div className="font-semibold text-purple-900">Order Picked Up</div>
          <div className="text-sm text-purple-700 mt-1">
            Your order is on the way to you!
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6. `/frontend/components/tracking/OrderDetails.tsx`
```typescript
'use client';

import { Order } from '@/shared';

interface OrderDetailsProps {
  order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const customer = order.customer as any;
  const address = order.address as any;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Order Details</h2>
      
      {/* Items */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Items</h3>
        <div className="space-y-2">
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between">
              <span>
                {item.quantity}x {item.productName}
              </span>
              <span className="font-semibold">
                €{(item.priceCents * item.quantity / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>€{(order.subtotalCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (20%)</span>
          <span>€{(order.taxCents / 100).toFixed(2)}</span>
        </div>
        {order.deliveryFeeCents > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Delivery Fee</span>
            <span>€{(order.deliveryFeeCents / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold border-t pt-2">
          <span>Total</span>
          <span>€{(order.totalCents / 100).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Delivery Address */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-2">Delivery Address</h3>
        <div className="text-gray-600">
          <div>{customer.name}</div>
          <div>{address.street}</div>
          <div>{address.city} {address.postalCode}</div>
          {address.instructions && (
            <div className="mt-2 text-sm italic">
              Note: {address.instructions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 7. `/frontend/app/track/[orderId]/not-found.tsx`
```typescript
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold mb-2">Order Not Found</h1>
        <p className="text-gray-600 mb-6">
          We couldn't find an order with this ID.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
```

### 8. Update Backend - Add Tracking Endpoint

Ensure this exists in `/backend/src/orders/orders.controller.ts`:
```typescript
// Public tracking endpoint (no auth)
@Controller('api/track')
export class TrackingController {
  constructor(private ordersService: OrdersService) {}

  @Get(':orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }
}
```

## DELIVERABLES CHECKLIST
- [ ] Public tracking page
- [ ] Status timeline with visual progress
- [ ] Real-time updates (15s polling)
- [ ] Delivery info (courier, tracking link)
- [ ] Order details display
- [ ] ETA display
- [ ] Not found page
- [ ] Contact support section

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 4 (orders API)
- ✅ Agent 7 (delivery info)

## WHEN TO START
⏳ **WAIT for Agent 4** (Agent 7 optional for basic tracking)

## TEST YOUR WORK
```bash
# Create an order first, then:
http://localhost:3000/track/{orderId}

# Should see:
# - Order status timeline
# - Order items and totals
# - Delivery address
# - Auto-refresh every 15s
```

## COMPLETION SIGNAL
Create `/frontend/app/track/AGENT-9-COMPLETE.md`:
```markdown
# Agent 9 Complete ✅

## What I Built
- Public order tracking page
- Visual status timeline with icons
- Real-time updates (15s polling)
- Delivery tracking link (Wolt)
- Order details display
- Responsive design
- Not found page

## Features
- No login required (public URL)
- Auto-refresh for active orders
- Visual progress indicator
- Courier tracking integration
- ETA display
- Contact support button

## Access
http://localhost:3000/track/{orderId}

## User Experience
1. Customer completes order
2. Receives tracking link via email/SMS (future)
3. Visits tracking page
4. Sees real-time status updates
5. Can track courier when out for delivery
6. Gets delivery confirmation
```

BEGIN when Agent 4 signals complete!


