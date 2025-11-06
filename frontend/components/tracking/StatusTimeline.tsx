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

