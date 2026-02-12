'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { getTenantSlug } from '@/lib/tenant-utils';
import { isSoundNotificationEnabled } from './SoundNotificationSettings';

interface OrderListProps {
  todayOnly?: boolean;
  selectedTenant?: 'all' | string;
}

type DispatchGroupKey =
  | 'new'
  | 'inProgress'
  | 'readyForPickup'
  | 'delivering'
  | 'scheduled'
  | 'recentDone';

const DISPATCH_GROUPS: Array<{
  key: DispatchGroupKey;
  label: string;
  defaultCollapsed: boolean;
}> = [
  { key: 'new', label: 'Nove', defaultCollapsed: false },
  { key: 'inProgress', label: 'Prebieha', defaultCollapsed: true },
  { key: 'readyForPickup', label: 'Pripravene na vyzdvihnutie', defaultCollapsed: true },
  { key: 'delivering', label: 'Dorucuje sa', defaultCollapsed: true },
  { key: 'scheduled', label: 'Naplanovane', defaultCollapsed: true },
  { key: 'recentDone', label: 'Nedavno dokoncene', defaultCollapsed: false },
];

const BRAND_META: Record<string, { label: string; initials: string; color: string }> = {
  all: {
    label: 'Vsetky',
    initials: 'ALL',
    color: 'from-slate-500 to-slate-700',
  },
  pornopizza: {
    label: 'Porno Pizza',
    initials: 'PP',
    color: 'from-pink-500 to-fuchsia-700',
  },
  partypizza: {
    label: 'Party Pizza',
    initials: 'PT',
    color: 'from-orange-500 to-red-600',
  },
  pizzavnudzi: {
    label: 'Pizza v Nudzi',
    initials: 'VN',
    color: 'from-lime-500 to-emerald-700',
  },
};

const GROUP_ACCENT: Record<DispatchGroupKey, string> = {
  new: 'text-emerald-700',
  inProgress: 'text-amber-700',
  readyForPickup: 'text-teal-700',
  delivering: 'text-violet-700',
  scheduled: 'text-sky-700',
  recentDone: 'text-gray-600',
};

const GROUP_ROW_COLOR: Record<DispatchGroupKey, string> = {
  new: 'bg-emerald-600',
  inProgress: 'bg-amber-500',
  readyForPickup: 'bg-teal-500',
  delivering: 'bg-violet-500',
  scheduled: 'bg-sky-500',
  recentDone: 'bg-emerald-700',
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getOrderNumber = (order: Order): string => {
  if (order.orderNumber != null && order.orderNumber > 0) {
    return `#${order.orderNumber.toString().padStart(4, '0')}`;
  }
  return `#${order.id.slice(0, 8).toUpperCase()}`;
};

const formatOrderTime = (createdAt: Date): string => {
  const date = new Date(createdAt);
  return date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
};

const getListHeadlineCode = (order: Order): string => {
  const raw = order.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (raw.length >= 5) {
    return `#${raw.slice(raw.length - 5)}`;
  }
  return getOrderNumber(order);
};

const getCustomerShortName = (fullName: string | undefined): string => {
  if (!fullName) return 'Customer';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

const getMinutesSinceCreated = (createdAt: Date): number => {
  const createdMs = new Date(createdAt).getTime();
  const diffMs = Date.now() - createdMs;
  return Math.max(0, Math.floor(diffMs / 60000));
};

const parseOptionalDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getScheduledAtFromOrder = (order: Order): Date | null => {
  const maybeOrder = order as any;
  return parseOptionalDate(
    maybeOrder?.scheduledAt ??
      maybeOrder?.scheduledFor ??
      maybeOrder?.preferredAt ??
      maybeOrder?.deliveryAt,
  );
};

const getDispatchGroupForOrder = (order: Order, now: Date): DispatchGroupKey => {
  const scheduledAt = getScheduledAtFromOrder(order);
  if (
    scheduledAt &&
    scheduledAt.getTime() > now.getTime() &&
    (order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.PREPARING)
  ) {
    return 'scheduled';
  }

  switch (order.status) {
    case OrderStatus.PENDING:
      return 'new';
    case OrderStatus.PAID:
    case OrderStatus.PREPARING:
      return 'inProgress';
    case OrderStatus.READY:
      return 'readyForPickup';
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'delivering';
    case OrderStatus.DELIVERED:
    case OrderStatus.CANCELED:
    default:
      return 'recentDone';
  }
};

// Funkcia na prehratie zvuku pri novej objednávke
const playNewOrderSound = () => {
  try {
    // Vytvor jednoduchý beep zvuk pomocou Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
};

export function OrderList({ todayOnly = false, selectedTenant }: OrderListProps = {}) {
  // Get current tenant as default
  const currentTenant = selectedTenant || getTenantSlug();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    tenantSlug: currentTenant,
    status: 'all',
    startDate: todayOnly ? getTodayDate() : '',
    endDate: todayOnly ? getTodayDate() : '',
  });
  const [loading, setLoading] = useState(true);
  const [tenantIdToSlug, setTenantIdToSlug] = useState<Record<string, string>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<DispatchGroupKey, boolean>>({
    new: false,
    inProgress: true,
    readyForPickup: true,
    delivering: true,
    scheduled: true,
    recentDone: false,
  });
  const isInitialLoad = useRef(true);

  // Ref na uloženie predchádzajúcich order IDs pre detekciu nových objednávok
  const previousOrderIds = useRef<Set<string>>(new Set());

  // Cache tenant ID to slug mapping
  const fetchTenantMapping = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    // Determine which tenants to fetch based on current filter
    const tenantsToFetch =
      filters.tenantSlug === 'all'
        ? ['pornopizza', 'pizzavnudzi', 'partypizza']
        : [filters.tenantSlug];

    const mapping: Record<string, string> = {};
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    for (const tenantSlug of tenantsToFetch) {
      try {
        const res = await fetch(`${API_URL}/api/tenants/${tenantSlug}`, { headers });
        if (res.ok) {
          const tenantData = await res.json();
          mapping[tenantData.id] = tenantSlug;
        }
      } catch (e) {
        console.error(`Failed to fetch tenant ${tenantSlug}:`, e);
      }
    }

    setTenantIdToSlug(mapping);
  }, [filters.tenantSlug]);

  const fetchOrders = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    // If no token, redirect to login immediately
    if (!token) {
      console.log('No auth token found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    const headers: HeadersInit = { Authorization: `Bearer ${token}` };

    // Save scroll position before update
    const scrollPosition = window.scrollY;
    const isInitial = isInitialLoad.current;

    try {
      // Only show loading on initial load, not on auto-refresh
      if (isInitial) {
        setLoading(true);
      }

      // Fetch tenant mapping if not cached
      if (Object.keys(tenantIdToSlug).length === 0) {
        await fetchTenantMapping();
      }

      // Determine which tenants to fetch from based on filter
      const tenantsToFetch =
        filters.tenantSlug === 'all'
          ? ['pornopizza', 'pizzavnudzi', 'partypizza']
          : [filters.tenantSlug];

      // If todayOnly, always use today's date
      const todayDate = getTodayDate();
      const startDate = todayOnly ? todayDate : filters.startDate;
      const endDate = todayOnly ? todayDate : filters.endDate;

      const allOrders: Order[] = [];

      for (const tenant of tenantsToFetch) {
        const params = new URLSearchParams();
        if (filters.status !== 'all') params.set('status', filters.status);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        params.set('tenantSlug', tenant);

        const res = await fetch(`${API_URL}/api/orders?${params}`, { headers });

        if (res.ok) {
          const tenantOrders = await res.json();
          allOrders.push(...tenantOrders);
        } else if (res.status === 401) {
          const errorText = await res.text().catch(() => '');
          console.error('[OrderList] 401 Unauthorized:', errorText);
          continue;
        } else {
          console.error(`Failed to fetch orders for ${tenant}:`, res.status, await res.text());
        }
      }

      // Sort by date, newest first
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Detekcia nových objednávok (len ak to nie je prvý load)
      if (!isInitial && previousOrderIds.current.size > 0) {
        const currentOrderIds = new Set(allOrders.map((o) => o.id));
        const newOrderIds = Array.from(currentOrderIds).filter((id) => !previousOrderIds.current.has(id));

        // Ak sú nové objednávky, prehraj zvuk
        if (newOrderIds.length > 0) {
          // Filtruj len nové objednávky s PENDING statusom (nepridávať zvuk pre staré objednávky)
          const newPendingOrders = allOrders.filter(
            (o) => newOrderIds.includes(o.id) && o.status === 'PENDING',
          );

          if (newPendingOrders.length > 0) {
            // Prehraj zvuk len ak sú zvukové upozornenia zapnuté
            if (isSoundNotificationEnabled()) {
              playNewOrderSound();
            }
            console.log(`Nova objednavka! (${newPendingOrders.length} novych)`);
          }
        }
      }

      previousOrderIds.current = new Set(allOrders.map((o) => o.id));
      setOrders(allOrders);

      // Restore scroll position after update (only if not initial load)
      if (!isInitial) {
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto',
          });
        }, 0);
      }

      if (isInitial) {
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [filters, tenantIdToSlug, fetchTenantMapping, todayOnly]);

  // Update filters when selectedTenant changes
  useEffect(() => {
    if (selectedTenant && selectedTenant !== filters.tenantSlug) {
      setFilters((prev) => ({ ...prev, tenantSlug: selectedTenant }));
    }
  }, [selectedTenant, filters.tenantSlug]);

  // Reset initial load when filters change
  useEffect(() => {
    isInitialLoad.current = true;
    previousOrderIds.current = new Set();
  }, [filters]);

  useEffect(() => {
    fetchOrders();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (orders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const groupedOrders = useMemo<Record<DispatchGroupKey, Order[]>>(() => {
    const grouped: Record<DispatchGroupKey, Order[]> = {
      new: [],
      inProgress: [],
      readyForPickup: [],
      delivering: [],
      scheduled: [],
      recentDone: [],
    };

    const now = new Date();
    for (const order of orders) {
      const groupKey = getDispatchGroupForOrder(order, now);
      grouped[groupKey].push(order);
    }

    return grouped;
  }, [orders]);

  const expandedGroupCount = useMemo(
    () => DISPATCH_GROUPS.filter((group) => !collapsedGroups[group.key]).length,
    [collapsedGroups],
  );

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) => prev.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item)));
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const setTenantFilterFromIcon = (tenantSlug: string) => {
    setFilters((prev) => ({ ...prev, tenantSlug }));
  };

  const toggleGroup = (groupKey: DispatchGroupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-md text-gray-900 border border-gray-200 overflow-hidden">
      <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Orders</h2>
        {todayOnly ? (
          <div className="mt-2 text-sm text-gray-600">
            Showing orders from today ({new Date().toLocaleDateString('sk-SK')})
          </div>
        ) : (
          <div className="mt-4">
            <OrderFilters filters={filters} onChange={setFilters} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-center text-gray-600">Loading...</div>
      ) : (
        <>
          {/* Dispatch-style desktop layout */}
          <div className="hidden lg:grid lg:grid-cols-[370px_minmax(0,1fr)] min-h-[700px]">
            <div className="border-r border-gray-200 bg-gray-50/70">
              <div className="px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Brands</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {(['all', 'pornopizza', 'partypizza', 'pizzavnudzi'] as const).map((slug) => {
                    const isActive = filters.tenantSlug === slug;
                    const brand = BRAND_META[slug];
                    return (
                      <button
                        key={slug}
                        onClick={() => setTenantFilterFromIcon(slug)}
                        title={brand.label}
                        className={`relative h-11 w-11 rounded-full border transition-all ${
                          isActive
                            ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900 scale-105'
                            : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                        }`}
                      >
                        <span
                          className={`absolute inset-0 rounded-full bg-gradient-to-br ${brand.color}`}
                          aria-hidden="true"
                        />
                        <span className="relative z-10 text-[10px] font-black tracking-wide text-white">
                          {brand.initials}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>Filtre ({expandedGroupCount}/{DISPATCH_GROUPS.length})</span>
                  <span>{orders.length} objednavok</span>
                </div>
              </div>

              <div className="max-h-[620px] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No orders found</div>
                ) : (
                  <div>
                    {DISPATCH_GROUPS.map((group) => {
                      const sectionOrders = groupedOrders[group.key];
                      const isCollapsed = collapsedGroups[group.key];
                      const count = sectionOrders.length;

                      return (
                        <section key={group.key} className="border-b border-gray-200 last:border-b-0">
                          <button
                            onClick={() => toggleGroup(group.key)}
                            className="w-full px-3 py-2.5 bg-white text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-xs text-gray-500 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                              >
                                ▼
                              </span>
                              <span className={`text-[12px] font-semibold uppercase tracking-wide ${GROUP_ACCENT[group.key]}`}>
                                {group.label}
                              </span>
                            </div>
                            <span className="text-[12px] font-semibold text-gray-500">{count}</span>
                          </button>

                          {!isCollapsed && (
                            <div className="divide-y divide-gray-200 bg-gray-50/40">
                              {count === 0 ? (
                                <div className="px-4 py-2 text-xs text-gray-400">Ziadne objednavky</div>
                              ) : (
                                sectionOrders.map((order) => {
                                  const isSelected = order.id === selectedOrderId;
                                  const tenantSlugForOrder = tenantIdToSlug[order.tenantId] || filters.tenantSlug;
                                  const brand = BRAND_META[tenantSlugForOrder] || BRAND_META.all;
                                  const ageMinutes = getMinutesSinceCreated(order.createdAt);
                                  const isFinished = order.status === OrderStatus.DELIVERED;
                                  const isCanceled = order.status === OrderStatus.CANCELED;
                                  const headlineCode = getListHeadlineCode(order);
                                  const shortCustomer = getCustomerShortName(order.customer?.name);

                                  return (
                                    <button
                                      key={order.id}
                                      onClick={() => setSelectedOrderId(order.id)}
                                      className={`w-full text-left transition-colors ${
                                        isSelected ? 'bg-blue-50/70' : 'bg-transparent hover:bg-white'
                                      }`}
                                    >
                                      <div className="flex items-stretch min-h-[72px]">
                                        <div className={`w-10 flex items-center justify-center text-white ${GROUP_ROW_COLOR[group.key]}`}>
                                          <span className="text-[11px]">◉</span>
                                        </div>
                                        <div className="flex-1 min-w-0 px-3 py-2.5 flex items-center justify-between gap-3">
                                          <div className="min-w-0">
                                            <p className="font-bold text-[19px] text-gray-900 leading-tight truncate">
                                              {headlineCode} - {brand.label}
                                            </p>
                                            <p className="mt-1 text-[13px] text-gray-600 truncate">
                                              {getOrderNumber(order)} - €{(order.totalCents / 100).toFixed(2)}, {shortCustomer}
                                            </p>
                                          </div>

                                          <div className="w-[68px] shrink-0 flex flex-col items-center justify-center gap-1">
                                            {isFinished && (
                                              <>
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-600 text-emerald-600 text-sm font-black bg-white">
                                                  ✓
                                                </span>
                                                <span className="text-[9px] uppercase tracking-wide font-black text-emerald-600 leading-none text-center">
                                                  DOKONCENE
                                                </span>
                                              </>
                                            )}
                                            {isCanceled && (
                                              <>
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-rose-600 text-rose-600 text-sm font-black bg-white">
                                                  ✕
                                                </span>
                                                <span className="text-[9px] uppercase tracking-wide font-black text-rose-600 leading-none text-center">
                                                  ZRUSENE
                                                </span>
                                              </>
                                            )}
                                            {!isFinished && !isCanceled && (
                                              <span className="inline-flex min-w-[38px] h-9 px-1 items-center justify-center rounded-full border-2 border-emerald-600 text-[11px] font-bold text-emerald-700 bg-white">
                                                {ageMinutes}m
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 lg:p-6 overflow-y-auto">
              {selectedOrder ? (
                <OrderCard
                  order={selectedOrder}
                  onStatusUpdate={handleStatusUpdate}
                  isExpanded={true}
                  showToggle={false}
                />
              ) : (
                <div className="h-full min-h-[420px] flex items-center justify-center text-gray-500">
                  Select order from the left list
                </div>
              )}
            </div>
          </div>

          {/* Existing mobile/tablet cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                isExpanded={expandedOrders.has(order.id)}
                onToggleExpand={(orderId) => {
                  setExpandedOrders((prev) => {
                    const next = new Set(prev);
                    if (next.has(orderId)) {
                      next.delete(orderId);
                    } else {
                      next.add(orderId);
                    }
                    return next;
                  });
                }}
                tenantSlug={tenantIdToSlug[order.tenantId] || filters.tenantSlug}
              />
            ))}

            {orders.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No orders found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
