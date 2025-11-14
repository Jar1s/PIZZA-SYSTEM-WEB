'use client';

import { useEffect, useState } from 'react';
import { Order } from '@/shared';

interface DeliveryInfoProps {
  order: Order;
}

interface DeliveryDetails {
  id: string;
  status: string;
  trackingUrl: string | null;
  quote: {
    courierEta?: number;
  } | null;
  provider: string;
  jobId: string | null;
}

export function DeliveryInfo({ order }: DeliveryInfoProps) {
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order.deliveryId) return;

    const fetchDelivery = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/delivery/${order.deliveryId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch delivery details');
        }
        
        const data = await res.json();
        setDelivery(data);
      } catch (err) {
        console.error('Error fetching delivery:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();
  }, [order.deliveryId]);

  if (!order.deliveryId) return null;

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Loading delivery information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!delivery) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold mb-2">Delivery Information</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Status:</span>{' '}
          <span className="capitalize">{delivery.status.replace('_', ' ')}</span>
        </div>
        {delivery.trackingUrl && (
          <div>
            <span className="font-medium">Tracking:</span>{' '}
            <a
              href={delivery.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View tracking
            </a>
          </div>
        )}
        {delivery.quote?.courierEta && (
          <div>
            <span className="font-medium">Estimated arrival:</span>{' '}
            {delivery.quote.courierEta} minutes
          </div>
        )}
        <div>
          <span className="font-medium">Provider:</span>{' '}
          <span className="capitalize">{delivery.provider}</span>
        </div>
      </div>
    </div>
  );
}
