'use client';

import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { useEffect, useState } from 'react';
import { getFormattedModifierLines } from '@/lib/format-modifiers';
import {
  syncOrderToStoryous,
  createWoltDelivery,
  cancelWoltDelivery,
  rebookWoltDelivery,
  checkWoltDeliveryArea,
  refundOrder,
  WoltAreaCheckResult,
} from '@/lib/api';
import { formatWoltStatus } from '@/lib/wolt-status';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateOrderItemPrice } from '@/lib/calculate-order-item-price';
import { getTranslations } from '@/lib/translations';
import { useToastContext } from '@/contexts/ToastContext';
import {
  InspectorAccordion,
  InspectorSection,
} from './OrderInspectorPrimitives';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onOrderRefresh?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: (orderId: string) => void;
  tenantSlug?: string;
  showToggle?: boolean;
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

// Active flow: PENDING → PAID (automatic) → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED (automatic)
// PAID is automatic via webhook, DELIVERED is automatic via Wolt webhook or time-based

/** "Okraj: Cesnakom" → light "Okraj:" + bold "Cesnakom" so the eye lands on what goes on the pizza. */
function ModifierLabel({ label }: { label: string }) {
  const idx = label.indexOf(':');
  if (idx === -1) return <span className="font-bold">{label}</span>;
  return (
    <>
      <span className="font-medium text-zinc-500">{label.slice(0, idx + 1)}</span>{' '}
      <span className="font-bold text-zinc-900">{label.slice(idx + 1).trim()}</span>
    </>
  );
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PENDING: null, // PAID is automatic via payment webhook
  PAID: OrderStatus.PREPARING,
  PREPARING: OrderStatus.READY,
  READY: OrderStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: null, // DELIVERED is automatic
  DELIVERED: null,
  CANCELED: null,
};

interface TimelineStepConfig {
  key: OrderStatus;
  icon: string;
}

const ONLINE_TIMELINE_STEPS: TimelineStepConfig[] = [
  { key: OrderStatus.PENDING, icon: '💳' },
  { key: OrderStatus.PAID, icon: '💰' },
  { key: OrderStatus.PREPARING, icon: '👨‍🍳' },
  { key: OrderStatus.READY, icon: '📦' },
  { key: OrderStatus.OUT_FOR_DELIVERY, icon: '🚗' },
  { key: OrderStatus.DELIVERED, icon: '🎉' },
];

const DELIVERY_TIMELINE_STEPS: TimelineStepConfig[] = [
  { key: OrderStatus.PENDING, icon: '⏳' },
  { key: OrderStatus.PAID, icon: '✅' },
  { key: OrderStatus.PREPARING, icon: '👨‍🍳' },
  { key: OrderStatus.READY, icon: '📦' },
  { key: OrderStatus.OUT_FOR_DELIVERY, icon: '🚗' },
  { key: OrderStatus.DELIVERED, icon: '🎉' },
];

const BRAND_LABELS: Record<string, string> = {
  pornopizza: 'Porno Pizza',
  partypizza: 'Party Pizza',
  pizzavnudzi: 'Pizza v Nudzi',
};

type StoryousMessageTone = 'success' | 'warning' | 'error';

type StoryousStatusMeta = {
  badgeClassName: string;
  badgeLabel: string;
  detailClassName: string;
  detailText: string;
};

type DispatchActionConfig = {
  label: string;
  onClick: () => void;
  icon?: string;
  title?: string;
};

const normalizeStoryousState = (state: string | null | undefined): string | null => {
  const normalized = String(state || '').trim().toUpperCase();
  return normalized || null;
};

const isAcceptedStoryousState = (state: string | null | undefined): boolean =>
  state === 'CONFIRMED' || state === 'SCHEDULING_DELIVERY' || state === 'DISPATCHED';

const KITCHEN_SYNC_REQUIRED_STATUSES = new Set<OrderStatus>([
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
]);

const getStoryousStatusMeta = (order: Order): StoryousStatusMeta | null => {
  if (!order.storyousOrderId) {
    if (KITCHEN_SYNC_REQUIRED_STATUSES.has(order.status)) {
      return {
        badgeClassName: 'border border-red-200 bg-red-100 text-red-800',
        badgeLabel: '⚠ NIE JE V KUCHYNI',
        detailClassName: 'border border-red-200 bg-red-50 text-red-800',
        detailText:
          '❌ Storyous sync chýba. Kuchyňa túto objednávku pravdepodobne nevidí. Klikni Storyous sync alebo rieš objednávku ručne.',
      };
    }

    return null;
  }

  const storyousState = normalizeStoryousState(order.storyousOrderState);

  if (isAcceptedStoryousState(storyousState)) {
    return {
      badgeClassName: 'bg-green-100 text-green-800',
      badgeLabel: '📦 Storyous',
      detailClassName: 'bg-green-50 text-green-800',
      detailText: `✅ Storyous confirmed (ID: ${order.storyousOrderId})`,
    };
  }

  if (storyousState === 'NEW') {
    return {
      badgeClassName: 'bg-amber-100 text-amber-800',
      badgeLabel: '📦 Storyous: čaká',
      detailClassName: 'bg-amber-50 text-amber-800',
      detailText: `⚠️ Storyous order exists, but still requires manual acceptance (ID: ${order.storyousOrderId})`,
    };
  }

  if (storyousState === 'DECLINED' || storyousState === 'VERIFICATION_FAILED') {
    return {
      badgeClassName: 'bg-red-100 text-red-800',
      badgeLabel: '📦 Storyous: problém',
      detailClassName: 'bg-red-50 text-red-800',
      detailText:
        storyousState === 'DECLINED'
          ? `❌ Storyous declined the order (ID: ${order.storyousOrderId})`
          : `❌ Storyous order exists, but confirmation could not be verified (ID: ${order.storyousOrderId})`,
    };
  }

  return {
    badgeClassName: 'bg-gray-100 text-gray-700',
    badgeLabel: '📦 Storyous',
    detailClassName: 'bg-gray-100 text-gray-700',
    detailText: `📦 Storyous order exists (ID: ${order.storyousOrderId}), state unknown`,
  };
};

export function OrderCard({
  order,
  onStatusUpdate,
  onOrderRefresh,
  isExpanded = false,
  onToggleExpand,
  tenantSlug,
  showToggle = true,
}: OrderCardProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  // Use prop if provided, otherwise fall back to local state for backward compatibility
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = onToggleExpand ? isExpanded : isExpanded || localExpanded;
  const handleToggle = onToggleExpand 
    ? () => onToggleExpand(order.id)
    : () => setLocalExpanded(!localExpanded);
  
  const [syncingStoryous, setSyncingStoryous] = useState(false);
  const [storyousMessage, setStoryousMessage] = useState<string | null>(null);
  const [storyousMessageTone, setStoryousMessageTone] = useState<StoryousMessageTone | null>(null);
  const [creatingWolt, setCreatingWolt] = useState(false);
  const [rebookingWolt, setRebookingWolt] = useState(false);
  const [woltMessage, setWoltMessage] = useState<string | null>(null);
  const [cancelingWolt, setCancelingWolt] = useState(false);
  const [woltPreparationMinutes, setWoltPreparationMinutes] = useState<number>(20);
  const woltPreparationQuickOptions = [10, 15, 20, 25, 30, 40];
  const [woltAreaCheck, setWoltAreaCheck] = useState<WoltAreaCheckResult | null>(null);
  const [checkingWoltArea, setCheckingWoltArea] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [clientPanelOpen, setClientPanelOpen] = useState(false);
  const [retryingRefund, setRetryingRefund] = useState(false);
  const [refundOverride, setRefundOverride] = useState<{ status: string | null; error: string | null } | null>(null);
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToastContext();
  
  const customer = order.customer;
  const address = order.address;
  const nextStatus = NEXT_STATUS[order.status];
  const hasStoryousOrder = !!order.storyousOrderId;
  const storyousStatusMeta = getStoryousStatusMeta(order);
  const hasDelivery = !!order.deliveryId || !!order.delivery;
  const isWoltDelivery = order.delivery?.provider === 'wolt';
  const woltDelivery = isWoltDelivery ? order.delivery : null;
  const customizationLabels = (order as any)?.tenant?.theme?.customizationLabels;

  // Refund tracking for canceled online-paid orders (GoPay auto-refund)
  const isPaidOnlinePayment =
    order.paymentStatus?.toLowerCase() === 'success' &&
    !!order.paymentRef &&
    !order.paymentRef.startsWith('cod:');
  const refundStatus = refundOverride ? refundOverride.status : (order.refundStatus ?? null);
  const refundError = refundOverride ? refundOverride.error : (order.refundError ?? null);
  const showRefundInfo = order.status === OrderStatus.CANCELED && (!!refundStatus || isPaidOnlinePayment);
  const canRetryRefund =
    showRefundInfo &&
    (refundStatus === 'refund_failed' || refundStatus === 'partially_refunded' || !refundStatus);

  const handleRetryRefund = async () => {
    setRetryingRefund(true);
    try {
      const result = await refundOrder(order.id);
      setRefundOverride({ status: result.refundStatus, error: result.refundError });
      if (result.refundStatus === 'refund_pending' || result.refundStatus === 'refunded') {
        toastSuccess(language === 'sk' ? 'Refund odoslaný do GoPay' : 'Refund submitted to GoPay');
      } else {
        toastError(result.refundError || (language === 'sk' ? 'Refund zlyhal' : 'Refund failed'));
      }
      onOrderRefresh?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRefundOverride({ status: 'refund_failed', error: message });
      toastError(message);
    } finally {
      setRetryingRefund(false);
    }
  };

  const refundInfo = !showRefundInfo ? null : (
    <div
      className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
        refundStatus === 'refunded'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : refundStatus === 'refund_pending' || refundStatus === 'partially_refunded'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-red-300 bg-red-100 text-red-800'
      }`}
    >
      <div className="font-semibold">
        {refundStatus === 'refunded'
          ? (language === 'sk' ? '✓ Peniaze vrátené zákazníkovi' : '✓ Payment refunded')
          : refundStatus === 'partially_refunded'
            ? (language === 'sk'
                ? '⚠ Platba vrátená len čiastočne — skontrolujte v GoPay administrácii'
                : '⚠ Payment only partially refunded — check GoPay admin')
            : refundStatus === 'refund_pending'
              ? (language === 'sk' ? 'Refund odoslaný do GoPay — čaká na potvrdenie' : 'Refund sent to GoPay — awaiting confirmation')
              : refundStatus === 'refund_failed'
                ? (language === 'sk' ? '⚠ Refund ZLYHAL — peniaze neboli vrátené' : '⚠ Refund FAILED — payment not returned')
                : (language === 'sk' ? 'Refund nebol iniciovaný' : 'Refund not initiated')}
      </div>
      {refundStatus === 'refund_failed' && refundError && (
        <div className="mt-1 break-words">{refundError}</div>
      )}
      {canRetryRefund && (
        <button
          onClick={handleRetryRefund}
          disabled={retryingRefund}
          className="mt-2 rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {retryingRefund
            ? (language === 'sk' ? 'Odosielam…' : 'Submitting…')
            : (language === 'sk' ? 'Vrátiť peniaze (GoPay)' : 'Refund payment (GoPay)')}
        </button>
      )}
    </div>
  );

  useEffect(() => {
    if (!isWoltDelivery) return;

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, [isWoltDelivery, order.id]);

  useEffect(() => {
    setClientPanelOpen(false);
    setRefundOverride(null);
  }, [order.id]);

  const tenantSlugForAreaCheck =
    tenantSlug || (order as any)?.tenant?.slug || (order as any)?.tenant?.subdomain || '';

  const shouldRunAreaCheck =
    !hasDelivery &&
    (order.status === OrderStatus.PAID ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY) &&
    Boolean(tenantSlugForAreaCheck) &&
    Boolean(address?.street) &&
    Boolean(address?.city) &&
    Boolean(address?.postalCode);

  useEffect(() => {
    if (!shouldRunAreaCheck) {
      setWoltAreaCheck(null);
      setCheckingWoltArea(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setCheckingWoltArea(true);
      try {
        const result = await checkWoltDeliveryArea(tenantSlugForAreaCheck, address as Record<string, any>);
        if (!cancelled) {
          setWoltAreaCheck(result);
        }
      } catch (error: any) {
        if (!cancelled) {
          setWoltAreaCheck({
            insideArea: null,
            source: 'fallback',
            reason: error?.message || 'Nepodarilo sa overiť Wolt zónu.',
          });
        }
      } finally {
        if (!cancelled) {
          setCheckingWoltArea(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [shouldRunAreaCheck, tenantSlugForAreaCheck, address, order.id, order.status]);
  
  // Show Storyous/Wolt buttons only while in PAID/PREPARING and not yet created
  const canSyncToStoryous = !hasStoryousOrder && (
    order.status === OrderStatus.PAID ||
    order.status === OrderStatus.PREPARING
  );
  const canCancelAnytime = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED;
  // Helper function to check if payment is on delivery (cash/card on delivery)
  // Normalized check: case-insensitive, handles null/undefined
  const isDeliveryPayment = (): boolean => {
    const status = order.paymentStatus?.toLowerCase();
    return status === 'pending';
  };
  
  // Helper function to determine if next status button should be shown
  // Hide button only if nextStatus would be PAID for delivery payment orders
  // For PAID orders with delivery payment, nextStatus is PREPARING, so button should be shown
  const shouldShowNextStatusButton = (): boolean => {
    if (!nextStatus) return false;
    // Only hide if nextStatus would be PAID (which shouldn't happen based on NEXT_STATUS, but check for safety)
    if (nextStatus === OrderStatus.PAID && isDeliveryPayment()) {
      return false; // Hide "→ PAID" button for delivery payment - payment is handled at delivery
    }
    return true;
  };
  
  const isDeliveryPaymentValue = isDeliveryPayment();
  const isPendingDelivery = order.status === OrderStatus.PENDING && isDeliveryPaymentValue;
  const isPendingOnline = order.status === OrderStatus.PENDING && !isDeliveryPaymentValue;
  const isPaidOnline = order.status === OrderStatus.PAID && !isDeliveryPaymentValue;
  const isPaid = order.status === OrderStatus.PAID;
  const isPending = order.status === OrderStatus.PENDING;
  const canCreateWolt =
    !hasDelivery &&
    (order.status === OrderStatus.PAID || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY);
  const canRebookWolt =
    isWoltDelivery &&
    (order.status === OrderStatus.PAID || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY);
  const canAdjustWoltPreparation = canCreateWolt || canRebookWolt;
  const isOutsideWoltArea = woltAreaCheck?.insideArea === false;
  const woltAreaBlockReason = isOutsideWoltArea
    ? woltAreaCheck?.reason || 'Adresa zákazníka je mimo doručovacej zóny Wolt.'
    : null;
  const canCreateWoltEffective = canCreateWolt && !isOutsideWoltArea;
  const canCancelWolt =
    isWoltDelivery &&
    (order.status === OrderStatus.PAID ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY);
  // Show cancel for anything except delivered/canceled
  const canShowCancel = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED;
  // Desktop already has specialized reject/cancel buttons for some states.
  // Show this backdoor cancel only where a cancel button is otherwise missing.
  const showDesktopBackdoorCancel = canShowCancel && !isPendingDelivery && !isPendingOnline && !isPaidOnline;

  const parseOptionalNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const woltQuote = (woltDelivery?.quote as Record<string, unknown> | null | undefined) || null;
  const woltPickupEtaMinutes =
    parseOptionalNumber(woltQuote?.pickupEtaMinutes) ??
    parseOptionalNumber(woltQuote?.courierPickupEta) ??
    parseOptionalNumber(woltQuote?.courierEta);
  const woltDropoffEtaMinutes =
    parseOptionalNumber(woltQuote?.dropoffEtaMinutes) ??
    parseOptionalNumber(woltQuote?.etaMinutes);
  const etaReferenceMs = new Date(order.updatedAt as unknown as string | Date).getTime();
  const woltPickupEtaRemainingMinutes =
    woltPickupEtaMinutes != null
      ? Math.max(0, Math.ceil((etaReferenceMs + woltPickupEtaMinutes * 60000 - nowMs) / 60000))
      : null;
  const woltDropoffEtaRemainingMinutes =
    woltDropoffEtaMinutes != null
      ? Math.max(0, Math.ceil((etaReferenceMs + woltDropoffEtaMinutes * 60000 - nowMs) / 60000))
      : null;
  const woltFeeCents = parseOptionalNumber(woltQuote?.feeCents);
  const orderDeliveryFeeCents = parseOptionalNumber(order.deliveryFeeCents);
  // Single source of truth for UI: what customer is charged on the order.
  const displayedDeliveryFeeCents = orderDeliveryFeeCents ?? woltFeeCents;
  const showPickupEtaInAdminHeader =
    woltPickupEtaRemainingMinutes != null &&
    woltPickupEtaRemainingMinutes > 0 &&
    [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY].includes(order.status);
  const woltPickupEtaRounded = showPickupEtaInAdminHeader ? woltPickupEtaRemainingMinutes : null;

  const timelineSteps = isDeliveryPaymentValue ? DELIVERY_TIMELINE_STEPS : ONLINE_TIMELINE_STEPS;
  const timelineStatus = order.status;
  const currentTimelineIndex = Math.max(
    timelineSteps.findIndex((step) => step.key === timelineStatus),
    0,
  );
  const timelineProgressWidth =
    timelineSteps.length > 1
      ? `${(currentTimelineIndex / (timelineSteps.length - 1)) * 100}%`
      : '0%';
  
  // Get translated status label
  const getStatusLabel = (status: OrderStatus): string => {
    // For delivery payment (cash/card on delivery), show "Čaká na potvrdenie" instead of "Čaká na platbu" for PENDING status
    if (status === OrderStatus.PENDING && isDeliveryPayment()) {
      return language === 'sk' ? 'Čaká na potvrdenie' : 'Waiting for confirmation';
    }
    // For delivery payment (cash/card on delivery), show "Potvrdené" instead of "Zaplatené" for PAID status
    if (status === OrderStatus.PAID && isDeliveryPayment()) {
      return language === 'sk' ? 'Potvrdené' : 'Confirmed';
    }
    
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: t.orderStatusPending,
      [OrderStatus.PAID]: t.orderStatusPaid,
      [OrderStatus.PREPARING]: t.orderStatusPreparing,
      [OrderStatus.READY]: t.orderStatusReady,
      [OrderStatus.OUT_FOR_DELIVERY]: t.orderStatusOutForDelivery,
      [OrderStatus.DELIVERED]: t.orderStatusDelivered,
      [OrderStatus.CANCELED]: t.orderStatusCanceled,
    };
    return statusMap[status] || status;
  };

  const getTimelineDescription = (status: OrderStatus): string => {
    if (status === OrderStatus.PENDING && isDeliveryPayment()) {
      return language === 'sk'
        ? 'Objednávka čaká na potvrdenie operátora'
        : 'Order is waiting for operator confirmation';
    }
    if (status === OrderStatus.PAID && isDeliveryPayment()) {
      return language === 'sk' ? 'Objednávka potvrdená' : 'Order confirmed';
    }

    const descriptionMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: t.orderStatusPendingDesc,
      [OrderStatus.PAID]: t.orderStatusPaidDesc,
      [OrderStatus.PREPARING]: t.orderStatusPreparingDesc,
      [OrderStatus.READY]: t.orderStatusReadyDesc,
      [OrderStatus.OUT_FOR_DELIVERY]: t.orderStatusOutForDeliveryDesc,
      [OrderStatus.DELIVERED]: t.orderStatusDeliveredDesc,
      [OrderStatus.CANCELED]:
        language === 'sk' ? 'Objednávka bola zrušená' : 'Order was canceled',
    };

    return descriptionMap[status];
  };
  
  const getNextStatusLabel = (status: OrderStatus): string => {
    // Map current status to next status label
    if (status === OrderStatus.PAID) {
      return t.orderStatusPreparing; // PAID → PREPARING
    }
    if (status === OrderStatus.PREPARING) {
      return language === 'sk' ? 'Pripravené na vyzdvihnutie' : 'Ready for pickup';
    }
    if (status === OrderStatus.READY) {
      return t.orderStatusOutForDelivery; // READY → OUT_FOR_DELIVERY
    }
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      return t.orderStatusDelivered; // OUT_FOR_DELIVERY → DELIVERED
    }
    return status; // Fallback (shouldn't happen as nextStatus is checked before calling)
  };

  const getDispatchStageLabel = (status: OrderStatus): string => {
    if (status === OrderStatus.PENDING) {
      return language === 'sk' ? 'Nové' : 'New';
    }
    if (status === OrderStatus.PAID || status === OrderStatus.PREPARING) {
      return language === 'sk' ? 'Prebieha' : 'In progress';
    }
    if (status === OrderStatus.READY) {
      return language === 'sk' ? 'Pripravené na vyzdvihnutie' : 'Ready for pickup';
    }
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      return language === 'sk' ? 'Doručuje sa' : 'Out for delivery';
    }
    if (status === OrderStatus.DELIVERED) {
      return language === 'sk' ? 'Dokončené' : 'Completed';
    }
    return language === 'sk' ? 'Zrušené' : 'Canceled';
  };
  
  const handleSyncStoryous = async () => {
    setSyncingStoryous(true);
    setStoryousMessage(null);
    setStoryousMessageTone(null);
    try {
      const result = await syncOrderToStoryous(order.id);
      if (result.success) {
        setStoryousMessage(`✅ ${result.message}`);
        setStoryousMessageTone('success');
        toastSuccess(result.message || `Storyous confirmed (${result.storyousOrderId || 'ID neznáme'})`);
      } else {
        const requiresManualAcceptance = result.storyousState === 'NEW';
        setStoryousMessage(`${requiresManualAcceptance ? '⚠️' : '❌'} ${result.message}`);
        setStoryousMessageTone(requiresManualAcceptance ? 'warning' : 'error');
        if (requiresManualAcceptance) {
          toastWarning(result.message || 'Storyous order stále čaká na ručné prijatie');
        } else {
          toastError(result.message || 'Storyous sync zlyhal');
        }
      }
      if (result.storyousOrderId) {
        onOrderRefresh?.();
      }
    } catch (error: any) {
      setStoryousMessage(`❌ Error: ${error.message}`);
      setStoryousMessageTone('error');
      toastError(error.message || 'Storyous sync zlyhal');
    } finally {
      setSyncingStoryous(false);
    }
  };

  const handleCreateWoltDelivery = async () => {
    if (isOutsideWoltArea) {
      const message = woltAreaBlockReason || 'Adresa zákazníka je mimo doručovacej zóny Wolt.';
      setWoltMessage(`⚠️ ${message}`);
      toastError(message);
      return;
    }
    setWoltMessage(null);
    setCreatingWolt(true);
    try {
      const normalizedPreparationMinutes = Number.isFinite(woltPreparationMinutes)
        ? Math.max(0, Math.min(180, Math.round(woltPreparationMinutes)))
        : 20;

      const woltResult = await createWoltDelivery(
        order.id,
        undefined,
        normalizedPreparationMinutes,
      );
      if (woltResult.success) {
        setWoltMessage(`✅ Wolt delivery created! ${woltResult.trackingUrl ? `Tracking: ${woltResult.trackingUrl}` : ''}`);
        toastSuccess('Wolt delivery bolo vytvorené');
        // Refresh orders in parent without forcing full page reload/reset.
        onOrderRefresh?.();
      } else {
        const message = woltResult.message || 'Nepodarilo sa vytvoriť doručenie';
        setWoltMessage(`❌ ${message}`);
        toastError(message);
      }
    } catch (error: any) {
      const message = error.message || 'Nepodarilo sa vytvoriť doručenie';
      setWoltMessage(`❌ ${message}`);
      toastError(message);
    } finally {
      setCreatingWolt(false);
    }
  };

  const handleCancelWoltDelivery = async () => {
    setCancelingWolt(true);
    setWoltMessage(null);
    try {
      const result = await cancelWoltDelivery(order.id);
      if (result.success) {
        setWoltMessage('✅ Wolt delivery zrušené');
        toastSuccess('Wolt delivery bolo zrušené');
        onOrderRefresh?.();
      } else {
        const message = result.message || 'Nepodarilo sa zrušiť Wolt delivery';
        setWoltMessage(`❌ ${message}`);
        toastError(message);
      }
    } catch (error: any) {
      const message = error?.message || 'Nepodarilo sa zrušiť Wolt delivery';
      setWoltMessage(`❌ ${message}`);
      toastError(message);
    } finally {
      setCancelingWolt(false);
    }
  };

  const handleRebookWoltDelivery = async () => {
    setRebookingWolt(true);
    setWoltMessage(null);
    try {
      const normalizedPreparationMinutes = Number.isFinite(woltPreparationMinutes)
        ? Math.max(0, Math.min(180, Math.round(woltPreparationMinutes)))
        : 20;

      const result = await rebookWoltDelivery(order.id, normalizedPreparationMinutes);
      if (result.success) {
        setWoltMessage(
          `✅ Wolt delivery bolo preobjednané.${result.trackingUrl ? ` Tracking: ${result.trackingUrl}` : ''}`,
        );
        toastSuccess('Wolt delivery bolo preobjednané');
        onOrderRefresh?.();
      } else {
        const message = result.message || 'Nepodarilo sa preobjednať Wolt';
        setWoltMessage(`❌ ${message}`);
        toastError(message);
      }
    } catch (error: any) {
      const message = error?.message || 'Nepodarilo sa preobjednať Wolt';
      setWoltMessage(`❌ ${message}`);
      toastError(message);
    } finally {
      setRebookingWolt(false);
    }
  };

  // Format created time
  const formatCreatedTime = (date: Date): string => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // If less than 60 minutes ago, show relative time
    if (diffMins < 60) {
      if (diffMins < 1) return 'práve teraz';
      if (diffMins === 1) return 'pred 1 minútou';
      if (diffMins < 5) return `pred ${diffMins} minútami`;
      return `pred ${diffMins} min`;
    }
    
    // Otherwise show time and date
    const time = orderDate.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const isToday = orderDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return `dnes o ${time}`;
    }
    
    const dateStr = orderDate.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit' });
    return `${dateStr} o ${time}`;
  };

  const formatTimelineTime = (date: Date): string =>
    new Date(date).toLocaleTimeString(language === 'sk' ? 'sk-SK' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatEurPrice = (priceCents: number): string => {
    const value = priceCents / 100;
    if (Number.isInteger(value)) {
      return `${value} EUR`;
    }
    return `${value.toFixed(2)} EUR`;
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }

    const totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const parseOptionalDate = (value: unknown): Date | null => {
    if (!value) return null;
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const getScheduledAtFromOrder = (currentOrder: Order): Date | null => {
    const maybeOrder = currentOrder as any;
    return parseOptionalDate(
      maybeOrder?.scheduledAt ??
        maybeOrder?.scheduledFor ??
        maybeOrder?.preferredAt ??
        maybeOrder?.deliveryAt,
    );
  };

  const createdAtDate = new Date(order.createdAt);
  const updatedAtDate = new Date(order.updatedAt);
  const scheduledAtDate = getScheduledAtFromOrder(order);
  const normalizedHistory = [...(order.statusHistory || [])]
    .map((entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
    }))
    .filter((entry) => !Number.isNaN(entry.createdAt.getTime()))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const getStepTimestamp = (status: OrderStatus): Date | null => {
    if (status === OrderStatus.PENDING) {
      const pendingEntry = normalizedHistory.find((entry) => entry.status === OrderStatus.PENDING);
      return pendingEntry?.createdAt || createdAtDate;
    }

    const exactEntry = normalizedHistory.find((entry) => entry.status === status);
    if (exactEntry) {
      return exactEntry.createdAt;
    }

    if (status === order.status) {
      return updatedAtDate;
    }

    return null;
  };

  const timelineEntries = timelineSteps.map((step, index) => {
    const timestamp = getStepTimestamp(step.key);
    const previousTimestamp = index > 0 ? getStepTimestamp(timelineSteps[index - 1].key) : null;
    const durationFromPrevious =
      timestamp && previousTimestamp
        ? formatDuration(timestamp.getTime() - previousTimestamp.getTime())
        : null;

    return {
      ...step,
      timestamp,
      durationFromPrevious,
    };
  });

  const isDispatchDetailMode = !showToggle;
  const orderDisplayNumber =
    order.orderNumber != null && order.orderNumber > 0
      ? `#${order.orderNumber.toString().padStart(4, '0')}`
      : `#${order.id.slice(0, 8).toUpperCase()}`;
  const brandLabel = tenantSlug ? BRAND_LABELS[tenantSlug] || tenantSlug : '';
  const dispatchHeadline =
    language === 'sk'
      ? order.status === OrderStatus.DELIVERED
        ? `Doručenie ${orderDisplayNumber}`
        : `Objednávka ${orderDisplayNumber}`
      : order.status === OrderStatus.DELIVERED
        ? `Delivery ${orderDisplayNumber}`
        : `Order ${orderDisplayNumber}`;
  const dispatchStageLabel = getDispatchStageLabel(order.status).toUpperCase();
  const dispatchStageAge = formatDuration(nowMs - updatedAtDate.getTime());
  const dispatchEyebrow = `${dispatchStageLabel}: ${dispatchStageAge.toUpperCase()}`;
  const clientPanelSubtitle = [customer.phone, customer.email].filter(Boolean).join(' • ');
  const addressSummary = `${address.street}, ${address.postalCode} ${address.city}`;
  const dispatchTargetDate =
    scheduledAtDate ??
    (woltPickupEtaRounded != null ? new Date(nowMs + woltPickupEtaRounded * 60000) : null);
  const dispatchTargetMeta =
    dispatchTargetDate != null
      ? dispatchTargetDate.getTime() >= nowMs
        ? `${language === 'sk' ? 'za' : 'in'} ${formatDuration(dispatchTargetDate.getTime() - nowMs)}`
        : `${language === 'sk' ? 'meška' : 'late by'} ${formatDuration(nowMs - dispatchTargetDate.getTime())}`
      : dispatchStageAge;
  const dispatchTargetLabel =
    dispatchTargetDate != null
      ? language === 'sk'
        ? 'Vydanie'
        : 'Release'
      : language === 'sk'
        ? 'Aktuálny krok'
        : 'Current step';
  const dispatchTargetValue =
    dispatchTargetDate != null ? formatTimelineTime(dispatchTargetDate) : getStatusLabel(order.status);
  const hasLongDispatchTargetValue = dispatchTargetValue.length > 12;
  const dispatchTargetValueClassName =
    dispatchTargetDate != null
      ? 'text-[20px] tracking-tight'
      : hasLongDispatchTargetValue
        ? 'text-[12px] leading-[1.05] tracking-tight [overflow-wrap:anywhere]'
        : 'text-[16px] leading-tight';
  const storyousMessageClassName =
    storyousMessageTone === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : storyousMessageTone === 'warning'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-red-50 text-red-800 border-red-200';

  const dispatchPrimaryAction: DispatchActionConfig | null = isPendingDelivery
    ? {
        label: language === 'sk' ? 'Prijať' : 'Accept',
        icon: '✓',
        onClick: () => onStatusUpdate(order.id, OrderStatus.PAID),
      }
    : isPaidOnline
      ? {
          label: language === 'sk' ? 'Potvrdiť' : 'Confirm',
          icon: '✓',
          onClick: () => onStatusUpdate(order.id, OrderStatus.PREPARING),
        }
      : shouldShowNextStatusButton() && nextStatus
        ? {
          label: getNextStatusLabel(order.status),
          icon: order.status === OrderStatus.PREPARING ? '✓' : '→',
          onClick: () => onStatusUpdate(order.id, nextStatus),
        }
        : null;

  const dispatchSecondaryAction: DispatchActionConfig | null = isPendingDelivery
    ? {
        label: language === 'sk' ? 'Zrušiť' : 'Cancel',
        onClick: () => onStatusUpdate(order.id, OrderStatus.CANCELED),
      }
    : isPendingOnline
      ? {
          label: language === 'sk' ? 'Zrušiť' : 'Cancel',
          onClick: () => onStatusUpdate(order.id, OrderStatus.CANCELED),
        }
      : isPaidOnline
        ? {
            label: language === 'sk' ? 'Odmietnuť' : 'Reject',
            onClick: () => onStatusUpdate(order.id, OrderStatus.CANCELED),
            title: 'Odmietnuť objednávku (platba sa automaticky vráti cez GoPay)',
          }
        : showDesktopBackdoorCancel
          ? {
              label: language === 'sk' ? 'Zrušiť' : 'Cancel',
              onClick: () => onStatusUpdate(order.id, OrderStatus.CANCELED),
              title: 'Backdoor zrusenie objednavky',
            }
          : null;

  const renderWoltZoneBadge = () => {
    if (!shouldRunAreaCheck) {
      return null;
    }

    if (checkingWoltArea) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
          Wolt zóna: kontrola...
        </span>
      );
    }

    if (woltAreaCheck?.insideArea === false) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
          Wolt: mimo zóny
        </span>
      );
    }

    if (woltAreaCheck?.insideArea === true) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
          Wolt: v zóne
        </span>
      );
    }

    if (woltAreaCheck?.reason) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
          Wolt: {woltAreaCheck.reason}
        </span>
      );
    }

    return null;
  };

  const desktopActionButtons = (
    <>
      {isPendingDelivery && (
        <>
          <button
            onClick={() => onStatusUpdate(order.id, OrderStatus.PAID)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
          >
            ✅ Prijať
          </button>
          <button
            onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
          >
            ❌ Zrušiť
          </button>
        </>
      )}
      {isPendingOnline && (
        <button
          onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
        >
          ❌ Zrušiť
        </button>
      )}
      {isPaidOnline && (
        <>
          <button
            onClick={() => onStatusUpdate(order.id, OrderStatus.PREPARING)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
          >
            ✅ Potvrdiť
          </button>
          <button
            onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
            title="Odmietnuť objednávku (platba sa automaticky vráti cez GoPay)"
          >
            ❌ Odmietnuť
          </button>
        </>
      )}
      {canSyncToStoryous && (
        <button
          onClick={handleSyncStoryous}
          disabled={syncingStoryous}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Send to Storyous"
        >
          {syncingStoryous ? '⏳' : '📦 Storyous'}
        </button>
      )}
      {canCreateWolt && (
        <button
          onClick={handleCreateWoltDelivery}
          disabled={creatingWolt || !canCreateWoltEffective}
          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title={canCreateWoltEffective ? 'Create Wolt delivery' : (woltAreaBlockReason || 'Wolt dispatch blocked')}
        >
          {creatingWolt ? '⏳' : '🚚 Wolt'}
        </button>
      )}
      {canCancelWolt && (
        <button
          onClick={handleCancelWoltDelivery}
          disabled={cancelingWolt}
          className="px-3 py-2 bg-orange-100 text-orange-800 border border-orange-300 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Zrušiť Wolt delivery"
        >
          {cancelingWolt ? '⏳ Ruším Wolt…' : '🛑 Zrušiť Wolt'}
        </button>
      )}
      {shouldShowNextStatusButton() && nextStatus && (
        <button
          onClick={() => onStatusUpdate(order.id, nextStatus!)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          → {getNextStatusLabel(order.status)}
        </button>
      )}
      {showDesktopBackdoorCancel && (
        <button
          onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          title="Backdoor zrusenie objednavky"
        >
          ❌ Zrušiť
        </button>
      )}
      {showToggle && (
        <button
          onClick={handleToggle}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          {expanded ? 'Hide' : 'Details'}
        </button>
      )}
    </>
  );
  
  return (
    <div className={isDispatchDetailMode ? 'flex h-full min-h-0 flex-col gap-3' : 'p-3 sm:p-4 hover:bg-gray-50'}>
      {!isDispatchDetailMode && storyousMessage && (
        <div
          className={`mb-3 rounded border p-2 text-xs ${storyousMessageClassName}`}
        >
          {storyousMessage}
        </div>
      )}
      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        {/* Top Row: Order Number and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-gray-900">
            {order.orderNumber != null && order.orderNumber > 0
              ? `#${order.orderNumber.toString().padStart(4, '0')}`
              : `#${order.id.slice(0, 8).toUpperCase()}`}
          </span>
          <span className="text-xs text-gray-500">
            {formatCreatedTime(order.createdAt)}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
            {getStatusLabel(order.status)}
          </span>
          {storyousStatusMeta && (
            <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${storyousStatusMeta.badgeClassName}`}>
              {storyousStatusMeta.badgeLabel}
            </span>
          )}
          {isWoltDelivery && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 whitespace-nowrap">
              🚚 Wolt
            </span>
          )}
        </div>
        {renderWoltZoneBadge() && (
          <div className="mt-1">
            {renderWoltZoneBadge()}
          </div>
        )}

        {woltPickupEtaRounded != null && (
          <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
              ETA kuriér na prevádzku
            </div>
            <div className="mt-1 text-3xl font-extrabold leading-none text-orange-700">
              {woltPickupEtaRounded}
              <span className="ml-1 text-sm font-semibold align-middle">min</span>
            </div>
          </div>
        )}
        
        {/* Customer Info */}
        <div>
          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
          <div className="text-xs text-gray-600">{customer.phone}</div>
        </div>
        
        {/* Order Summary */}
        <div className="text-sm text-gray-600">
          {order.items.length} items • €{(order.totalCents / 100).toFixed(2)}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2 flex-wrap">
            {/* PENDING with delivery payment - Accept */}
            {isPendingDelivery && (
              <button
                onClick={() => onStatusUpdate(order.id, OrderStatus.PAID)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
              >
                ✅ Prijať
              </button>
            )}
            {/* PAID online payment - Confirm/Reject buttons (after payment, operator must confirm) */}
            {isPaidOnline && (
              <>
                <button
                  onClick={() => onStatusUpdate(order.id, OrderStatus.PREPARING)}
                  className="flex-1 min-w-[120px] px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                >
                  ✅ Potvrdiť
                </button>
                <button
                  onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
                  className="flex-1 min-w-[120px] px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                  title="Odmietnuť objednávku (platba sa automaticky vráti cez GoPay)"
                >
                  ❌ Odmietnuť
                </button>
              </>
            )}
            {canSyncToStoryous && (
              <button
                onClick={handleSyncStoryous}
                disabled={syncingStoryous}
                className="flex-1 min-w-[120px] px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                title="Send to Storyous"
              >
                {syncingStoryous ? '⏳' : '📦 Storyous'}
              </button>
            )}
            {canCreateWolt && (
              <button
                onClick={handleCreateWoltDelivery}
                disabled={creatingWolt || !canCreateWoltEffective}
                className="flex-1 min-w-[120px] px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                title={canCreateWoltEffective ? 'Create Wolt delivery' : (woltAreaBlockReason || 'Wolt dispatch blocked')}
              >
                {creatingWolt ? '⏳' : '🚚 Wolt'}
              </button>
            )}
            {canRebookWolt && (
              <button
                onClick={handleRebookWoltDelivery}
                disabled={rebookingWolt}
                className="flex-1 min-w-[120px] px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                title="Zrušiť a vytvoriť nové Wolt delivery s novým časom"
              >
                {rebookingWolt ? '⏳ Preobjednávam…' : '🚚 Preobjednať Wolt'}
              </button>
            )}
            {canCancelWolt && (
              <button
                onClick={handleCancelWoltDelivery}
                disabled={cancelingWolt || rebookingWolt}
                className="flex-1 min-w-[120px] px-3 py-2 bg-orange-100 text-orange-800 border border-orange-300 rounded hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                title="Zrušiť Wolt delivery"
              >
                {cancelingWolt ? '⏳ Ruším Wolt…' : '🛑 Zrušiť Wolt'}
              </button>
            )}
            {shouldShowNextStatusButton() && nextStatus && (
              <button
                onClick={() => onStatusUpdate(order.id, nextStatus!)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
              >
                → {getNextStatusLabel(order.status)}
              </button>
            )}
            {canCancelAnytime && (
              <button
                onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
              >
                ❌ Zrušiť
              </button>
            )}
          </div>
          {showToggle && (
            <button
              onClick={handleToggle}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-sm font-semibold"
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      {isDispatchDetailMode ? (
        <div className="hidden shrink-0 md:block">
          <div className="shrink-0 rounded-[20px] border border-zinc-200 bg-white px-3 py-2 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.24)] lg:px-3.5">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_126px] md:items-start">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
                  {dispatchEyebrow}
                </p>
                <h2 className="mt-0.5 text-[clamp(1.05rem,1.6vw,1.55rem)] font-black leading-[0.95] tracking-tight text-zinc-950">
                  {dispatchHeadline}
                </h2>
                <p className="mt-0.5 text-[12px] font-semibold text-zinc-700">
                  {brandLabel}
                  {brandLabel ? ' • ' : ''}
                  {customer.name}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {order.items.length} {language === 'sk' ? 'položiek' : 'items'} • {formatEurPrice(order.totalCents)}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[order.status]}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  {storyousStatusMeta && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${storyousStatusMeta.badgeClassName}`}
                    >
                      {storyousStatusMeta.badgeLabel}
                    </span>
                  )}
                  {isWoltDelivery && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
                      Wolt aktivny
                    </span>
                  )}
                  {renderWoltZoneBadge()}
                </div>

                {storyousMessage && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <div className={`rounded-2xl border px-2.5 py-1 text-[10px] ${storyousMessageClassName}`}>
                      {storyousMessage}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full min-w-0 rounded-[16px] border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-right">
                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {dispatchTargetLabel}
                </div>
                <div className={`mt-1 ml-auto max-w-full font-black text-zinc-950 ${dispatchTargetValueClassName}`}>
                  {dispatchTargetValue}
                </div>
                <div className="mt-0.5 text-[9px] font-semibold text-zinc-500">{dispatchTargetMeta}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm text-gray-500">{orderDisplayNumber}</span>
              <span className="text-xs text-gray-500">
                {formatCreatedTime(order.createdAt)}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                {getStatusLabel(order.status)}
              </span>
              {storyousStatusMeta && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${storyousStatusMeta.badgeClassName}`}>
                  {storyousStatusMeta.badgeLabel}
                </span>
              )}
              {isWoltDelivery && (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                  🚚 Wolt
                </span>
              )}
              <span className="text-sm text-gray-600">
                {customer.name} • {customer.phone}
              </span>
              {renderWoltZoneBadge()}
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {order.items.length} items • €{(order.totalCents / 100).toFixed(2)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {woltPickupEtaRounded != null && (
              <div className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-center min-w-[96px]">
                <div className="text-[10px] font-bold uppercase tracking-wide text-orange-700">
                  Wolt ETA
                </div>
                <div className="text-2xl font-extrabold leading-none text-orange-700 mt-0.5">
                  {woltPickupEtaRounded}
                </div>
                <div className="text-[10px] font-semibold text-orange-700">min</div>
              </div>
            )}
            {desktopActionButtons}
          </div>
        </div>
      )}
      
      {expanded &&
        (isDispatchDetailMode ? (
          <div className="hidden min-h-0 flex-1 md:flex md:flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              <section className="shrink-0 overflow-hidden rounded-[20px] border border-zinc-200 bg-white px-3.5 py-3 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.22)]">
                <div className="space-y-2.5">
                  {order.items.map((item, i) => {
                    const modifierLines = getFormattedModifierLines(
                      item.modifiers,
                      true,
                      language,
                      customizationLabels,
                    );
                    const itemTotal = calculateOrderItemPrice(item, 'PIZZA');
                    const displayName = item.productName;

                    return (
                      <div key={i} className="border-b border-zinc-200 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4 text-[16px] leading-6">
                          <span className="min-w-0 font-bold text-zinc-950">
                            <span className="mr-2 font-black text-orange-600 tabular-nums">{item.quantity}×</span>
                            {displayName}
                          </span>
                          <span className="shrink-0 font-semibold text-zinc-900 tabular-nums">
                            {formatEurPrice(itemTotal)}
                          </span>
                        </div>
                        {modifierLines.length > 0 && (
                          <div className="mt-1.5 space-y-1 pl-6">
                            {modifierLines.map((modifier, idx) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between gap-4 text-[16px] leading-6 text-zinc-900"
                              >
                                <span className="min-w-0">
                                  <span className="mr-2 text-zinc-400" aria-hidden="true">•</span>
                                  <ModifierLabel label={modifier.label} />
                                </span>
                                <span className="shrink-0 whitespace-nowrap tabular-nums">
                                  {modifier.priceCents > 0 ? `+${formatEurPrice(modifier.priceCents)}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="space-y-1.5 border-t border-zinc-200 pt-2">
                    {displayedDeliveryFeeCents != null && (
                      <div className="flex items-center justify-between text-[12px] text-zinc-600">
                        <span>{language === 'sk' ? 'Doprava' : 'Delivery fee'}</span>
                        <span>{formatEurPrice(displayedDeliveryFeeCents)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[14px] font-bold text-zinc-950">
                      <span>{language === 'sk' ? 'Celkom' : 'Total'}</span>
                      <span>{formatEurPrice(order.totalCents)}</span>
                    </div>
                  </div>
                </div>
              </section>

              <InspectorAccordion
                className="shrink-0"
                contentClassName="space-y-4"
                open={clientPanelOpen}
                onToggle={() => setClientPanelOpen((prev) => !prev)}
                subtitle={clientPanelSubtitle}
                title={customer.name}
              >
                <div className="grid gap-3 xl:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Kontakt
                    </div>
                    <div className="mt-1.5 space-y-1 text-[13px] text-zinc-700">
                      <div>{customer.name}</div>
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Adresa
                    </div>
                    <div className="mt-1.5 space-y-1 text-[13px] text-zinc-700">
                      <div>{addressSummary}</div>
                      {address.instructions && (
                        <div className="text-zinc-500">Poznamka: {address.instructions}</div>
                      )}
                    </div>
                  </div>
                </div>
              </InspectorAccordion>

              <section className="shrink-0 overflow-hidden rounded-[18px] border border-zinc-200 bg-white shadow-[0_14px_34px_-30px_rgba(15,23,42,0.22)]">
                <div className="grid gap-2.5 px-3 py-2.5 xl:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-[14px] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                        Wolt
                      </span>
                      {canAdjustWoltPreparation && (
                        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700">
                          {language === 'sk' ? 'Ready za' : 'Ready in'} {woltPreparationMinutes}m
                        </span>
                      )}
                      {renderWoltZoneBadge()}
                      {isWoltDelivery && (
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-800">
                          {formatWoltStatus(woltDelivery?.status, language === 'sk' ? 'sk' : 'en')}
                        </span>
                      )}
                      {woltPickupEtaRounded != null && (
                        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700">
                          {language === 'sk' ? 'Wolt ETA ~' : 'Wolt ETA ~'}
                          {woltPickupEtaRounded}m
                        </span>
                      )}
                    </div>

                    {canAdjustWoltPreparation && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {woltPreparationQuickOptions.map((minutes) => {
                          const isActive = woltPreparationMinutes === minutes;
                          return (
                            <button
                              key={minutes}
                              type="button"
                              onClick={() => setWoltPreparationMinutes(minutes)}
                              className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                                isActive
                                  ? 'border-orange-600 bg-orange-500 text-white'
                                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                              }`}
                              aria-pressed={isActive}
                            >
                              +{minutes}m
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {canCreateWolt && (
                        <button
                          onClick={handleCreateWoltDelivery}
                          disabled={creatingWolt || !canCreateWoltEffective}
                          className="rounded-2xl bg-orange-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            canCreateWoltEffective
                              ? 'Create Wolt delivery'
                              : woltAreaBlockReason || 'Wolt dispatch blocked'
                          }
                        >
                          {creatingWolt ? '⏳ Kontrolujem' : 'Vytvoriť Wolt'}
                        </button>
                      )}
                      {canRebookWolt && (
                        <button
                          onClick={handleRebookWoltDelivery}
                          disabled={rebookingWolt}
                          className="rounded-2xl bg-orange-600 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Zrušiť aktuálne Wolt delivery a vytvoriť nové s novým časom pripravenia kuchyne"
                        >
                          {rebookingWolt ? '⏳ Preobjednávam' : 'Preobjednať Wolt'}
                        </button>
                      )}
                      {canCancelWolt && (
                        <button
                          onClick={handleCancelWoltDelivery}
                          disabled={cancelingWolt || rebookingWolt}
                          className="rounded-2xl border border-orange-300 bg-white px-3 py-2 text-[10px] font-semibold text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Zrušiť Wolt delivery"
                        >
                          {cancelingWolt ? '⏳ Ruším Wolt' : 'Zrušiť Wolt'}
                        </button>
                      )}
                      {woltDelivery?.trackingUrl && (
                        <a
                          href={woltDelivery.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-orange-700 underline"
                        >
                          Tracking
                        </a>
                      )}
                    </div>

                    {(woltMessage || woltAreaBlockReason) && (
                      <div className="mt-2 text-[10px] text-zinc-500">
                        {woltAreaBlockReason || woltMessage}
                      </div>
                    )}
                  </div>

                  <div className="rounded-[14px] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                          Storyous
                        </div>
                        <div className="mt-1.5">
                          {storyousStatusMeta ? (
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${storyousStatusMeta.badgeClassName}`}>
                              {storyousStatusMeta.badgeLabel.replace('📦 ', '')}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
                              Bez syncu
                            </span>
                          )}
                        </div>
                        <div className="mt-1 break-all text-[10px] text-zinc-600">
                          {order.storyousOrderId ? `ID: ${order.storyousOrderId}` : 'ID: -'}
                        </div>
                      </div>

                      {canSyncToStoryous && (
                        <button
                          onClick={handleSyncStoryous}
                          disabled={syncingStoryous}
                          className="rounded-2xl bg-purple-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Send to Storyous"
                        >
                          {syncingStoryous ? '⏳' : 'Sync'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <InspectorSection
                className="hidden shrink-0 2xl:block"
                eyebrow={language === 'sk' ? 'Timeline' : 'Timeline'}
                title={language === 'sk' ? 'Časová os objednávky' : 'Order timeline'}
                description={`${formatTimelineTime(order.createdAt)} → ${formatTimelineTime(order.updatedAt)}`}
              >
                {order.status === OrderStatus.CANCELED ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {language === 'sk'
                      ? 'Objednávka bola zrušená.'
                      : 'This order has been canceled.'}
                    {refundInfo}
                  </div>
                ) : (
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${timelineEntries.length}, minmax(0, 1fr))` }}
                  >
                    {timelineEntries.map((step, index) => {
                      const isComplete = index <= currentTimelineIndex;
                      const isCurrent = index === currentTimelineIndex;

                      return (
                        <div
                          key={step.key}
                          className={`rounded-[18px] border px-2.5 py-2 ${
                            isCurrent
                              ? 'border-emerald-400 bg-emerald-50'
                              : isComplete
                                ? 'border-zinc-200 bg-white'
                                : 'border-zinc-200 bg-zinc-50'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-zinc-900">
                            {step.timestamp ? formatTimelineTime(step.timestamp) : '--:--'}
                          </div>
                          <div
                            className={`mt-1 text-[11px] font-semibold ${
                              isComplete ? 'text-zinc-900' : 'text-zinc-500'
                            }`}
                          >
                            {getStatusLabel(step.key)}
                          </div>
                          {step.durationFromPrevious ? (
                            <div className="mt-1 text-[10px] font-bold text-emerald-600">
                              {step.durationFromPrevious}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </InspectorSection>
            </div>

            <div className="mt-3 shrink-0">
              <div className="rounded-[20px] border border-zinc-200 bg-white/95 px-2.5 py-2.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.3)] backdrop-blur">
                <div className="flex items-stretch gap-2">
                  {dispatchPrimaryAction ? (
                    <button
                      onClick={dispatchPrimaryAction.onClick}
                      className="flex-1 rounded-[16px] bg-orange-500 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-orange-600"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {dispatchPrimaryAction.icon && (
                          <span className="text-base leading-none">{dispatchPrimaryAction.icon}</span>
                        )}
                        <span>{dispatchPrimaryAction.label}</span>
                      </span>
                    </button>
                  ) : dispatchSecondaryAction ? (
                    <button
                      onClick={dispatchSecondaryAction.onClick}
                      title={dispatchSecondaryAction.title}
                      className="flex-1 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      {dispatchSecondaryAction.label}
                    </button>
                  ) : (
                    <div className="flex-1 rounded-[16px] border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-semibold text-zinc-500">
                      {language === 'sk'
                        ? 'Objednavka momentalne nema dalsi stavovy krok.'
                        : 'This order has no next status action right now.'}
                    </div>
                  )}

                  {dispatchPrimaryAction && dispatchSecondaryAction && (
                    <button
                      onClick={dispatchSecondaryAction.onClick}
                      title={dispatchSecondaryAction.title || dispatchSecondaryAction.label}
                      className="w-[54px] shrink-0 rounded-[16px] border border-zinc-200 bg-white text-lg font-black text-red-600 transition hover:bg-red-50"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 text-sm md:grid-cols-2">
            <div className="col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="font-semibold text-gray-900">
                  {language === 'sk' ? 'Časová os objednávky' : 'Order timeline'}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimelineTime(order.createdAt)} to {formatTimelineTime(order.updatedAt)}
                </div>
              </div>

              {order.status === OrderStatus.CANCELED ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                  {language === 'sk'
                    ? 'Objednávka bola zrušená.'
                    : 'This order has been canceled.'}
                  {refundInfo}
                </div>
              ) : (
                <>
                  <div className="hidden lg:block relative">
                    <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 rounded-full" />
                    <div
                      className="absolute left-0 top-5 h-1 bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: timelineProgressWidth }}
                    />

                    <div
                      className="relative grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${timelineEntries.length}, minmax(0, 1fr))` }}
                    >
                      {timelineEntries.map((step, index) => {
                        const isComplete = index <= currentTimelineIndex;
                        const isCurrent = index === currentTimelineIndex;

                        return (
                          <div key={step.key} className="text-center">
                            <div className="text-[11px] font-semibold text-gray-500 mb-1">
                              {step.timestamp ? formatTimelineTime(step.timestamp) : '--:--'}
                            </div>
                            <div
                              className={`mx-auto h-10 w-10 rounded-full flex items-center justify-center text-lg transition-all ${
                                isComplete
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-200 text-gray-500'
                              } ${isCurrent ? 'ring-4 ring-emerald-200' : ''}`}
                            >
                              {step.icon}
                            </div>
                            <div className={`mt-2 text-xs font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-500'}`}>
                              {getStatusLabel(step.key)}
                            </div>
                            <div className={`mt-1 text-[11px] leading-tight ${isComplete ? 'text-gray-600' : 'text-gray-400'}`}>
                              {getTimelineDescription(step.key)}
                            </div>
                            {step.durationFromPrevious && (
                              <div className="mt-1 text-[11px] font-semibold text-emerald-600">
                                {step.durationFromPrevious}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 lg:hidden">
                    {timelineEntries.map((step, index) => {
                      const isComplete = index <= currentTimelineIndex;
                      const isCurrent = index === currentTimelineIndex;

                      return (
                        <div key={step.key} className="flex items-start gap-3">
                          <div
                            className={`h-9 w-9 mt-0.5 rounded-full flex items-center justify-center text-sm ${
                              isComplete ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`text-sm font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-500'}`}>
                                {getStatusLabel(step.key)}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {step.timestamp ? formatTimelineTime(step.timestamp) : '--:--'}
                              </div>
                            </div>
                            <div className={`text-xs ${isComplete ? 'text-gray-600' : 'text-gray-400'}`}>
                              {getTimelineDescription(step.key)}
                            </div>
                            {step.durationFromPrevious && (
                              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                                {step.durationFromPrevious}
                              </div>
                            )}
                            {isCurrent && (
                              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                                {language === 'sk' ? 'Aktuálny krok' : 'Current step'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {storyousMessage && (
              <div className={`col-span-2 mb-2 rounded border p-2 text-xs ${storyousMessageClassName}`}>
                {storyousMessage}
              </div>
            )}
            {woltMessage && (
              <div className="col-span-2 mb-2 rounded bg-gray-100 p-2 text-xs">
                {woltMessage}
              </div>
            )}
            {storyousStatusMeta && (
              <div className={`col-span-2 mb-2 rounded p-2 text-xs ${storyousStatusMeta.detailClassName}`}>
                {storyousStatusMeta.detailText}
              </div>
            )}
            {isWoltDelivery && woltDelivery && (
              <div className="col-span-2 mb-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-orange-900">
                      🚚 Wolt Delivery: {formatWoltStatus(woltDelivery.status, language === 'sk' ? 'sk' : 'en')}
                      {woltDelivery.jobId && (
                        <span className="ml-2 font-medium text-gray-600">(Job: {woltDelivery.jobId})</span>
                      )}
                    </div>
                    {woltDelivery.trackingUrl && (
                      <a
                        href={woltDelivery.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm font-semibold text-orange-700 underline"
                      >
                        Otvoriť tracking
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
                  {woltDropoffEtaRemainingMinutes != null && (
                    <span>Doručenie zákazníkovi: ~{woltDropoffEtaRemainingMinutes} min</span>
                  )}
                  {displayedDeliveryFeeCents != null && (
                    <span>Delivery fee: {formatEurPrice(displayedDeliveryFeeCents)}</span>
                  )}
                </div>
              </div>
            )}
            <div>
              <div className="mb-2 font-semibold">Customer</div>
              <div>{customer.name}</div>
              <div>{customer.email}</div>
              <div>{customer.phone}</div>
            </div>

            <div>
              <div className="mb-2 font-semibold">Delivery Address</div>
              <div>{address.street}</div>
              <div>{address.city} {address.postalCode}</div>
              {address.instructions && (
                <div className="mt-1 text-gray-600">Note: {address.instructions}</div>
              )}
            </div>

            <div className="col-span-2">
              <div className="mb-2 font-semibold">Items</div>
              {order.items.map((item, i) => {
                const modifierLines = getFormattedModifierLines(
                  item.modifiers,
                  true,
                  language,
                  customizationLabels,
                );
                const itemTotal = calculateOrderItemPrice(item, 'PIZZA');
                const displayName = item.productName;

                return (
                  <div key={i} className="mb-5 border-b border-gray-200 pb-4 last:border-b-0">
                    {/* Kitchen-readable: larger, darker, and the item name never
                        truncates — a cut-off "Quattro Formaggi Bi…" is a wrong pizza. */}
                    <div className="flex items-baseline justify-between gap-4 text-[18px] leading-7">
                      <span className="font-bold text-gray-900">
                        <span className="mr-2 font-black text-red-600 tabular-nums">{item.quantity}×</span>
                        {displayName}
                      </span>
                      <span className="whitespace-nowrap font-semibold text-gray-800 tabular-nums">
                        {formatEurPrice(itemTotal)}
                      </span>
                    </div>
                    {modifierLines.length > 0 && (
                      <ul className="mt-2 ml-7 space-y-1.5">
                        {modifierLines.map((modifier, idx) => (
                          <li key={idx} className="flex items-baseline justify-between gap-4 text-[18px] leading-7 text-gray-900">
                            <span>
                              <span className="mr-2 text-gray-400" aria-hidden="true">•</span>
                              <ModifierLabel label={modifier.label} />
                            </span>
                            {/* Price only when it actually adds something — a
                                column of "0 EUR" is noise at the pass. */}
                            {modifier.priceCents > 0 && (
                              <span className="whitespace-nowrap font-medium text-gray-700 tabular-nums">
                                +{formatEurPrice(modifier.priceCents)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}

              {displayedDeliveryFeeCents != null && (
                <div className="flex justify-between pt-2 text-sm text-gray-600">
                  <span>Delivery fee</span>
                  <span>{formatEurPrice(displayedDeliveryFeeCents)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatEurPrice(order.totalCents)}</span>
              </div>
            </div>
          </div>
        ))}

    </div>
  );
}
