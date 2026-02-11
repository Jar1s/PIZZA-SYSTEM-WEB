'use client';

import { OrderStatus } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslations } from '@/lib/translations';

interface StatusTimelineProps {
  status: OrderStatus;
  paymentStatus?: string | null;
}

export function StatusTimeline({ status, paymentStatus }: StatusTimelineProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  
  // Check if this is delivery payment (cash/card on delivery)
  const isDeliveryPayment = paymentStatus === 'pending';
  
  // Online payment flow: Payment → Confirmation → Preparation → ...
  const STATUSES_ONLINE = [
    { 
      key: OrderStatus.PENDING, 
      label: language === 'sk' ? 'Čaká na platbu' : 'Waiting for payment',
      icon: '💳', 
      description: language === 'sk' ? 'Objednávka prijatá, čaká sa na platbu' : 'Order received, waiting for payment'
    },
    { 
      key: OrderStatus.PAID, 
      label: language === 'sk' ? 'Zaplatené' : 'Paid',
      icon: '💳', 
      description: language === 'sk' ? 'Platba úspešná' : 'Payment successful'
    },
    { 
      key: OrderStatus.PREPARING, 
      label: t.orderStatusPreparing, 
      icon: '👨‍🍳', 
      description: t.orderStatusPreparingDesc 
    },
    { 
      key: OrderStatus.OUT_FOR_DELIVERY, 
      label: t.orderStatusOutForDelivery, 
      icon: '🚗', 
      description: t.orderStatusOutForDeliveryDesc 
    },
    { 
      key: OrderStatus.DELIVERED, 
      label: t.orderStatusDelivered, 
      icon: '🎉', 
      description: t.orderStatusDeliveredDesc 
    },
  ];
  
  // Delivery payment flow: Confirmation → Preparation → ... (no payment step)
  const STATUSES_DELIVERY = [
    { 
      key: OrderStatus.PENDING, 
      label: language === 'sk' ? 'Čaká na potvrdenie' : 'Waiting for confirmation',
      icon: '⏳', 
      description: language === 'sk' ? 'Objednávka čaká na potvrdenie operátora' : 'Order is waiting for operator confirmation'
    },
    { 
      key: OrderStatus.PAID, 
      label: language === 'sk' ? 'Potvrdené' : 'Confirmed',
      icon: '✅', 
      description: language === 'sk' ? 'Objednávka potvrdená' : 'Order confirmed'
    },
    { 
      key: OrderStatus.PREPARING, 
      label: t.orderStatusPreparing, 
      icon: '👨‍🍳', 
      description: t.orderStatusPreparingDesc 
    },
    { 
      key: OrderStatus.OUT_FOR_DELIVERY, 
      label: t.orderStatusOutForDelivery, 
      icon: '🚗', 
      description: t.orderStatusOutForDeliveryDesc 
    },
    { 
      key: OrderStatus.DELIVERED, 
      label: t.orderStatusDelivered, 
      icon: '🎉', 
      description: t.orderStatusDeliveredDesc 
    },
  ];
  
  // Select the appropriate flow based on payment type
  const STATUSES = isDeliveryPayment ? STATUSES_DELIVERY : STATUSES_ONLINE;
  
  // Handle READY status for backward compatibility (map to OUT_FOR_DELIVERY for display)
  let displayStatus = status;
  if (status === OrderStatus.READY) {
    displayStatus = OrderStatus.OUT_FOR_DELIVERY;
  }
  
  // For online payment: if status is PAID but not yet PREPARING, show as "waiting for confirmation"
  // This is handled by showing PAID step as current
  const currentIndex = STATUSES.findIndex(s => s.key === displayStatus);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : STATUSES.findIndex(s => s.key === status);
  
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
    <>
      {/* Mobile: Vertical timeline for readability */}
      <div className="md:hidden">
        {STATUSES.map((step, index) => {
          const isComplete = index <= effectiveIndex;
          const isCurrent = index === effectiveIndex;
          const isLast = index === STATUSES.length - 1;

          return (
            <div key={step.key} className="relative pl-14 pb-5 last:pb-0">
              {!isLast && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-[calc(100%-2rem)] ${
                    index < effectiveIndex ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                />
              )}

              <div
                className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  isComplete ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}
              >
                {step.icon}
              </div>

              <div className={`text-base font-semibold leading-tight ${isComplete ? 'text-white' : 'text-gray-400'}`}>
                {step.label}
              </div>
              <div className={`text-sm leading-snug mt-1 ${isComplete ? 'text-gray-300' : 'text-gray-500'}`}>
                {step.description}
              </div>

              {isCurrent && (
                <div className="text-green-300 text-[11px] uppercase tracking-wide font-semibold mt-1">
                  {language === 'sk' ? 'Aktuálny krok' : 'Current step'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet: Horizontal timeline */}
      <div className="hidden md:block relative">
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
              <div key={step.key} className="flex flex-col items-center flex-1 px-1">
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
    </>
  );
}
