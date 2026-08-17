import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, getCustomizationOptions } from '@pizza-ecosystem/shared';

/**
 * Analytics for the admin dashboard.
 *
 * Revenue definition (single source of truth for the whole admin):
 *   an order counts towards revenue when it is NOT canceled and NOT an unpaid
 *   online order (status PENDING without a cash-on-delivery paymentRef).
 *   Cash-on-delivery orders start in PENDING as well, but there PENDING means
 *   "waiting for the kitchen", not "waiting for payment", so they count.
 *   Refunded orders are canceled orders, so they are already excluded; refunds
 *   are reported separately for visibility.
 */

export const ANALYTICS_TIMEZONE = 'Europe/Bratislava';

export type PaymentMethod = 'online' | 'cod_card' | 'cod_cash';

export interface TimingMetrics {
  avgConfirmSeconds: number;
  avgPreparingSeconds: number;
  avgDeliveredSeconds: number;
  avgLastMileSeconds: number;
  medianConfirmSeconds: number;
  medianPreparingSeconds: number;
  medianDeliveredSeconds: number;
  medianLastMileSeconds: number;
  confirmSamples: number;
  preparingSamples: number;
  deliveredSamples: number;
  lastMileSamples: number;
}

export interface TenantSummary {
  tenantId: string;
  slug: string;
  name: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  canceledCount: number;
  unpaidCount: number;
}

export interface AnalyticsData {
  period: { start: string; end: string; days: number; timezone: string };
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  /** null when the previous period has no data to compare against */
  revenueChange: number | null;
  ordersChange: number | null;
  avgOrderValueChange: number | null;
  previous: { totalRevenue: number; totalOrders: number; averageOrderValue: number };
  canceled: { count: number; rate: number; amountCents: number };
  refunds: { count: number; amountCents: number; pendingCount: number; failedCount: number };
  unpaid: { count: number; amountCents: number };
  ordersByDay: Array<{ date: string; orders: number; revenue: number }>;
  /** [weekday 0=Mon..6=Sun][hour 0..23] → order count (local time) */
  heatmap: number[][];
  payments: Record<PaymentMethod, { count: number; revenue: number }>;
  customers: { unique: number; newCount: number; returningCount: number; repeatRate: number };
  topZips: Array<{ zip: string; city: string; orders: number }>;
  topProducts: Array<{ productId: string; productName: string; sales: number; revenue: number }>;
  topModifiers: Array<{ id: string; name: string; count: number }>;
  ordersByStatus: Record<OrderStatus, number>;
  timingMetrics: TimingMetrics;
  /** Present only for the cross-brand ("all") view */
  tenants?: TenantSummary[];
}

export interface AnalyticsOrder {
  id: string;
  tenantId: string;
  orderNumber: number | null;
  status: OrderStatus;
  totalCents: number;
  subtotalCents: number;
  deliveryFeeCents: number;
  paymentRef: string | null;
  paymentStatus: string | null;
  refundStatus: string | null;
  userId: string | null;
  customer: any;
  address: any;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    priceCents: number;
    modifiers?: any;
    product?: { category: string } | null;
  }>;
  statusHistory: Array<{ status: OrderStatus; createdAt: Date }>;
}

interface LocalParts {
  dateKey: string; // YYYY-MM-DD in local tz
  weekday: number; // 0 = Monday
  hour: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

@Injectable()
export class AnalyticsService {
  private readonly localFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });

  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Classification helpers (exported through the service so tests can use them)
  // ---------------------------------------------------------------------------

  static isCashOnDelivery(paymentRef: string | null | undefined): boolean {
    return !!paymentRef && String(paymentRef).startsWith('cod:');
  }

  static getPaymentMethod(paymentRef: string | null | undefined): PaymentMethod {
    if (paymentRef === 'cod:cash') return 'cod_cash';
    if (paymentRef === 'cod:card') return 'cod_card';
    return 'online';
  }

  /** Unpaid online order: never reached PAID, so it never became a real sale. */
  static isUnpaidOnline(order: { status: OrderStatus; paymentRef: string | null }): boolean {
    return order.status === OrderStatus.PENDING && !AnalyticsService.isCashOnDelivery(order.paymentRef);
  }

  static isRevenueOrder(order: { status: OrderStatus; paymentRef: string | null }): boolean {
    if (order.status === OrderStatus.CANCELED) return false;
    if (AnalyticsService.isUnpaidOnline(order)) return false;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------

  private getLocalParts(date: Date): LocalParts {
    const parts = this.localFormatter.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const hourRaw = parseInt(get('hour'), 10);
    return {
      dateKey: `${get('year')}-${get('month')}-${get('day')}`,
      weekday: WEEKDAY_INDEX[get('weekday')] ?? 0,
      hour: hourRaw === 24 ? 0 : hourRaw, // some ICU versions emit "24" for midnight
    };
  }

  private getLocalDateKey(date: Date): string {
    return this.getLocalParts(date).dateKey;
  }

  /** Every local calendar day between start and end (inclusive), as YYYY-MM-DD. */
  private enumerateLocalDays(start: Date, end: Date): string[] {
    const days: string[] = [];
    const cursor = new Date(start);
    const endKey = this.getLocalDateKey(end);
    let guard = 0;
    // Step by 12h so a DST switch can never skip a local calendar day.
    while (guard < 800) {
      const key = this.getLocalDateKey(cursor);
      if (days[days.length - 1] !== key) days.push(key);
      if (key === endKey) break;
      cursor.setUTCHours(cursor.getUTCHours() + 12);
      guard += 1;
    }
    return days;
  }

  // ---------------------------------------------------------------------------
  // Data access
  // ---------------------------------------------------------------------------

  private isStatusHistoryUnavailable(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('order_status_history') ||
      message.includes('statusHistory') ||
      message.includes('orderStatusHistory')
    );
  }

  private async fetchOrders(
    tenantIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsOrder[]> {
    const where = {
      tenantId: { in: tenantIds },
      createdAt: { gte: startDate, lte: endDate },
    };
    const itemsInclude = {
      include: { product: { select: { category: true } } },
    };

    let rows: any[];
    try {
      rows = await this.prisma.order.findMany({
        where,
        include: {
          items: itemsInclude,
          statusHistory: {
            select: { status: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      if (!this.isStatusHistoryUnavailable(error)) throw error;
      rows = await this.prisma.order.findMany({ where, include: { items: itemsInclude } });
    }

    return (rows || []).map((order) => ({
      ...order,
      status: order.status as OrderStatus,
      items: order.items || [],
      statusHistory: (order.statusHistory || []).map((entry: any) => ({
        status: entry.status as OrderStatus,
        createdAt: entry.createdAt,
      })),
    }));
  }

  /** Lightweight rows for the previous period (revenue comparison only). */
  private async fetchPreviousOrders(
    tenantIds: string[],
    prevStart: Date,
    start: Date,
  ): Promise<Array<{ status: OrderStatus; totalCents: number; paymentRef: string | null }>> {
    const rows = await this.prisma.order.findMany({
      where: {
        tenantId: { in: tenantIds },
        createdAt: { gte: prevStart, lt: start },
      },
      select: { status: true, totalCents: true, paymentRef: true },
    });
    return (rows || []).map((r) => ({ ...r, status: r.status as OrderStatus }));
  }

  /** Customer identities that ordered before the period (for new vs. returning). */
  private async fetchPriorCustomerKeys(tenantIds: string[], start: Date): Promise<Set<string>> {
    const rows = await this.prisma.order.findMany({
      where: {
        tenantId: { in: tenantIds },
        createdAt: { lt: start },
        status: { not: OrderStatus.CANCELED },
      },
      select: { tenantId: true, userId: true, customer: true },
    });
    const keys = new Set<string>();
    for (const row of rows || []) {
      for (const key of this.getCustomerKeys(row)) keys.add(key);
    }
    return keys;
  }

  // ---------------------------------------------------------------------------
  // Customer identity
  // ---------------------------------------------------------------------------

  private normalizeEmail(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    return v.includes('@') ? v : null;
  }

  private normalizePhone(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 9) return null;
    return digits.slice(-9); // national significant number is enough to match
  }

  /**
   * All identity keys for an order, scoped per tenant. E-mail first: it is the
   * most stable identity across guest and logged-in checkouts.
   */
  private getCustomerKeys(order: { tenantId: string; userId: string | null; customer: any }): string[] {
    const keys: string[] = [];
    const email = this.normalizeEmail(order.customer?.email);
    if (email) keys.push(`${order.tenantId}|e|${email}`);
    const phone = this.normalizePhone(order.customer?.phone);
    if (phone) keys.push(`${order.tenantId}|p|${phone}`);
    if (order.userId) keys.push(`${order.tenantId}|u|${order.userId}`);
    return keys;
  }

  /** One stable key per customer (prefers e-mail, then phone, then userId). */
  private getPrimaryCustomerKey(order: { tenantId: string; userId: string | null; customer: any }): string | null {
    return this.getCustomerKeys(order)[0] || null;
  }

  // ---------------------------------------------------------------------------
  // Timing
  // ---------------------------------------------------------------------------

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  private diffSeconds(start: Date | null, end: Date | null): number | null {
    if (!start || !end) return null;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null;
    return Math.round((e - s) / 1000);
  }

  private statusAt(
    history: Array<{ status: OrderStatus; createdAt: Date }>,
    target: OrderStatus,
    fallback: Date | null,
  ): Date | null {
    const match = history.find((h) => h.status === target);
    if (match) return new Date(match.createdAt);
    return fallback ? new Date(fallback) : null;
  }

  private calculateTimingMetrics(orders: AnalyticsOrder[]): TimingMetrics {
    const confirm: number[] = [];
    const preparing: number[] = [];
    const delivered: number[] = [];
    const lastMile: number[] = [];

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELED) continue;
      const history = [...order.statusHistory]
        .map((h) => ({ status: h.status, createdAt: new Date(h.createdAt) }))
        .filter((h) => !Number.isNaN(h.createdAt.getTime()))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const paidAt = this.statusAt(history, OrderStatus.PAID, order.status === OrderStatus.PAID ? order.updatedAt : null);
      const preparingAt = this.statusAt(history, OrderStatus.PREPARING, order.status === OrderStatus.PREPARING ? order.updatedAt : null);
      const outAt =
        this.statusAt(history, OrderStatus.OUT_FOR_DELIVERY, order.status === OrderStatus.OUT_FOR_DELIVERY ? order.updatedAt : null) ||
        this.statusAt(history, OrderStatus.READY, order.status === OrderStatus.READY ? order.updatedAt : null);
      const deliveredAt = this.statusAt(history, OrderStatus.DELIVERED, order.status === OrderStatus.DELIVERED ? order.updatedAt : null);

      const c = this.diffSeconds(order.createdAt, paidAt);
      if (c !== null) confirm.push(c);
      const p = this.diffSeconds(order.createdAt, preparingAt);
      if (p !== null) preparing.push(p);
      const d = this.diffSeconds(order.createdAt, deliveredAt);
      if (d !== null) delivered.push(d);
      const l = this.diffSeconds(outAt, deliveredAt);
      if (l !== null) lastMile.push(l);
    }

    return {
      avgConfirmSeconds: this.average(confirm),
      avgPreparingSeconds: this.average(preparing),
      avgDeliveredSeconds: this.average(delivered),
      avgLastMileSeconds: this.average(lastMile),
      medianConfirmSeconds: this.median(confirm),
      medianPreparingSeconds: this.median(preparing),
      medianDeliveredSeconds: this.median(delivered),
      medianLastMileSeconds: this.median(lastMile),
      confirmSamples: confirm.length,
      preparingSamples: preparing.length,
      deliveredSamples: delivered.length,
      lastMileSamples: lastMile.length,
    };
  }

  // ---------------------------------------------------------------------------
  // Modifiers
  // ---------------------------------------------------------------------------

  private collectModifierCounts(
    orders: AnalyticsOrder[],
  ): Array<{ id: string; name: string; count: number }> {
    const counts = new Map<string, { name: string; count: number }>();

    for (const order of orders) {
      for (const item of order.items) {
        let modifiers: any = item.modifiers;
        if (!modifiers) continue;
        if (typeof modifiers === 'string') {
          try {
            modifiers = JSON.parse(modifiers);
          } catch {
            continue;
          }
        }
        if (typeof modifiers !== 'object') continue;

        const categories = getCustomizationOptions(item.product?.category || 'PIZZA');
        for (const [categoryId, selected] of Object.entries(modifiers)) {
          const category = categories.find((c) => c.id === categoryId);
          if (!category) continue;
          const ids = Array.isArray(selected) ? selected : selected ? [selected] : [];
          for (const optionId of ids) {
            if (typeof optionId !== 'string') continue;
            const option = category.options.find((o) => o.id === optionId);
            if (!option) continue;
            // Only "extras": paid options or anything from an optional category
            // (toppings). Free defaults like "classic dough" carry no signal.
            const isExtra = (option.price || 0) > 0 || !category.required;
            if (!isExtra) continue;
            const key = `${categoryId}:${optionId}`;
            const current = counts.get(key) || { name: option.name, count: 0 };
            current.count += item.quantity || 1;
            counts.set(key, current);
          }
        }
      }
    }

    return Array.from(counts.entries())
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // ---------------------------------------------------------------------------
  // Core computation (pure, works on already-fetched orders)
  // ---------------------------------------------------------------------------

  private percentChange(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  private computeSummary(orders: AnalyticsOrder[]) {
    const revenueOrders = orders.filter((o) => AnalyticsService.isRevenueOrder(o));
    const totalRevenue = revenueOrders.reduce((s, o) => s + (o.totalCents || 0), 0);
    const totalOrders = revenueOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const canceledOrders = orders.filter((o) => o.status === OrderStatus.CANCELED);
    const unpaidOrders = orders.filter((o) => AnalyticsService.isUnpaidOnline(o));
    return { revenueOrders, totalRevenue, totalOrders, averageOrderValue, canceledOrders, unpaidOrders };
  }

  private computeAnalytics(
    orders: AnalyticsOrder[],
    prevOrders: Array<{ status: OrderStatus; totalCents: number; paymentRef: string | null }>,
    priorCustomerKeys: Set<string>,
    startDate: Date,
    endDate: Date,
  ): AnalyticsData {
    const { revenueOrders, totalRevenue, totalOrders, averageOrderValue, canceledOrders, unpaidOrders } =
      this.computeSummary(orders);

    // Previous period
    const prevRevenueOrders = prevOrders.filter((o) => AnalyticsService.isRevenueOrder(o));
    const prevRevenue = prevRevenueOrders.reduce((s, o) => s + (o.totalCents || 0), 0);
    const prevCount = prevRevenueOrders.length;
    const prevAov = prevCount > 0 ? Math.round(prevRevenue / prevCount) : 0;

    // Cancellations & refunds
    const canceledAmount = canceledOrders.reduce((s, o) => s + (o.totalCents || 0), 0);
    const decidedOrders = orders.filter((o) => !AnalyticsService.isUnpaidOnline(o));
    const cancelRate = decidedOrders.length > 0 ? Math.round((canceledOrders.length / decidedOrders.length) * 1000) / 10 : 0;
    const refunded = orders.filter((o) => o.refundStatus === 'refunded' || o.refundStatus === 'partially_refunded');
    const refunds = {
      count: refunded.length,
      amountCents: orders.filter((o) => o.refundStatus === 'refunded').reduce((s, o) => s + (o.totalCents || 0), 0),
      pendingCount: orders.filter((o) => o.refundStatus === 'refund_pending').length,
      failedCount: orders.filter((o) => o.refundStatus === 'refund_failed').length,
    };
    const unpaid = {
      count: unpaidOrders.length,
      amountCents: unpaidOrders.reduce((s, o) => s + (o.totalCents || 0), 0),
    };

    // Per day + heatmap (local time)
    const byDay = new Map<string, { orders: number; revenue: number }>();
    const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const order of revenueOrders) {
      const parts = this.getLocalParts(new Date(order.createdAt));
      const day = byDay.get(parts.dateKey) || { orders: 0, revenue: 0 };
      day.orders += 1;
      day.revenue += order.totalCents || 0;
      byDay.set(parts.dateKey, day);
      heatmap[parts.weekday][parts.hour] += 1;
    }
    const ordersByDay = this.enumerateLocalDays(startDate, endDate).map((date) => ({
      date,
      orders: byDay.get(date)?.orders || 0,
      revenue: byDay.get(date)?.revenue || 0,
    }));

    // Payments
    const payments: Record<PaymentMethod, { count: number; revenue: number }> = {
      online: { count: 0, revenue: 0 },
      cod_card: { count: 0, revenue: 0 },
      cod_cash: { count: 0, revenue: 0 },
    };
    for (const order of revenueOrders) {
      const method = AnalyticsService.getPaymentMethod(order.paymentRef);
      payments[method].count += 1;
      payments[method].revenue += order.totalCents || 0;
    }

    // Customers: new vs. returning (within the period, per tenant identity)
    const seenInPeriod = new Set<string>();
    let newCount = 0;
    let returningCount = 0;
    for (const order of revenueOrders) {
      const primary = this.getPrimaryCustomerKey(order);
      if (!primary || seenInPeriod.has(primary)) continue;
      seenInPeriod.add(primary);
      const keys = this.getCustomerKeys(order);
      const isReturning = keys.some((k) => priorCustomerKeys.has(k));
      if (isReturning) returningCount += 1;
      else newCount += 1;
    }
    const uniqueCustomers = newCount + returningCount;
    const customers = {
      unique: uniqueCustomers,
      newCount,
      returningCount,
      repeatRate: uniqueCustomers > 0 ? Math.round((returningCount / uniqueCustomers) * 100) : 0,
    };

    // Delivery areas
    const zipMap = new Map<string, { city: string; orders: number }>();
    for (const order of revenueOrders) {
      const zipRaw = order.address?.zip ?? order.address?.postalCode ?? order.address?.zipCode;
      const zip = typeof zipRaw === 'string' ? zipRaw.replace(/\s+/g, '').trim() : '';
      if (!zip) continue;
      const city = typeof order.address?.city === 'string' ? order.address.city.trim() : '';
      const current = zipMap.get(zip) || { city, orders: 0 };
      current.orders += 1;
      if (!current.city && city) current.city = city;
      zipMap.set(zip, current);
    }
    const topZips = Array.from(zipMap.entries())
      .map(([zip, v]) => ({ zip: zip.length === 5 ? `${zip.slice(0, 3)} ${zip.slice(3)}` : zip, city: v.city, orders: v.orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8);

    // Products — grouped by name so the same pizza sold under several brands
    // (different product IDs per tenant) shows up once in the cross-brand view.
    const productStats = new Map<string, { productId: string; name: string; sales: number; revenue: number }>();
    for (const order of revenueOrders) {
      for (const item of order.items) {
        const name = (item.productName || 'Neznámy produkt').trim();
        const key = name.toLowerCase();
        const current = productStats.get(key) || { productId: item.productId, name, sales: 0, revenue: 0 };
        current.sales += item.quantity;
        current.revenue += (item.priceCents || 0) * item.quantity;
        productStats.set(key, current);
      }
    }
    const topProducts = Array.from(productStats.values())
      .map((s) => ({ productId: s.productId, productName: s.name, sales: s.sales, revenue: s.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Status distribution (all orders, including canceled/unpaid)
    const ordersByStatus: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PREPARING: 0,
      READY: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELED: 0,
    };
    for (const order of orders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    const periodDays = ordersByDay.length;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: periodDays,
        timezone: ANALYTICS_TIMEZONE,
      },
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueChange: this.percentChange(totalRevenue, prevRevenue),
      ordersChange: this.percentChange(totalOrders, prevCount),
      avgOrderValueChange: this.percentChange(averageOrderValue, prevAov),
      previous: { totalRevenue: prevRevenue, totalOrders: prevCount, averageOrderValue: prevAov },
      canceled: { count: canceledOrders.length, rate: cancelRate, amountCents: canceledAmount },
      refunds,
      unpaid,
      ordersByDay,
      heatmap,
      payments,
      customers,
      topZips,
      topProducts,
      topModifiers: this.collectModifierCounts(revenueOrders),
      ordersByStatus,
      timingMetrics: this.calculateTimingMetrics(orders),
    };
  }

  private getPreviousPeriodStart(startDate: Date, endDate: Date): Date {
    const lengthMs = Math.max(endDate.getTime() - startDate.getTime(), 24 * 60 * 60 * 1000);
    return new Date(startDate.getTime() - lengthMs);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async getAnalytics(tenantId: string, startDate: Date, endDate: Date): Promise<AnalyticsData> {
    const prevStart = this.getPreviousPeriodStart(startDate, endDate);
    const [orders, prevOrders, priorKeys] = await Promise.all([
      this.fetchOrders([tenantId], startDate, endDate),
      this.fetchPreviousOrders([tenantId], prevStart, startDate),
      this.fetchPriorCustomerKeys([tenantId], startDate),
    ]);
    return this.computeAnalytics(orders, prevOrders, priorKeys, startDate, endDate);
  }

  async getAllTenantsAnalytics(startDate: Date, endDate: Date): Promise<AnalyticsData> {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true },
    });
    const tenantIds = tenants.map((t) => t.id);
    if (tenantIds.length === 0) {
      return this.computeAnalytics([], [], new Set(), startDate, endDate);
    }

    const prevStart = this.getPreviousPeriodStart(startDate, endDate);
    const [orders, prevOrders, priorKeys] = await Promise.all([
      this.fetchOrders(tenantIds, startDate, endDate),
      this.fetchPreviousOrders(tenantIds, prevStart, startDate),
      this.fetchPriorCustomerKeys(tenantIds, startDate),
    ]);

    const combined = this.computeAnalytics(orders, prevOrders, priorKeys, startDate, endDate);
    combined.tenants = tenants
      .map((tenant) => {
        const own = orders.filter((o) => o.tenantId === tenant.id);
        const s = this.computeSummary(own);
        return {
          tenantId: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          totalRevenue: s.totalRevenue,
          totalOrders: s.totalOrders,
          averageOrderValue: s.averageOrderValue,
          canceledCount: s.canceledOrders.length,
          unpaidCount: s.unpaidOrders.length,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
    return combined;
  }

  /**
   * CSV export of orders in the period. Deliberately without personal data
   * (name, e-mail, phone, street) — it is a sales export, not a customer list.
   */
  async exportOrdersCsv(tenantIds: string[] | null, startDate: Date, endDate: Date): Promise<string> {
    let ids = tenantIds;
    let tenantNames = new Map<string, string>();
    if (!ids) {
      const tenants = await this.prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
      ids = tenants.map((t) => t.id);
      tenantNames = new Map(tenants.map((t) => [t.id, t.name]));
    } else {
      const tenants = await this.prisma.tenant.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      tenantNames = new Map(tenants.map((t) => [t.id, t.name]));
    }

    const orders = ids.length ? await this.fetchOrders(ids, startDate, endDate) : [];
    orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const dateTime = new Intl.DateTimeFormat('sk-SK', {
      timeZone: ANALYTICS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const money = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
    const paymentLabel: Record<PaymentMethod, string> = {
      online: 'online',
      cod_card: 'karta pri doručení',
      cod_cash: 'hotovosť pri doručení',
    };
    const esc = (value: unknown) => {
      const s = value === null || value === undefined ? '' : String(value);
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = [
      'Brand',
      'Číslo objednávky',
      'Vytvorená',
      'Stav',
      'Počíta sa do tržieb',
      'Platba',
      'Stav platby',
      'Refund',
      'Medzisúčet (€)',
      'Doprava (€)',
      'Celkom (€)',
      'Položiek',
      'Produkty',
      'Mesto',
      'PSČ',
    ];

    const lines = [header.map(esc).join(';')];
    for (const order of orders) {
      const itemsSummary = order.items
        .map((i) => `${i.quantity}× ${i.productName}`)
        .join(', ');
      lines.push(
        [
          tenantNames.get(order.tenantId) || order.tenantId,
          order.orderNumber ? String(order.orderNumber).padStart(4, '0') : order.id.slice(0, 8),
          dateTime.format(new Date(order.createdAt)),
          order.status,
          AnalyticsService.isRevenueOrder(order) ? 'áno' : 'nie',
          paymentLabel[AnalyticsService.getPaymentMethod(order.paymentRef)],
          order.paymentStatus || '',
          order.refundStatus || '',
          money(order.subtotalCents || 0),
          money(order.deliveryFeeCents || 0),
          money(order.totalCents || 0),
          order.items.reduce((s, i) => s + (i.quantity || 0), 0),
          itemsSummary,
          order.address?.city || '',
          order.address?.zip || order.address?.postalCode || '',
        ]
          .map(esc)
          .join(';'),
      );
    }

    // BOM so Excel opens UTF-8 (diacritics) correctly; semicolon = SK locale default
    return `﻿${lines.join('\r\n')}\r\n`;
  }
}
