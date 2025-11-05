'use client';

import { Order, OrderStatus } from '@/shared';
import { useState } from 'react';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-gray-200 text-gray-800',
  PAID: 'bg-blue-200 text-blue-800',
  PREPARING: 'bg-yellow-200 text-yellow-800',
  READY: 'bg-green-200 text-green-800',
  OUT_FOR_DELIVERY: 'bg-purple-200 text-purple-800',
  DELIVERED: 'bg-green-500 text-white',
  CANCELED: 'bg-red-200 text-red-800',
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PENDING: OrderStatus.PAID,
  PAID: OrderStatus.PREPARING,
  PREPARING: OrderStatus.READY,
  READY: OrderStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: OrderStatus.DELIVERED,
  DELIVERED: null,
  CANCELED: null,
};

export function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const customer = order.customer;
  const address = order.address;
  const nextStatus = NEXT_STATUS[order.status];
  
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-500">
              {order.id.slice(0, 8)}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </span>
            <span className="text-sm text-gray-600">
              {customer.name} • {customer.phone}
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            {order.items.length} items • €{(order.totalCents / 100).toFixed(2)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              → {nextStatus}
            </button>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Customer</div>
            <div>{customer.name}</div>
            <div>{customer.email}</div>
            <div>{customer.phone}</div>
          </div>
          
          <div>
            <div className="font-semibold mb-2">Delivery Address</div>
            <div>{address.street}</div>
            <div>{address.city} {address.postalCode}</div>
            {address.instructions && (
              <div className="text-gray-600 mt-1">Note: {address.instructions}</div>
            )}
          </div>
          
          <div className="col-span-2">
            <div className="font-semibold mb-2">Items</div>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.quantity}x {item.productName}</span>
                <span>€{(item.priceCents * item.quantity / 100).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>€{(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

