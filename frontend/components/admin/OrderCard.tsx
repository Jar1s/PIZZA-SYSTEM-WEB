'use client';

import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { useState } from 'react';
import { formatModifiers } from '@/lib/format-modifiers';
import { syncOrderToStoryous, createWoltDelivery, checkWoltAvailability } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateOrderItemPrice } from '@/lib/calculate-order-item-price';
import { getTranslations } from '@/lib/translations';
import { getProductDisplayName } from '@/lib/product-translations';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  isExpanded?: boolean;
  onToggleExpand?: (orderId: string) => void;
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

export function OrderCard({ order, onStatusUpdate, isExpanded = false, onToggleExpand }: OrderCardProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  // Use prop if provided, otherwise fall back to local state for backward compatibility
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = onToggleExpand ? isExpanded : localExpanded;
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
    validUntil: string;
    currency: string;
  } | null>(null);
  const [woltError, setWoltError] = useState<string | null>(null);
  
  const customer = order.customer;
  const address = order.address;
  const nextStatus = NEXT_STATUS[order.status];
  const isStoryousSynced = !!order.storyousOrderId;
  const hasWoltDelivery = !!order.deliveryId || !!order.delivery;
  const woltDelivery = order.delivery;
  
  // Storyous button should only show after order is confirmed (PREPARING or higher)
  const canSyncToStoryous = !isStoryousSynced && (
    order.status === OrderStatus.PREPARING || 
    order.status === OrderStatus.OUT_FOR_DELIVERY || 
    order.status === OrderStatus.DELIVERED
  );
  
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
        // Refresh the page to show updated order
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStoryousMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setStoryousMessage(`❌ Error: ${error.message}`);
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
      const result = await createWoltDelivery(order.id, woltPromise.promiseId);
      if (result.success) {
        setShowWoltModal(false);
        setWoltMessage(`✅ Wolt delivery created! ${result.trackingUrl ? `Tracking: ${result.trackingUrl}` : ''}`);
        // Refresh the page to show updated order
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setWoltError(result.message || 'Nepodarilo sa vytvoriť doručenie');
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
  
  return (
    <div className="p-3 sm:p-4 hover:bg-gray-50">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        {/* Top Row: Order Number and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-gray-900">
            {order.orderNumber != null && order.orderNumber > 0
              ? `#${order.orderNumber.toString().padStart(4, '0')}`
              : `#${order.id.slice(0, 8).toUpperCase()}`}
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
            {/* PENDING with delivery payment - Accept/Cancel buttons */}
            {isPendingDelivery && (
              <>
                <button
                  onClick={() => onStatusUpdate(order.id, OrderStatus.PAID)}
                  className="flex-1 min-w-[120px] px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                >
                  ✅ Prijať
                </button>
                <button
                  onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
                  className="flex-1 min-w-[120px] px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                >
                  ❌ Zrušiť
                </button>
              </>
            )}
            {/* PENDING with online payment - Cancel button only (waiting for customer payment) */}
            {isPendingOnline && (
              <button
                onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
              >
                ❌ Zrušiť
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
            {!hasWoltDelivery && order.status === OrderStatus.PAID && (
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
          </div>
          <button
            onClick={handleToggle}
            className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-sm font-semibold"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-gray-500">
              {order.orderNumber != null && order.orderNumber > 0
                ? `#${order.orderNumber.toString().padStart(4, '0')}`
                : `#${order.id.slice(0, 8).toUpperCase()}`}
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
          {/* PENDING with delivery payment - Accept/Cancel buttons */}
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
          {/* PENDING with online payment - Cancel button only (waiting for customer payment) */}
          {isPendingOnline && (
            <button
              onClick={() => onStatusUpdate(order.id, OrderStatus.CANCELED)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
            >
              ❌ Zrušiť
            </button>
          )}
          {/* PAID online payment - Confirm/Reject buttons (after payment, operator must confirm) */}
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
          
          <button
            onClick={handleToggle}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {storyousMessage && (
            <div className="col-span-2 mb-2 p-2 rounded text-xs bg-gray-100">
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
              const modifiers = formatModifiers(item.modifiers, true, language); // Use defaults for admin
              // Calculate correct price (handles both old and new orders)
              const itemTotal = calculateOrderItemPrice(item, 'PIZZA');
              // In admin, show the database product name (internal name), not the web display name
              const displayName = item.productName;
              
              return (
                <div key={i} className="mb-3 pb-3 border-b last:border-b-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.quantity}x {displayName}</span>
                    <span>€{(itemTotal / 100).toFixed(2)}</span>
                  </div>
                  {modifiers.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 ml-4 space-y-0.5">
                      {modifiers.map((mod, idx) => (
                        <div key={idx}>• {mod}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {order.deliveryFeeCents != null && (
              <div className="pt-2 flex justify-between text-sm text-gray-600">
                <span>Delivery fee</span>
                <span>€{(order.deliveryFeeCents / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>€{(order.totalCents / 100).toFixed(2)}</span>
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
                      <span className="text-gray-600">⏱️ Odhadovaný čas:</span>
                      <span className="text-lg font-semibold text-gray-900">
                        ~{woltPromise.etaMinutes} minút
                      </span>
                    </div>
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
