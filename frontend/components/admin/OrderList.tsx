'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { DispatchQueueItem } from './DispatchQueueItem';
import { getTenantSlug } from '@/lib/tenant-utils';
import { isSoundNotificationEnabled } from './SoundNotificationSettings';

interface OrderListProps {
  todayOnly?: boolean;
  selectedTenant?: 'all' | string;
  variant?: 'dashboard' | 'page';
}

type DispatchGroupKey =
  | 'new'
  | 'inProgress'
  | 'readyForPickup'
  | 'delivering'
  | 'scheduled'
  | 'recentDone';

type BrandSlug = 'all' | 'pornopizza' | 'partypizza' | 'pizzavnudzi';

const BRAND_FILTER_SLUGS: BrandSlug[] = ['all', 'pornopizza', 'partypizza', 'pizzavnudzi'];

const DISPATCH_GROUPS: Array<{
  key: DispatchGroupKey;
  label: string;
  defaultCollapsed: boolean;
}> = [
  { key: 'new', label: 'Nove', defaultCollapsed: false },
  { key: 'inProgress', label: 'Prebieha', defaultCollapsed: false },
  { key: 'readyForPickup', label: 'Pripravene na vyzdvihnutie', defaultCollapsed: true },
  { key: 'delivering', label: 'Dorucuje sa', defaultCollapsed: true },
  { key: 'scheduled', label: 'Naplanovane', defaultCollapsed: true },
  { key: 'recentDone', label: 'Nedavno dokoncene', defaultCollapsed: false },
];

const BRAND_META: Record<BrandSlug, { label: string; initials: string; color: string }> = {
  all: {
    label: 'Vsetky brandy',
    initials: 'ALL',
    color: 'from-zinc-500 to-zinc-700',
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

const GROUP_META: Record<
  DispatchGroupKey,
  {
    accentClassName: string;
    headerClassName: string;
    helperText: string;
  }
> = {
  new: {
    accentClassName: 'bg-emerald-600',
    headerClassName: 'text-emerald-700',
    helperText: 'Objednavky cakajuce na prvy zasah operatorky.',
  },
  inProgress: {
    accentClassName: 'bg-amber-500',
    headerClassName: 'text-amber-700',
    helperText: 'Prijate objednavky vo vyrobe alebo v potvrdenom stave.',
  },
  readyForPickup: {
    accentClassName: 'bg-teal-500',
    headerClassName: 'text-teal-700',
    helperText: 'Objednavky pripravene na dalsi presun.',
  },
  delivering: {
    accentClassName: 'bg-violet-500',
    headerClassName: 'text-violet-700',
    helperText: 'Objednavky odovzdane na dorucenie.',
  },
  scheduled: {
    accentClassName: 'bg-sky-500',
    headerClassName: 'text-sky-700',
    helperText: 'Buduce objednavky s neskorsim casom spracovania.',
  },
  recentDone: {
    accentClassName: 'bg-zinc-500',
    headerClassName: 'text-zinc-600',
    helperText: 'Posledne dokoncene alebo zrusene objednavky.',
  },
};

const isKnownTenantBrand = (value: string): value is Exclude<BrandSlug, 'all'> =>
  value === 'pornopizza' || value === 'partypizza' || value === 'pizzavnudzi';

const normalizeBrandSlug = (value: string): BrandSlug => {
  if (value === 'all' || isKnownTenantBrand(value)) {
    return value;
  }
  return 'all';
};

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

const getQueueTimer = (
  order: Order,
  now: Date,
): { label: string; tone: 'success' | 'warning' | 'danger' } => {
  const scheduledAt = getScheduledAtFromOrder(order);

  if (scheduledAt) {
    const deltaMinutes = Math.ceil((scheduledAt.getTime() - now.getTime()) / 60000);

    if (deltaMinutes < 0) {
      return {
        label: `-${Math.abs(deltaMinutes)}m`,
        tone: 'danger',
      };
    }

    if (deltaMinutes <= 10) {
      return {
        label: `${deltaMinutes}m`,
        tone: 'warning',
      };
    }

    return {
      label: `${deltaMinutes}m`,
      tone: 'success',
    };
  }

  const ageMinutes = getMinutesSinceCreated(order.createdAt);
  if (ageMinutes >= 35) {
    return { label: `${ageMinutes}m`, tone: 'danger' };
  }
  if (ageMinutes >= 18) {
    return { label: `${ageMinutes}m`, tone: 'warning' };
  }
  return { label: `${ageMinutes}m`, tone: 'success' };
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

const playNewOrderSound = () => {
  try {
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

const getWorkspaceCopy = (variant: NonNullable<OrderListProps['variant']>, todayOnly: boolean) => {
  if (variant === 'dashboard') {
    return {
      eyebrow: 'Live queue',
      title: todayOnly ? 'Dnes na linke' : 'Dispecersky prehlad',
      description: todayOnly
        ? 'Aktivne objednavky pre dnesny den v jednom operatorkom workspace.'
        : 'Prehlad objednavok v kompaktnom dispatch rozlozeni.',
    };
  }

  return {
    eyebrow: 'Dispatch workspace',
    title: todayOnly ? 'Dnesne objednavky' : 'Objednavky na linke',
    description: todayOnly
      ? 'Dnesne objednavky zoradene do dispatch skupin s jednym inspectorom.'
      : 'Operatorky workspace s queue vlavo a inspectorom vpravo. Aktualizacia kazdych 5 sekund.',
  };
};

export function OrderList({
  todayOnly = false,
  selectedTenant,
  variant = 'dashboard',
}: OrderListProps = {}) {
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
    inProgress: false,
    readyForPickup: true,
    delivering: true,
    scheduled: true,
    recentDone: false,
  });
  const isInitialLoad = useRef(true);
  const previousOrderIds = useRef<Set<string>>(new Set());

  const handleUnauthorized = useCallback((source: string) => {
    console.error(`[OrderList] Unauthorized (${source}) - redirecting to login`);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
      sessionStorage.setItem('admin_logged_out', 'true');
      window.location.replace('/login');
    }
  }, []);

  const fetchTenantMapping = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      handleUnauthorized('missing token while loading tenant mapping');
      return;
    }
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

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
        } else if (res.status === 401 || res.status === 403) {
          handleUnauthorized(`tenant mapping ${tenantSlug} ${res.status}`);
          return;
        }
      } catch (error) {
        console.error(`Failed to fetch tenant ${tenantSlug}:`, error);
      }
    }

    setTenantIdToSlug(mapping);
  }, [filters.tenantSlug, handleUnauthorized]);

  const fetchOrders = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (!token) {
      handleUnauthorized('missing token while fetching orders');
      return;
    }

    const headers: HeadersInit = { Authorization: `Bearer ${token}` };
    const scrollPosition = window.scrollY;
    const isInitial = isInitialLoad.current;

    try {
      if (isInitial) {
        setLoading(true);
      }

      if (Object.keys(tenantIdToSlug).length === 0) {
        await fetchTenantMapping();
      }

      const tenantsToFetch =
        filters.tenantSlug === 'all'
          ? ['pornopizza', 'pizzavnudzi', 'partypizza']
          : [filters.tenantSlug];

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
        } else if (res.status === 401 || res.status === 403) {
          const errorText = await res.text().catch(() => '');
          console.error(`[OrderList] ${res.status} Unauthorized:`, errorText);
          handleUnauthorized(`orders ${tenant} ${res.status}`);
          return;
        } else {
          console.error(`Failed to fetch orders for ${tenant}:`, res.status, await res.text());
        }
      }

      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (!isInitial && previousOrderIds.current.size > 0) {
        const currentOrderIds = new Set(allOrders.map((order) => order.id));
        const newOrderIds = Array.from(currentOrderIds).filter((id) => !previousOrderIds.current.has(id));

        if (newOrderIds.length > 0) {
          const newPendingOrders = allOrders.filter(
            (order) => newOrderIds.includes(order.id) && order.status === OrderStatus.PENDING,
          );

          if (newPendingOrders.length > 0) {
            if (isSoundNotificationEnabled()) {
              playNewOrderSound();
            }
            console.log(`Nova objednavka! (${newPendingOrders.length} novych)`);
          }
        }
      }

      previousOrderIds.current = new Set(allOrders.map((order) => order.id));
      setOrders(allOrders);

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
  }, [filters, tenantIdToSlug, fetchTenantMapping, todayOnly, handleUnauthorized]);

  useEffect(() => {
    if (!selectedTenant) return;
    setFilters((prev) => {
      if (prev.tenantSlug === selectedTenant) {
        return prev;
      }
      return { ...prev, tenantSlug: selectedTenant };
    });
  }, [selectedTenant]);

  useEffect(() => {
    isInitialLoad.current = true;
    previousOrderIds.current = new Set();
  }, [filters]);

  useEffect(() => {
    fetchOrders();

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

  const activeOrderCount = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELED,
      ).length,
    [orders],
  );

  const brandCounts = useMemo<Record<BrandSlug, number>>(() => {
    const counts: Record<BrandSlug, number> = {
      all: orders.length,
      pornopizza: 0,
      partypizza: 0,
      pizzavnudzi: 0,
    };

    for (const order of orders) {
      const slug = tenantIdToSlug[order.tenantId];
      if (slug && isKnownTenantBrand(slug)) {
        counts[slug] += 1;
      }
    }

    return counts;
  }, [orders, tenantIdToSlug]);

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
      } else if (res.status === 401 || res.status === 403) {
        handleUnauthorized(`status update ${orderId} ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const toggleGroup = (groupKey: DispatchGroupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const workspaceCopy = getWorkspaceCopy(variant, todayOnly);
  const desktopMinHeightClass = variant === 'page' ? 'min-h-[calc(100vh-13rem)]' : 'min-h-[760px]';
  const desktopScrollClass =
    variant === 'page' ? 'max-h-[calc(100vh-19rem)] overflow-y-auto' : 'max-h-[680px] overflow-y-auto';
  const renderNow = new Date();

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
      <div className="border-b border-zinc-200 bg-white/95 px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-600">
              {workspaceCopy.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 lg:text-3xl">
              {workspaceCopy.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">{workspaceCopy.description}</p>
          </div>

          {!todayOnly && (
            <div className="xl:w-[520px] xl:max-w-[520px]">
              <OrderFilters filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-medium text-zinc-500">Nacitavam objednavky...</div>
      ) : (
        <>
          <div className={`hidden lg:grid lg:grid-cols-[392px_minmax(0,1fr)] ${desktopMinHeightClass}`}>
            <aside className="border-r border-zinc-200 bg-zinc-50/90">
              <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Fronta</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-950">Aktivne skupiny</h3>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Aktivne
                    </div>
                    <div className="mt-1 text-2xl font-black leading-none text-zinc-950">{activeOrderCount}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                  {BRAND_FILTER_SLUGS.map((slug) => {
                    const isActive = filters.tenantSlug === slug;
                    const brand = BRAND_META[slug];
                    return (
                      <button
                        key={slug}
                        onClick={() => setFilters((prev) => ({ ...prev, tenantSlug: slug }))}
                        title={brand.label}
                        className={`relative h-12 w-12 shrink-0 rounded-full border p-[2px] transition-all duration-200 ${
                          isActive
                            ? 'border-zinc-950 bg-zinc-950 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]'
                            : 'border-zinc-200 bg-white hover:border-zinc-400'
                        }`}
                      >
                        <span
                          className={`absolute inset-[2px] flex items-center justify-center rounded-full bg-gradient-to-br ${brand.color}`}
                        >
                          <span className="text-[10px] font-black tracking-[0.18em] text-white">
                            {brand.initials}
                          </span>
                        </span>
                        <span
                          className={`absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full border px-1 text-[10px] font-black ${
                            isActive
                              ? 'border-white bg-zinc-950 text-white'
                              : 'border-zinc-200 bg-white text-zinc-700'
                          }`}
                        >
                          {brandCounts[slug]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Vsetky</div>
                    <div className="mt-1 text-xl font-black text-zinc-950">{orders.length}</div>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Brandy</div>
                    <div className="mt-1 text-xl font-black text-zinc-950">
                      {filters.tenantSlug === 'all' ? '3' : '1'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={desktopScrollClass}>
                {orders.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-zinc-500">Ziadne objednavky pre zvolene filtre.</div>
                ) : (
                  DISPATCH_GROUPS.map((group) => {
                    const sectionOrders = groupedOrders[group.key];
                    const isCollapsed = collapsedGroups[group.key];
                    const groupMeta = GROUP_META[group.key];

                    return (
                      <section key={group.key} className="border-b border-zinc-200 last:border-b-0">
                        <button
                          onClick={() => toggleGroup(group.key)}
                          className="w-full bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs text-zinc-500 transition-transform ${
                                    isCollapsed ? '-rotate-90' : 'rotate-0'
                                  }`}
                                >
                                  ▼
                                </span>
                                <span
                                  className={`text-[12px] font-black uppercase tracking-[0.2em] ${groupMeta.headerClassName}`}
                                >
                                  {group.label}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-zinc-500">{groupMeta.helperText}</p>
                            </div>
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-black text-zinc-700">
                              {sectionOrders.length}
                            </span>
                          </div>
                        </button>

                        {!isCollapsed && (
                          <div className="divide-y divide-zinc-200 bg-zinc-50/60">
                            {sectionOrders.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-zinc-400">Ziadne objednavky</div>
                            ) : (
                              sectionOrders.map((order) => {
                                const isSelected = order.id === selectedOrderId;
                                const tenantSlugForOrder = normalizeBrandSlug(
                                  tenantIdToSlug[order.tenantId] || filters.tenantSlug,
                                );
                                const brand = BRAND_META[tenantSlugForOrder];
                                const queueTimer = getQueueTimer(order, renderNow);
                                const isFinished = order.status === OrderStatus.DELIVERED;
                                const isCanceled = order.status === OrderStatus.CANCELED;
                                const headlineCode = getListHeadlineCode(order);
                                const shortCustomer = getCustomerShortName(order.customer?.name);

                                return (
                                  <DispatchQueueItem
                                    key={order.id}
                                    accentClassName={groupMeta.accentClassName}
                                    brandInitials={brand.initials}
                                    createdLabel={`${formatOrderTime(order.createdAt)} • ${order.items.length} pol.`}
                                    headline={`${headlineCode} — ${brand.label}`}
                                    isCanceled={isCanceled}
                                    isFinished={isFinished}
                                    isSelected={isSelected}
                                    metaLine={`${getOrderNumber(order)} • €${(order.totalCents / 100).toFixed(2)} • ${shortCustomer}`}
                                    onSelect={() => setSelectedOrderId(order.id)}
                                    timerLabel={queueTimer.label}
                                    timerTone={queueTimer.tone}
                                  />
                                );
                              })
                            )}
                          </div>
                        )}
                      </section>
                    );
                  })
                )}
              </div>
            </aside>

            <div className="min-w-0 bg-[#f5f4ef] p-5 lg:p-6">
              {selectedOrder ? (
                <div className="mx-auto h-full max-w-[1180px]">
                  <OrderCard
                    order={selectedOrder}
                    onStatusUpdate={handleStatusUpdate}
                    onOrderRefresh={fetchOrders}
                    isExpanded={true}
                    showToggle={false}
                    tenantSlug={tenantIdToSlug[selectedOrder.tenantId]}
                  />
                </div>
              ) : (
                <div className="flex h-full min-h-[460px] items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white text-sm font-medium text-zinc-500">
                  Vyber objednavku z lavej fronty.
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-zinc-200 lg:hidden">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
                onOrderRefresh={fetchOrders}
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
              <div className="p-6 text-center text-sm text-zinc-500">Ziadne objednavky.</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
