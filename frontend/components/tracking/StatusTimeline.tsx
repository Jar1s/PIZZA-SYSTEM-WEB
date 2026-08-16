'use client';

import { OrderStatus } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslations } from '@/lib/translations';

interface StatusTimelineProps {
  status: OrderStatus;
  paymentStatus?: string | null;
  primaryColor?: string;
  isDark?: boolean;
}

type StepIcon = 'card' | 'check' | 'oven' | 'box' | 'bike' | 'flag' | 'clock';

/** Line icons in the brand color instead of emoji — consistent across OS/browsers. */
function Icon({ name, color, size = 22 }: { name: StepIcon; color: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'card':
      return (<svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>);
    case 'check':
      return (<svg {...common}><polyline points="20 6 9 17 4 12" /></svg>);
    case 'oven':
      return (<svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><rect x="7" y="12" width="10" height="5" rx="1" /></svg>);
    case 'box':
      return (<svg {...common}><path d="M21 8l-9-4-9 4 9 4 9-4z" /><path d="M3 8v8l9 4 9-4V8" /><line x1="12" y1="12" x2="12" y2="20" /></svg>);
    case 'bike':
      return (<svg {...common}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-8h5l3 8" /><path d="M10 9l2 8" /></svg>);
    case 'flag':
      return (<svg {...common}><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></svg>);
    case 'clock':
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>);
  }
}

export function StatusTimeline({ status, paymentStatus, primaryColor = '#E91E63', isDark = true }: StatusTimelineProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  const sk = language === 'sk';
  const isDeliveryPayment = paymentStatus === 'pending';

  const tail = [
    { key: OrderStatus.PREPARING, label: t.orderStatusPreparing, icon: 'oven' as StepIcon, description: t.orderStatusPreparingDesc },
    { key: OrderStatus.READY, label: t.orderStatusReady, icon: 'box' as StepIcon, description: t.orderStatusReadyDesc },
    { key: OrderStatus.OUT_FOR_DELIVERY, label: t.orderStatusOutForDelivery, icon: 'bike' as StepIcon, description: t.orderStatusOutForDeliveryDesc },
    { key: OrderStatus.DELIVERED, label: t.orderStatusDelivered, icon: 'flag' as StepIcon, description: t.orderStatusDeliveredDesc },
  ];

  const STATUSES = isDeliveryPayment
    ? [
        { key: OrderStatus.PENDING, label: sk ? 'Čaká na potvrdenie' : 'Awaiting confirmation', icon: 'clock' as StepIcon, description: sk ? 'Objednávku potvrdí operátor' : 'An operator will confirm your order' },
        { key: OrderStatus.PAID, label: sk ? 'Potvrdené' : 'Confirmed', icon: 'check' as StepIcon, description: sk ? 'Objednávka potvrdená' : 'Order confirmed' },
        ...tail,
      ]
    : [
        { key: OrderStatus.PENDING, label: sk ? 'Objednané' : 'Ordered', icon: 'card' as StepIcon, description: sk ? 'Objednávka prijatá' : 'Order received' },
        { key: OrderStatus.PAID, label: sk ? 'Zaplatené' : 'Paid', icon: 'check' as StepIcon, description: sk ? 'Platba prijatá' : 'Payment received' },
        ...tail,
      ];

  const currentIndex = STATUSES.findIndex((s) => s.key === status);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  const inactiveDot = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inactiveInk = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const strong = isDark ? 'text-white' : 'text-zinc-900';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const faint = isDark ? 'text-zinc-600' : 'text-zinc-400';
  const track = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  if (status === OrderStatus.CANCELED) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <div className={`text-2xl font-bold ${strong}`}>{t.orderStatusCanceled}</div>
        <p className={`${muted} mt-2`}>
          {sk ? 'Táto objednávka bola zrušená. Ak máte otázky, ozvite sa nám.' : 'This order has been canceled. Contact us if you have questions.'}
        </p>
      </div>
    );
  }

  const dot = (isComplete: boolean, isCurrent: boolean, icon: StepIcon, size: 'sm' | 'lg') => {
    const px = size === 'lg' ? 56 : 40;
    return (
      <div
        className="relative flex items-center justify-center rounded-full transition-all"
        style={{
          width: px,
          height: px,
          backgroundColor: isComplete ? primaryColor : inactiveDot,
          boxShadow: isCurrent ? `0 0 0 6px ${primaryColor}33` : undefined,
        }}
      >
        <Icon name={icon} color={isComplete ? '#fff' : inactiveInk} size={size === 'lg' ? 24 : 18} />
        {isCurrent && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-40"
            style={{ backgroundColor: primaryColor, animationDuration: '2.4s' }}
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile: vertical */}
      <ol className="md:hidden" aria-label={sk ? 'Priebeh objednávky' : 'Order progress'}>
        {STATUSES.map((step, index) => {
          const isComplete = index <= effectiveIndex;
          const isCurrent = index === effectiveIndex;
          const isLast = index === STATUSES.length - 1;
          return (
            <li key={step.key} className="relative pl-14 pb-6 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
              {!isLast && (
                <div
                  className="absolute left-5 top-10 w-0.5 h-[calc(100%-1.75rem)]"
                  style={{ backgroundColor: index < effectiveIndex ? primaryColor : track }}
                />
              )}
              <div className="absolute left-0 top-0">{dot(isComplete, isCurrent, step.icon, 'sm')}</div>
              <div className={`text-base font-semibold leading-tight ${isComplete ? strong : muted}`}>{step.label}</div>
              <div className={`text-sm leading-snug mt-1 ${isComplete ? muted : faint}`}>{step.description}</div>
              {isCurrent && (
                <div className="text-[11px] uppercase tracking-[0.16em] font-bold mt-1.5" style={{ color: primaryColor }}>
                  {sk ? 'Aktuálny krok' : 'Current step'}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Desktop: horizontal */}
      <div className="hidden md:block relative" role="list" aria-label={sk ? 'Priebeh objednávky' : 'Order progress'}>
        <div className="absolute top-7 left-7 right-7 h-0.5" style={{ backgroundColor: track }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${(effectiveIndex / (STATUSES.length - 1)) * 100}%`, backgroundColor: primaryColor }}
          />
        </div>
        <div className="relative flex justify-between">
          {STATUSES.map((step, index) => {
            const isComplete = index <= effectiveIndex;
            const isCurrent = index === effectiveIndex;
            return (
              <div key={step.key} role="listitem" aria-current={isCurrent ? 'step' : undefined} className="flex flex-col items-center flex-1 px-1">
                <div className="mb-3">{dot(isComplete, isCurrent, step.icon, 'lg')}</div>
                <div className={`text-sm font-semibold text-center mb-1 ${isComplete ? strong : muted}`} style={{ textWrap: 'balance' } as any}>
                  {step.label}
                </div>
                <div className={`text-xs text-center leading-snug ${isComplete ? muted : faint}`}>{step.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
