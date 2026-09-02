/**
 * Human labels for Wolt Drive delivery statuses.
 *
 * The DB `delivery.status` holds a mix of raw Wolt values (lowercase, e.g.
 * "pending", "courier_assigned" – from the create/tracking responses) and
 * normalized webhook values (uppercase, e.g. "PICKED_UP", "DELIVERED" – see
 * backend mapWoltWebhookTypeToStatus). Match case-insensitively and fall back
 * to the raw value for anything unknown.
 */
const WOLT_STATUS_LABELS: Record<string, { sk: string; en: string }> = {
  pending: { sk: 'Hľadá kuriéra', en: 'Finding courier' },
  received: { sk: 'Prijaté Woltom', en: 'Received by Wolt' },
  info_received: { sk: 'Prijaté Woltom', en: 'Received by Wolt' },
  courier_assigned: { sk: 'Kuriér priradený', en: 'Courier assigned' },
  pickup_started: { sk: 'Kuriér ide do kuchyne', en: 'Courier heading to kitchen' },
  pickup_arrival: { sk: 'Kuriér pri kuchyni', en: 'Courier at kitchen' },
  pickup_arrived: { sk: 'Kuriér pri kuchyni', en: 'Courier at kitchen' },
  picked_up: { sk: 'Vyzdvihnuté', en: 'Picked up' },
  dropoff_started: { sk: 'Na ceste k zákazníkovi', en: 'On the way to customer' },
  dropoff_arrival: { sk: 'Kuriér pri zákazníkovi', en: 'Courier at customer' },
  dropoff_arrived: { sk: 'Kuriér pri zákazníkovi', en: 'Courier at customer' },
  delivered: { sk: 'Doručené', en: 'Delivered' },
  dropoff_completed: { sk: 'Doručené', en: 'Delivered' },
  cancelled: { sk: 'Zrušené', en: 'Cancelled' },
  canceled: { sk: 'Zrušené', en: 'Cancelled' },
  rejected: { sk: 'Zamietnuté Woltom', en: 'Rejected by Wolt' },
  failed: { sk: 'Zlyhalo', en: 'Failed' },
  customer_no_show: { sk: 'Zákazník nezastihnutý', en: 'Customer no-show' },
};

export function formatWoltStatus(
  status: string | null | undefined,
  language: 'sk' | 'en' = 'sk',
): string {
  const raw = String(status || '').trim();
  if (!raw) return 'Wolt';
  const entry = WOLT_STATUS_LABELS[raw.toLowerCase()];
  return entry ? entry[language] : raw;
}
