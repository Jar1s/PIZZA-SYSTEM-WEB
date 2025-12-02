'use client';

import { OrderStatus } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslations } from '@/lib/translations';

interface StatusTimelineProps {
  status: OrderStatus;
}

export function StatusTimeline({ status }: StatusTimelineProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  // Updated flow: Removed READY status
  const STATUSES = [
    { key: OrderStatus.PENDING, label: t.orderStatusPending, icon: '📝', description: t.orderStatusPendingDesc },
    { key: OrderStatus.PAID, label: t.orderStatusPaid, icon: '💳', description: t.orderStatusPaidDesc },
    { key: OrderStatus.PREPARING, label: t.orderStatusPreparing, icon: '👨‍🍳', description: t.orderStatusPreparingDesc },
    { key: OrderStatus.OUT_FOR_DELIVERY, label: t.orderStatusOutForDelivery, icon: '🚗', description: t.orderStatusOutForDeliveryDesc },
    { key: OrderStatus.DELIVERED, label: t.orderStatusDelivered, icon: '🎉', description: t.orderStatusDeliveredDesc },
  ];
  
  const currentIndex = STATUSES.findIndex(s => s.key === status);
  
  // Handle READY status for backward compatibility (map to OUT_FOR_DELIVERY for display)
  let displayStatus = status;
  if (status === OrderStatus.READY) {
    displayStatus = OrderStatus.OUT_FOR_DELIVERY;
  }
  const displayIndex = STATUSES.findIndex(s => s.key === displayStatus);
  const effectiveIndex = displayIndex >= 0 ? displayIndex : currentIndex;
  
  if (status === OrderStatus.CANCELED) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">❌</div>
        <div className="text-2xl font-bold text-red-500">{t.orderStatusCanceled}</div>
        <p className="text-gray-400 mt-2">
          {language === 'sk' 
            ? 'Táto objednávka bola zrušená. Pre viac informácií nás kontaktujte.'
            : 'This order has been canceled. Contact support for details.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${(effectiveIndex / (STATUSES.length - 1)) * 100}%` }}
        />
      </div>

      {/* Status Steps */}
      <div className="relative flex justify-between">
        {STATUSES.map((step, index) => {
          const isComplete = index <= effectiveIndex;
          const isCurrent = index === effectiveIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 transition-all ${
                  isComplete
                    ? 'bg-green-500 text-white scale-110'
                    : 'bg-gray-700 text-gray-500'
                } ${isCurrent ? 'ring-4 ring-green-400 ring-opacity-50 animate-pulse' : ''}`}
              >
                {step.icon}
              </div>

              {/* Label */}
              <div
                className={`text-sm font-medium text-center mb-1 ${
                  isComplete ? 'text-white' : 'text-gray-500'
                }`}
              >
                {step.label}
              </div>

              {/* Description */}
              <div
                className={`text-xs text-center ${
                  isComplete ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {step.description}
              </div>

              {/* Checkmark for completed */}
              {isComplete && !isCurrent && (
                <div className="text-green-500 text-lg mt-1">✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

