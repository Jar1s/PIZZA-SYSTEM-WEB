'use client';

import { Order } from '@/shared';

interface DeliveryInfoProps {
  order: Order;
}

export function DeliveryInfo({ order }: DeliveryInfoProps) {
  // In real implementation, fetch delivery details from API using order.deliveryId
  if (!order.deliveryId) return null;
  
  // TODO: Fetch delivery details from API when needed
  // For now, return null if no deliveryId
  return null;
}
