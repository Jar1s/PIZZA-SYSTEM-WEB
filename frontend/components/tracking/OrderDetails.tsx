'use client';

import { Order } from '@pizza-ecosystem/shared';

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

