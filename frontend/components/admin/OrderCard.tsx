'use client';

import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { useState } from 'react';
import { getFormattedModifierLines } from '@/lib/format-modifiers';
import { syncOrderToStoryous, createWoltDelivery, checkWoltAvailability } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateOrderItemPrice } from '@/lib/calculate-order-item-price';
import { getTranslations } from '@/lib/translations';
import { getProductDisplayName } from '@/lib/product-translations';
import { useToastContext } from '@/contexts/ToastContext';

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

// Updated flow: PENDING → PAID (automatic) → PREPARING → OUT_FOR_DELIVERY → DELIVERED (automatic)
// PAID is automatic via webhook, DELIVERED is automatic via Wolt webhook or time-based
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PENDING: null, // PAID is automatic via payment webhook
  PAID: OrderStatus.PREPARING,
  PREPARING: OrderStatus.OUT_FOR_DELIVERY, // Skip READY
  READY: OrderStatus.OUT_FOR_DELIVERY, // Backward compatibility
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
  { key: OrderStatus.OUT_FOR_DELIVERY, icon: '🚗' },
  { key: OrderStatus.DELIVERED, icon: '🎉' },
];

const DELIVERY_TIMELINE_STEPS: TimelineStepConfig[] = [
  { key: OrderStatus.PENDING, icon: '⏳' },
  { key: OrderStatus.PAID, icon: '✅' },
  { key: OrderStatus.PREPARING, icon: '👨‍🍳' },
  { key: OrderStatus.OUT_FOR_DELIVERY, icon: '🚗' },
  { key: OrderStatus.DELIVERED, icon: '🎉' },
];

const BRAND_LABELS: Record<string, string> = {
  pornopizza: 'Porno Pizza',
  partypizza: 'Party Pizza',
  pizzavnudzi: 'Pizza v Nudzi',
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
  const [creatingWolt, setCreatingWolt] = useState(false);
  const [woltMessage, setWoltMessage] = useState<string | null>(null);
  const [showWoltModal, setShowWoltModal] = useState(false);
  const [checkingWolt, setCheckingWolt] = useState(false);
  const [woltPromise, setWoltPromise] = useState<{
    promiseId: string;
    feeCents: number;
    etaMinutes: number;
    pickupEtaMinutes?: number;
    dropoffEtaMinutes?: number;
    validUntil: string;
    currency: string;
    distance?: number;
  } | null>(null);
  const [woltError, setWoltError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToastContext();
  
  const customer = order.customer;
  const address = order.address;
  const nextStatus = NEXT_STATUS[order.status];
  const isStoryousSynced = !!order.storyousOrderId;
  const hasWoltDelivery = !!order.deliveryId || !!order.delivery;
  const woltDelivery = order.delivery;
  const customizationLabels = (order as any)?.tenant?.theme?.customizationLabels;
  
  // Show Storyous/Wolt buttons only while in PAID/PREPARING and not yet created
  const canSyncToStoryous = !isStoryousSynced && (
    order.status === OrderStatus.PAID ||
    order.status === OrderStatus.PREPARING
  );
  const canCancelAnytime = order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED;
  const isPreparing = order.status === OrderStatus.PREPARING;
  
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
    !hasWoltDelivery &&
    (order.status === OrderStatus.PAID || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY);
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
  const woltFeeCents = parseOptionalNumber(woltQuote?.feeCents);

  const timelineSteps = isDeliveryPaymentValue ? DELIVERY_TIMELINE_STEPS : ONLINE_TIMELINE_STEPS;
  const timelineStatus =
    order.status === OrderStatus.READY ? OrderStatus.OUT_FOR_DELIVERY : order.status;
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
      [OrderStatus.READY]: t.orderStatusOutForDeliveryDesc,
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
      return t.orderStatusOutForDelivery; // PREPARING → OUT_FOR_DELIVERY
    }
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      return t.orderStatusDelivered; // OUT_FOR_DELIVERY → DELIVERED
    }
    return status; // Fallback (shouldn't happen as nextStatus is checked before calling)
  };
  
  const handleSyncStoryous = async () => {
    setSyncingStoryous(true);
    setStoryousMessage(null);
    try {
      const result = await syncOrderToStoryous(order.id);
      if (result.success) {
        setStoryousMessage(`✅ Synced! Storyous ID: ${result.storyousOrderId || 'N/A'}`);
        toastSuccess(`Storyous: objednávka odoslaná (${result.storyousOrderId || 'ID neznáme'})`);
      } else {
        setStoryousMessage(`❌ ${result.message}`);
        toastError(result.message || 'Storyous sync zlyhal');
      }
    } catch (error: any) {
      setStoryousMessage(`❌ Error: ${error.message}`);
      toastError(error.message || 'Storyous sync zlyhal');
    } finally {
      setSyncingStoryous(false);
    }
  };

  const handleCreateWoltDelivery = async () => {
    setShowWoltModal(true);
    setCheckingWolt(true);
    setWoltError(null);
    setWoltPromise(null);
    setWoltMessage(null);
    
    try {
      const promise = await checkWoltAvailability(order.id);
      setWoltPromise(promise);
    } catch (error: any) {
      setWoltError(error.message || 'Wolt nie je dostupný');
    } finally {
      setCheckingWolt(false);
    }
  };

  const handleConfirmWoltDelivery = async () => {
    if (!woltPromise) return;
    
    setCreatingWolt(true);
    setWoltError(null);
    try {
      const woltResult = await createWoltDelivery(order.id, woltPromise.promiseId, woltPromise);
      if (woltResult.success) {
        setShowWoltModal(false);
        setWoltMessage(`✅ Wolt delivery created! ${woltResult.trackingUrl ? `Tracking: ${woltResult.trackingUrl}` : ''}`);
        // Refresh orders in parent without forcing full page reload/reset.
        onOrderRefresh?.();
      } else {
        setWoltError(woltResult.message || 'Nepodarilo sa vytvoriť doručenie');
      }
    } catch (error: any) {
      setWoltError(error.message || 'Nepodarilo sa vytvoriť doručenie');
    } finally {
      setCreatingWolt(false);
    }
  };

  const handleCancelWoltModal = () => {
    setShowWoltModal(false);
    setWoltPromise(null);
    setWoltError(null);
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

  const createdAtDate = new Date(order.createdAt);
  const updatedAtDate = new Date(order.updatedAt);
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

    // Legacy flow stored READY before OUT_FOR_DELIVERY.
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      const readyEntry = normalizedHistory.find((entry) => entry.status === OrderStatus.READY);
      if (readyEntry) {
        return readyEntry.createdAt;
      }
    }

    const currentStatusForTimeline =
      order.status === OrderStatus.READY ? OrderStatus.OUT_FOR_DELIVERY : order.status;
    if (status === currentStatusForTimeline) {
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
  const dispatchStatusLabel = getStatusLabel(order.status).toUpperCase();
  const dispatchElapsed = formatDuration(updatedAtDate.getTime() - createdAtDate.getTime());

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
            title="Odmietnuť objednávku (refund bude spracovaný neskôr)"
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
      {!hasWoltDelivery && order.status === OrderStatus.PAID && (
        <button
          onClick={handleCreateWoltDelivery}
          disabled={creatingWolt}
          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title="Create Wolt delivery"
        >
          {creatingWolt ? '⏳' : '🚚 Wolt'}
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
    <div className="p-3 sm:p-4 hover:bg-gray-50">
      {storyousMessage && (
        <div
          className={`mb-3 p-2 rounded text-xs border ${
            storyousMessage.startsWith('✅')
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
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
          {isStoryousSynced && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">
              📦 Storyous
            </span>
          )}
          {hasWoltDelivery && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 whitespace-nowrap">
              🚚 Wolt
            </span>
          )}
        </div>
        
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
                  title="Odmietnuť objednávku (refund bude spracovaný neskôr)"
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
                disabled={creatingWolt}
                className="flex-1 min-w-[120px] px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                title="Create Wolt delivery"
              >
                {creatingWolt ? '⏳' : '🚚 Wolt'}
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
        <div className="hidden md:block border-l-2 border-red-500 pl-3 pb-4 mb-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide font-extrabold text-emerald-600">
                {dispatchStatusLabel}
              </div>
              <div className="text-3xl font-extrabold text-gray-900 leading-tight mt-1">
                {dispatchHeadline}
              </div>
              <div className="text-sm font-semibold text-emerald-700 mt-1">
                {brandLabel}{brandLabel ? ' • ' : ''}{customer.name}
              </div>
            </div>
            <div className="rounded-xl bg-gray-100 border border-gray-200 px-4 py-3 text-right min-w-[128px]">
              <div className="text-[10px] uppercase tracking-wide font-bold text-gray-500">
                {language === 'sk' ? 'Vydanie' : 'Updated'}
              </div>
              <div className="text-3xl font-extrabold text-gray-900 leading-none mt-1">
                {formatTimelineTime(order.updatedAt)}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1">
                {dispatchElapsed}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {desktopActionButtons}
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
              {isStoryousSynced && (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                  📦 Storyous
                </span>
              )}
              {hasWoltDelivery && (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                  🚚 Wolt
                </span>
              )}
              <span className="text-sm text-gray-600">
                {customer.name} • {customer.phone}
              </span>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {order.items.length} items • €{(order.totalCents / 100).toFixed(2)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {desktopActionButtons}
          </div>
        </div>
      )}
      
      {expanded && (
        <div className={`${isDispatchDetailMode ? 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-l-2 border-red-500 pl-3' : 'mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'}`}>
          <div className={`col-span-2 border border-gray-200 ${isDispatchDetailMode ? 'rounded-lg bg-white overflow-hidden' : 'rounded-xl bg-gray-50 p-4'}`}>
            <div className={`flex items-center justify-between gap-2 ${isDispatchDetailMode ? 'px-4 py-3 border-b border-gray-200 bg-gray-50/60' : 'mb-4'}`}>
              <div className="font-semibold text-gray-900">
                {language === 'sk' ? 'Časová os objednávky' : 'Order timeline'}
              </div>
              {isDispatchDetailMode ? (
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-wide font-bold text-orange-600 hover:text-orange-700"
                >
                  {language === 'sk' ? 'Zobrazit denniky' : 'Show logs'}
                </button>
              ) : (
                <div className="text-xs text-gray-500">
                  {formatTimelineTime(order.createdAt)} to {formatTimelineTime(order.updatedAt)}
                </div>
              )}
            </div>

            {order.status === OrderStatus.CANCELED ? (
              <div className={`${isDispatchDetailMode ? 'm-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700' : 'rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700'}`}>
                {language === 'sk'
                  ? 'Objednávka bola zrušená.'
                  : 'This order has been canceled.'}
              </div>
            ) : (
              <>
                {isDispatchDetailMode ? (
                  <div className="hidden lg:grid gap-2 p-4" style={{ gridTemplateColumns: `repeat(${timelineEntries.length}, minmax(0, 1fr))` }}>
                    {timelineEntries.map((step, index) => {
                      const isComplete = index <= currentTimelineIndex;
                      const isCurrent = index === currentTimelineIndex;

                      return (
                        <div
                          key={step.key}
                          className={`rounded-md border px-2.5 py-2 min-h-[72px] ${
                            isCurrent
                              ? 'border-emerald-400 bg-emerald-50'
                              : isComplete
                                ? 'border-gray-200 bg-white'
                                : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="text-[12px] font-bold text-gray-900">
                            {step.timestamp ? formatTimelineTime(step.timestamp) : '--:--'}
                          </div>
                          <div className={`text-[12px] font-semibold mt-0.5 ${isComplete ? 'text-gray-900' : 'text-gray-500'}`}>
                            {getStatusLabel(step.key)}
                          </div>
                          {step.durationFromPrevious && (
                            <div className="text-[11px] font-bold text-emerald-600 mt-1">
                              {step.durationFromPrevious}
                            </div>
                          )}
                          {!step.durationFromPrevious && (
                            <div className="text-[11px] text-gray-400 mt-1">--</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
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
                )}

                <div className="lg:hidden space-y-3">
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
            <div
              className={`col-span-2 mb-2 p-2 rounded text-xs border ${
                storyousMessage.startsWith('✅')
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {storyousMessage}
            </div>
          )}
          {woltMessage && (
            <div className="col-span-2 mb-2 p-2 rounded text-xs bg-gray-100">
              {woltMessage}
            </div>
          )}
          {isStoryousSynced && (
            <div className="col-span-2 mb-2 p-2 rounded text-xs bg-green-50 text-green-800">
              ✅ Synced to Storyous (ID: {order.storyousOrderId})
            </div>
          )}
          {hasWoltDelivery && woltDelivery && (
            <div className="col-span-2 mb-2 p-2 rounded text-xs bg-orange-50 text-orange-800">
              🚚 Wolt Delivery: {woltDelivery.status}
              {woltDelivery.trackingUrl && (
                <a 
                  href={woltDelivery.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-orange-600 underline"
                >
                  Track
                </a>
              )}
              {woltDelivery.jobId && (
                <span className="ml-2 text-gray-600">(Job: {woltDelivery.jobId})</span>
              )}
              {woltPickupEtaMinutes != null && (
                <span className="ml-2 text-gray-700">ETA kuriér na prevádzku: ~{Math.round(woltPickupEtaMinutes)} min</span>
              )}
              {woltDropoffEtaMinutes != null && (
                <span className="ml-2 text-gray-700">Doručenie zákazníkovi: ~{Math.round(woltDropoffEtaMinutes)} min</span>
              )}
              {woltFeeCents != null && (
                <span className="ml-2 text-gray-700">Fee: €{(woltFeeCents / 100).toFixed(2)}</span>
              )}
            </div>
          )}
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
            {order.items.map((item, i) => {
              const modifierLines = getFormattedModifierLines(
                item.modifiers,
                true,
                language,
                customizationLabels,
              );
              // Calculate correct price (handles both old and new orders)
              const itemTotal = calculateOrderItemPrice(item, 'PIZZA');
              // In admin, show the database product name (internal name), not the web display name
              const displayName = item.productName;
              
              return (
                <div key={i} className="mb-4 pb-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex justify-between gap-3 text-[15px] leading-6">
                    <span className="font-semibold text-gray-900 truncate">
                      <span className="text-red-500 font-bold mr-1">{item.quantity}x</span>
                      {displayName}
                    </span>
                    <span className="font-semibold text-gray-800 whitespace-nowrap">{formatEurPrice(itemTotal)}</span>
                  </div>
                  {modifierLines.length > 0 && (
                    <div className="mt-1.5 ml-5 space-y-1">
                      {modifierLines.map((modifier, idx) => {
                        return (
                          <div key={idx} className="flex justify-between gap-3 text-[14px] text-gray-700 leading-5">
                            <span className="truncate">
                              <span className="text-red-500 font-semibold mr-1">1x</span>
                              {modifier.label}
                            </span>
                            <span className="text-gray-700 whitespace-nowrap">{formatEurPrice(modifier.priceCents)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {order.deliveryFeeCents != null && (
              <div className="pt-2 flex justify-between text-sm text-gray-600">
                <span>Delivery fee</span>
                <span>{formatEurPrice(order.deliveryFeeCents)}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatEurPrice(order.totalCents)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Wolt Confirmation Modal */}
      {showWoltModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {woltError ? '❌ Wolt nie je dostupný' : '🚚 Potvrdiť Wolt doručenie?'}
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {checkingWolt && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Kontroluje dostupnosť Wolt...</p>
                </div>
              )}

              {woltError && !checkingWolt && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold mb-2">Dôvod:</p>
                    <p className="text-red-700">{woltError}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">📍 Adresa:</p>
                    <p className="text-gray-900 font-medium">
                      {address.street}, {address.postalCode} {address.city}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Skontrolujte, či je adresa v rámci doručovacej zóny Wolt.
                    </p>
                  </div>
                </div>
              )}

              {woltPromise && !woltError && !checkingWolt && (
                <div className="space-y-4">
                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">📦 Objednávka:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        #{order.orderNumber?.toString().padStart(4, '0') || order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">👤 Zákazník:</span>
                      <span className="font-semibold text-gray-900">{customer.name}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Delivery Info */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">💰 Poplatok za doručenie:</span>
                      <span className="text-xl font-bold text-orange-600">
                        €{(woltPromise.feeCents / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">⏱️ ETA kuriér na prevádzku:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ~{Math.round(
                          parseOptionalNumber(woltPromise.pickupEtaMinutes) ??
                            parseOptionalNumber(woltPromise.etaMinutes) ??
                            0,
                        )} minút
                      </span>
                    </div>
                    {parseOptionalNumber(woltPromise.dropoffEtaMinutes) != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">🏁 Doručenie zákazníkovi:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          ~{Math.round(parseOptionalNumber(woltPromise.dropoffEtaMinutes) || 0)} minút
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Address */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">📍 Adresa doručenia:</p>
                    <p className="text-gray-900 font-medium">
                      {address.street}
                    </p>
                    <p className="text-gray-700">
                      {address.postalCode} {address.city}
                    </p>
                    {address.instructions && (
                      <p className="text-sm text-gray-500 mt-2">
                        💬 {address.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={handleCancelWoltModal}
                disabled={checkingWolt || creatingWolt}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {woltError ? 'Zavrieť' : 'Zrušiť'}
              </button>
              
              {!woltError && woltPromise && (
                <button
                  onClick={handleConfirmWoltDelivery}
                  disabled={checkingWolt || creatingWolt}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {creatingWolt ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Vytvára sa...
                    </>
                  ) : (
                    '✅ Potvrdiť'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
