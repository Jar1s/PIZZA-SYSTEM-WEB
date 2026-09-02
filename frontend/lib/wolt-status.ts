/**
 * Human labels + badge styling for Wolt Drive delivery statuses.
 *
 * The DB `delivery.status` holds a mix of raw Wolt values (lowercase, e.g.
 * "pending", "courier_assigned" – from the create/tracking responses) and
 * normalized webhook values (uppercase, e.g. "PICKED_UP", "DELIVERED" – see
 * backend mapWoltWebhookTypeToStatus). Match case-insensitively and fall back
 * to the raw value for anything unknown.
 */

export interface WoltStatusMeta {
  label: string;
  /** Emoji shown in front of the label. */
  icon: string;
  /** Tailwind classes for the pill (border + bg + text). */
  badgeClass: string;
}

type Tone = 'searching' | 'info' | 'courier' | 'transit' | 'done' | 'muted' | 'error';

const TONE_CLASSES: Record<Tone, string> = {
  searching: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  courier: 'border-blue-200 bg-blue-50 text-blue-800',
  transit: 'border-orange-200 bg-orange-50 text-orange-800',
  done: 'border-green-200 bg-green-50 text-green-800',
  muted: 'border-zinc-200 bg-zinc-100 text-zinc-600',
  error: 'border-red-200 bg-red-50 text-red-800',
};

const WOLT_STATUSES: Record<string, { sk: string; en: string; icon: string; tone: Tone }> = {
  pending: { sk: 'Hľadá kuriéra', en: 'Finding courier', icon: '🔍', tone: 'searching' },
  received: { sk: 'Prijaté Woltom', en: 'Received by Wolt', icon: '📨', tone: 'info' },
  info_received: { sk: 'Prijaté Woltom', en: 'Received by Wolt', icon: '📨', tone: 'info' },
  courier_assigned: { sk: 'Kuriér priradený', en: 'Courier assigned', icon: '🛵', tone: 'courier' },
  pickup_started: { sk: 'Kuriér ide do kuchyne', en: 'Courier heading to kitchen', icon: '🛵', tone: 'courier' },
  pickup_arrival: { sk: 'Kuriér pri kuchyni', en: 'Courier at kitchen', icon: '🍕', tone: 'courier' },
  pickup_arrived: { sk: 'Kuriér pri kuchyni', en: 'Courier at kitchen', icon: '🍕', tone: 'courier' },
  picked_up: { sk: 'Vyzdvihnuté', en: 'Picked up', icon: '📦', tone: 'transit' },
  dropoff_started: { sk: 'Na ceste k zákazníkovi', en: 'On the way to customer', icon: '🚚', tone: 'transit' },
  dropoff_arrival: { sk: 'Kuriér pri zákazníkovi', en: 'Courier at customer', icon: '📍', tone: 'transit' },
  dropoff_arrived: { sk: 'Kuriér pri zákazníkovi', en: 'Courier at customer', icon: '📍', tone: 'transit' },
  delivered: { sk: 'Doručené', en: 'Delivered', icon: '✅', tone: 'done' },
  dropoff_completed: { sk: 'Doručené', en: 'Delivered', icon: '✅', tone: 'done' },
  cancelled: { sk: 'Zrušené', en: 'Cancelled', icon: '✖️', tone: 'muted' },
  canceled: { sk: 'Zrušené', en: 'Cancelled', icon: '✖️', tone: 'muted' },
  rejected: { sk: 'Zamietnuté Woltom', en: 'Rejected by Wolt', icon: '⛔', tone: 'error' },
  failed: { sk: 'Zlyhalo', en: 'Failed', icon: '⚠️', tone: 'error' },
  customer_no_show: { sk: 'Zákazník nezastihnutý', en: 'Customer no-show', icon: '🚪', tone: 'error' },
};

export function getWoltStatusMeta(
  status: string | null | undefined,
  language: 'sk' | 'en' = 'sk',
): WoltStatusMeta {
  const raw = String(status || '').trim();
  const entry = raw ? WOLT_STATUSES[raw.toLowerCase()] : undefined;
  if (!entry) {
    return { label: raw || 'Wolt', icon: '🚚', badgeClass: TONE_CLASSES.transit };
  }
  return { label: entry[language], icon: entry.icon, badgeClass: TONE_CLASSES[entry.tone] };
}

export function formatWoltStatus(
  status: string | null | undefined,
  language: 'sk' | 'en' = 'sk',
): string {
  return getWoltStatusMeta(status, language).label;
}
