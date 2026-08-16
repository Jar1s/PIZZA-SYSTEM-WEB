/**
 * Purchase conversion tracking for Meta Pixel and Google Analytics 4.
 *
 * Rules:
 * - Only fires when the matching consent category is granted (marketing for
 *   the pixel, analytics for GA) — the caller passes the current settings.
 * - Fires at most ONCE per order, across reloads and tabs, via a
 *   localStorage marker; a refreshed confirmation page must not report a
 *   second purchase (that would inflate ad ROAS and GA revenue).
 * - Never throws: an ad blocker removing fbq/gtag is a normal condition.
 */

export type PurchaseOrder = {
  id: string;
  orderNumber?: number | null;
  totalCents?: number;
  items?: Array<{ productId?: string; productName?: string; name?: string; quantity: number; priceCents?: number; totalCents?: number }>;
};

const MARKER_PREFIX = 'purchase_tracked_';

function alreadyTracked(orderId: string): boolean {
  try {
    return window.localStorage.getItem(MARKER_PREFIX + orderId) === '1';
  } catch {
    return false;
  }
}

function markTracked(orderId: string): void {
  try {
    window.localStorage.setItem(MARKER_PREFIX + orderId, '1');
  } catch {
    // storage unavailable (private mode quota etc.) — tracking is best effort
  }
}

export function trackPurchase(
  order: PurchaseOrder,
  consent: { marketing: boolean; analytics: boolean },
  currency = 'EUR',
): { pixel: boolean; ga: boolean } {
  const result = { pixel: false, ga: false };
  if (typeof window === 'undefined' || !order?.id) return result;
  if (!consent.marketing && !consent.analytics) return result;
  if (alreadyTracked(order.id)) return result;

  const value = Math.round(order.totalCents || 0) / 100;
  const items = (order.items || []).map((item) => ({
    id: item.productId || item.productName || item.name || 'item',
    name: item.productName || item.name || 'item',
    quantity: item.quantity,
    price: Math.round(item.priceCents || 0) / 100,
  }));

  const w = window as any;

  if (consent.marketing && typeof w.fbq === 'function') {
    try {
      w.fbq(
        'track',
        'Purchase',
        {
          value,
          currency,
          content_type: 'product',
          content_ids: items.map((i) => i.id),
          contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
          num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        },
        { eventID: order.id },
      );
      result.pixel = true;
    } catch {
      /* ignore */
    }
  }

  if (consent.analytics && typeof w.gtag === 'function') {
    try {
      w.gtag('event', 'purchase', {
        transaction_id: order.id,
        value,
        currency,
        items: items.map((i) => ({ item_id: i.id, item_name: i.name, quantity: i.quantity, price: i.price })),
      });
      result.ga = true;
    } catch {
      /* ignore */
    }
  }

  if (result.pixel || result.ga) {
    markTracked(order.id);
  }
  return result;
}
