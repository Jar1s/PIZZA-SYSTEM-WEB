'use client';

import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { useState } from 'react';
import { formatModifiers } from '@/lib/format-modifiers';
import { syncOrderToStoryous, createWoltDelivery } from '@/lib/api';
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
  
  const customer = order.customer;
  const address = order.address;
  const nextStatus = NEXT_STATUS[order.status];
  const isStoryousSynced = !!order.storyousOrderId;
  const hasWoltDelivery = !!order.deliveryId || !!order.delivery;
  const woltDelivery = order.delivery;
  
  // Get translated status label
  const getStatusLabel = (status: OrderStatus): string => {
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
    // Only PREPARING and OUT_FOR_DELIVERY have next status buttons
    if (status === OrderStatus.PREPARING) {
      return t.orderStatusOutForDelivery;
    }
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      return t.orderStatusDelivered;
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
    setCreatingWolt(true);
    setWoltMessage(null);
    try {
      const result = await createWoltDelivery(order.id);
      if (result.success) {
        setWoltMessage(`✅ Wolt delivery created! ${result.trackingUrl ? `Tracking: ${result.trackingUrl}` : ''}`);
        // Refresh the page to show updated order
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setWoltMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setWoltMessage(`❌ Error: ${error.message}`);
    } finally {
      setCreatingWolt(false);
    }
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
            {!isStoryousSynced && (
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
            {nextStatus && (
              <button
                onClick={() => onStatusUpdate(order.id, nextStatus)}
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
          {!isStoryousSynced && (
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
          {nextStatus && (
            <button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
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
            
            <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>€{(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

