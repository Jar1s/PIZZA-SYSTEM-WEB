'use client';

import { Order } from '@pizza-ecosystem/shared';

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

