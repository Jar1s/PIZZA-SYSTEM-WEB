'use client';

import { useEffect, useState, useRef } from 'react';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
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
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const POLL_INTERVAL_MS = 10000;
  const MIN_FETCH_GAP_MS = 2000;

  useEffect(() => {
    // Poll for updates every 10 seconds so customer sees admin status changes quickly.
    const isActive = ![OrderStatus.DELIVERED, OrderStatus.CANCELED].includes(order.status);
    
    if (!isActive) return;
    
    const interval = setInterval(async () => {
      // Prevent concurrent requests
      if (isFetchingRef.current) {
        return;
      }

      // Throttle: don't fetch if last fetch was less than 2 seconds ago
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      if (timeSinceLastFetch < MIN_FETCH_GAP_MS) {
        return;
      }
      
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      try {
        const updated = await getOrder(order.id);
        setOrder(updated);
      } catch (error) {
        console.error('Failed to refresh order:', error);
      } finally {
        isFetchingRef.current = false;
      }
    }, POLL_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [order.id, order.status, MIN_FETCH_GAP_MS, POLL_INTERVAL_MS]);

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
          or call: 0914 363 363
        </p>
      </div>
    </div>
  );
}
