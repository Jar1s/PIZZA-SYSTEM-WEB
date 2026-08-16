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

// ---------------------------------------------------------------------------
// Funnel events (ViewContent → AddToCart → InitiateCheckout → AddPaymentInfo)
//
// These give ad platforms the drop-off picture and enable retargeting
// ("had a pizza in the cart, never paid"). Same rules as Purchase: consent per
// platform, never throw. Consent is read from localStorage here (not passed
// in) so call sites in stores/handlers stay one-liners.
// ---------------------------------------------------------------------------

type FunnelItem = { id: string; name: string; price: number; quantity: number };

function currentConsent(): { marketing: boolean; analytics: boolean } {
  if (typeof window === 'undefined') return { marketing: false, analytics: false };
  try {
    // Same per-browser keys the cookie banner writes (see useCookieSettings).
    return {
      marketing: window.localStorage.getItem('cookie_marketing') === 'true',
      analytics: window.localStorage.getItem('cookie_analytics') === 'true',
    };
  } catch {
    return { marketing: false, analytics: false };
  }
}

function fire(
  pixelEvent: string,
  pixelPayload: Record<string, unknown>,
  gaEvent: string,
  gaPayload: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  const consent = currentConsent();
  const w = window as any;
  if (consent.marketing && typeof w.fbq === 'function') {
    try {
      w.fbq('track', pixelEvent, pixelPayload);
    } catch {
      /* ignore */
    }
  }
  if (consent.analytics && typeof w.gtag === 'function') {
    try {
      w.gtag('event', gaEvent, gaPayload);
    } catch {
      /* ignore */
    }
  }
}

const toContents = (items: FunnelItem[]) => items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price }));
const toGaItems = (items: FunnelItem[]) => items.map((i) => ({ item_id: i.id, item_name: i.name, quantity: i.quantity, price: i.price }));
const sumValue = (items: FunnelItem[]) => Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

/** Customer opened a product (customization modal / detail). */
export function trackViewContent(item: { id: string; name: string; priceCents: number; category?: string }, currency = 'EUR'): void {
  const price = Math.round(item.priceCents || 0) / 100;
  fire(
    'ViewContent',
    { content_type: 'product', content_ids: [item.id], content_name: item.name, content_category: item.category, value: price, currency },
    'view_item',
    { currency, value: price, items: [{ item_id: item.id, item_name: item.name, item_category: item.category, price, quantity: 1 }] },
  );
}

/** Customer added a product to the cart. priceCents = unit price incl. modifiers. */
export function trackAddToCart(item: { id: string; name: string; priceCents: number; quantity?: number }, currency = 'EUR'): void {
  const line: FunnelItem = { id: item.id, name: item.name, price: Math.round(item.priceCents || 0) / 100, quantity: item.quantity || 1 };
  fire(
    'AddToCart',
    { content_type: 'product', content_ids: [line.id], content_name: line.name, contents: toContents([line]), value: sumValue([line]), currency },
    'add_to_cart',
    { currency, value: sumValue([line]), items: toGaItems([line]) },
  );
}

/** Customer landed on the checkout page with a non-empty cart. */
export function trackInitiateCheckout(items: FunnelItem[], currency = 'EUR'): void {
  if (!items.length) return;
  fire(
    'InitiateCheckout',
    { content_type: 'product', content_ids: items.map((i) => i.id), contents: toContents(items), num_items: items.reduce((s, i) => s + i.quantity, 0), value: sumValue(items), currency },
    'begin_checkout',
    { currency, value: sumValue(items), items: toGaItems(items) },
  );
}

/** Customer submitted the checkout (about to pay). */
export function trackAddPaymentInfo(items: FunnelItem[], paymentType: string, currency = 'EUR'): void {
  if (!items.length) return;
  fire(
    'AddPaymentInfo',
    { content_type: 'product', content_ids: items.map((i) => i.id), contents: toContents(items), value: sumValue(items), currency },
    'add_payment_info',
    { currency, value: sumValue(items), payment_type: paymentType, items: toGaItems(items) },
  );
}
