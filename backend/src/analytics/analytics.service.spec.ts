import { OrderStatus } from '@pizza-ecosystem/shared';
import { AnalyticsService } from './analytics.service';
import { resolveAnalyticsPeriod, zonedStartOfDay, zonedEndOfDay } from './analytics-period';

type OrderOverrides = Partial<{
  id: string;
  tenantId: string;
  status: OrderStatus;
  totalCents: number;
  paymentRef: string | null;
  refundStatus: string | null;
  userId: string | null;
  customer: any;
  address: any;
  createdAt: Date;
  updatedAt: Date;
  items: any[];
  statusHistory: any[];
}>;

function order(overrides: OrderOverrides = {}) {
  const createdAt = overrides.createdAt || new Date('2026-04-09T10:00:00.000Z');
  return {
    id: overrides.id || `o-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: overrides.tenantId || 'tenant-1',
    orderNumber: 1,
    status: overrides.status ?? OrderStatus.PAID,
    totalCents: overrides.totalCents ?? 1000,
    subtotalCents: overrides.totalCents ?? 1000,
    deliveryFeeCents: 0,
    paymentRef: overrides.paymentRef === undefined ? 'gopay-123' : overrides.paymentRef,
    paymentStatus: 'success',
    refundStatus: overrides.refundStatus ?? null,
    userId: overrides.userId ?? null,
    customer: overrides.customer ?? { email: 'a@b.sk', phone: '+421900111222' },
    address: overrides.address ?? { city: 'Bratislava', zip: '82101' },
    createdAt,
    updatedAt: overrides.updatedAt || createdAt,
    items: overrides.items ?? [{ productId: 'p1', productName: 'Pizza', quantity: 1, priceCents: 1000, product: { category: 'PIZZA' } }],
    statusHistory: overrides.statusHistory ?? [],
  };
}

describe('AnalyticsService', () => {
  const mockPrisma = {
    order: { findMany: jest.fn() },
    tenant: { findMany: jest.fn() },
  };

  let service: AnalyticsService;
  const start = new Date('2026-04-09T00:00:00.000Z');
  const end = new Date('2026-04-09T23:59:59.999Z');

  /** current period orders, previous period orders, prior-customer rows */
  function mockOrders(current: any[], previous: any[] = [], prior: any[] = []) {
    mockPrisma.order.findMany.mockReset();
    mockPrisma.order.findMany.mockImplementation((args: any) => {
      const where = args?.where || {};
      if (where.createdAt?.gte && where.createdAt?.lte) return Promise.resolve(current);
      if (where.createdAt?.gte && where.createdAt?.lt) return Promise.resolve(previous);
      if (where.createdAt?.lt) return Promise.resolve(prior);
      return Promise.resolve([]);
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(mockPrisma as any);
  });

  describe('revenue definition', () => {
    it('counts everything except canceled and unpaid online orders', async () => {
      mockOrders([
        order({ status: OrderStatus.PAID, totalCents: 1200 }),
        order({ status: OrderStatus.PREPARING, totalCents: 2300 }),
        order({ status: OrderStatus.CANCELED, totalCents: 9999 }),
        // unpaid online: PENDING without cod: ref → excluded
        order({ status: OrderStatus.PENDING, totalCents: 5000, paymentRef: 'gopay-abandoned' }),
        // cash on delivery still waiting for kitchen → counts
        order({ status: OrderStatus.PENDING, totalCents: 700, paymentRef: 'cod:cash' }),
      ]);

      const analytics = await service.getAnalytics('tenant-1', start, end);

      expect(analytics.totalOrders).toBe(3);
      expect(analytics.totalRevenue).toBe(1200 + 2300 + 700);
      expect(analytics.averageOrderValue).toBe(Math.round(4200 / 3));
      expect(analytics.canceled).toEqual({ count: 1, rate: 25, amountCents: 9999 });
      expect(analytics.unpaid).toEqual({ count: 1, amountCents: 5000 });
      expect(analytics.ordersByStatus[OrderStatus.CANCELED]).toBe(1);
      expect(analytics.ordersByStatus[OrderStatus.PENDING]).toBe(2);
    });

    it('applies the same rule to the previous period and returns null change without comparison data', async () => {
      mockOrders(
        [order({ totalCents: 2000 })],
        [
          { status: OrderStatus.PAID, totalCents: 1000, paymentRef: 'x' },
          { status: OrderStatus.PENDING, totalCents: 8000, paymentRef: 'abandoned' },
        ],
      );
      const withPrev = await service.getAnalytics('tenant-1', start, end);
      expect(withPrev.previous.totalRevenue).toBe(1000);
      expect(withPrev.revenueChange).toBe(100);

      mockOrders([order({ totalCents: 2000 })], []);
      const withoutPrev = await service.getAnalytics('tenant-1', start, end);
      expect(withoutPrev.revenueChange).toBeNull();
      expect(withoutPrev.ordersChange).toBeNull();
    });

    it('reports refunds separately', async () => {
      mockOrders([
        order({ status: OrderStatus.CANCELED, totalCents: 1500, refundStatus: 'refunded' }),
        order({ status: OrderStatus.CANCELED, totalCents: 900, refundStatus: 'refund_pending' }),
        order({ status: OrderStatus.DELIVERED, totalCents: 1000 }),
      ]);
      const analytics = await service.getAnalytics('tenant-1', start, end);
      expect(analytics.refunds).toEqual({ count: 1, amountCents: 1500, pendingCount: 1, failedCount: 0 });
      expect(analytics.totalRevenue).toBe(1000);
    });
  });

  describe('breakdowns', () => {
    it('splits payments by method', async () => {
      mockOrders([
        order({ paymentRef: 'gopay-1', totalCents: 100 }),
        order({ paymentRef: 'gopay-2', totalCents: 200 }),
        order({ paymentRef: 'cod:card', status: OrderStatus.DELIVERED, totalCents: 300 }),
        order({ paymentRef: 'cod:cash', status: OrderStatus.PENDING, totalCents: 400 }),
      ]);
      const analytics = await service.getAnalytics('tenant-1', start, end);
      expect(analytics.payments).toEqual({
        online: { count: 2, revenue: 300 },
        cod_card: { count: 1, revenue: 300 },
        cod_cash: { count: 1, revenue: 400 },
      });
    });

    it('builds the weekday×hour heatmap and per-day series in Europe/Bratislava time', async () => {
      // 2026-04-09 is a Thursday. 22:30 UTC = 00:30 local on Friday 2026-04-10 (CEST).
      mockOrders([
        order({ createdAt: new Date('2026-04-09T10:00:00.000Z') }), // 12:00 local Thu
        order({ createdAt: new Date('2026-04-09T22:30:00.000Z') }), // 00:30 local Fri
      ]);
      const analytics = await service.getAnalytics(
        'tenant-1',
        new Date('2026-04-08T22:00:00.000Z'), // Thu 00:00 local
        new Date('2026-04-10T21:59:59.999Z'), // Fri 23:59 local
      );
      expect(analytics.heatmap[3][12]).toBe(1); // Thu 12h
      expect(analytics.heatmap[4][0]).toBe(1); // Fri 0h
      expect(analytics.ordersByDay.map((d) => d.date)).toEqual(['2026-04-09', '2026-04-10']);
      expect(analytics.ordersByDay.map((d) => d.orders)).toEqual([1, 1]);
    });

    it('classifies customers as new or returning using prior orders (email/phone/user)', async () => {
      mockOrders(
        [
          order({ customer: { email: 'Anna@Example.sk', phone: '0900111222' } }), // returning via prior email
          order({ customer: { email: 'anna@example.sk' } }), // same customer, not counted twice
          order({ customer: { email: 'new@example.sk', phone: '+421 911 333 444' } }), // new
          order({ customer: {}, userId: 'user-9' }), // returning via userId
        ],
        [],
        [
          { tenantId: 'tenant-1', userId: null, customer: { email: 'ANNA@example.sk' } },
          { tenantId: 'tenant-1', userId: 'user-9', customer: {} },
        ],
      );
      const analytics = await service.getAnalytics('tenant-1', start, end);
      expect(analytics.customers).toEqual({ unique: 3, newCount: 1, returningCount: 2, repeatRate: 67 });
    });

    it('lists top delivery ZIP codes and top paid extras', async () => {
      mockOrders([
        order({ address: { city: 'Bratislava', zip: '821 01' }, items: [
          { productId: 'p1', productName: 'Pizza', quantity: 2, priceCents: 1000, product: { category: 'PIZZA' },
            modifiers: { dough: 'gluten-free-28', toppings: ['corn'], sauce: 'tomato' } },
        ] }),
        order({ address: { city: 'Bratislava', zip: '82101' } }),
        order({ address: { city: 'Bratislava', zip: '81109' } }),
      ]);
      const analytics = await service.getAnalytics('tenant-1', start, end);
      expect(analytics.topZips[0]).toEqual({ zip: '821 01', city: 'Bratislava', orders: 2 });
      expect(analytics.topZips[1].zip).toBe('811 09');
      // "tomato" is a free default of a required category → not an extra
      expect(analytics.topModifiers.map((m) => m.id).sort()).toEqual(['dough:gluten-free-28', 'toppings:corn']);
      expect(analytics.topModifiers.find((m) => m.id === 'toppings:corn')?.count).toBe(2);
    });

    it('computes average and median timings from status history', async () => {
      const t0 = new Date('2026-04-09T10:00:00.000Z');
      const mk = (paidMin: number, deliveredMin: number) =>
        order({
          status: OrderStatus.DELIVERED,
          createdAt: t0,
          statusHistory: [
            { status: OrderStatus.PAID, createdAt: new Date(t0.getTime() + paidMin * 60000) },
            { status: OrderStatus.OUT_FOR_DELIVERY, createdAt: new Date(t0.getTime() + (deliveredMin - 10) * 60000) },
            { status: OrderStatus.DELIVERED, createdAt: new Date(t0.getTime() + deliveredMin * 60000) },
          ],
        });
      mockOrders([mk(1, 30), mk(2, 40), mk(9, 80)]);
      const analytics = await service.getAnalytics('tenant-1', start, end);
      expect(analytics.timingMetrics.avgConfirmSeconds).toBe(240);
      expect(analytics.timingMetrics.medianConfirmSeconds).toBe(120);
      expect(analytics.timingMetrics.medianDeliveredSeconds).toBe(2400);
      expect(analytics.timingMetrics.avgLastMileSeconds).toBe(600);
      expect(analytics.timingMetrics.deliveredSamples).toBe(3);
    });
  });

  describe('all tenants', () => {
    it('combines brands and returns a per-brand breakdown', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([
        { id: 't-a', slug: 'a', name: 'Brand A' },
        { id: 't-b', slug: 'b', name: 'Brand B' },
      ]);
      mockOrders([
        order({ tenantId: 't-a', totalCents: 1000 }),
        order({ tenantId: 't-a', totalCents: 1000, status: OrderStatus.CANCELED }),
        order({ tenantId: 't-b', totalCents: 5000 }),
      ]);
      const analytics = await service.getAllTenantsAnalytics(start, end);
      expect(analytics.totalRevenue).toBe(6000);
      expect(analytics.tenants).toEqual([
        { tenantId: 't-b', slug: 'b', name: 'Brand B', totalRevenue: 5000, totalOrders: 1, averageOrderValue: 5000, canceledCount: 0, unpaidCount: 0 },
        { tenantId: 't-a', slug: 'a', name: 'Brand A', totalRevenue: 1000, totalOrders: 1, averageOrderValue: 1000, canceledCount: 1, unpaidCount: 0 },
      ]);
    });
  });

  describe('CSV export', () => {
    it('produces a semicolon CSV with BOM and no personal data', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([{ id: 'tenant-1', name: 'PornoPizza' }]);
      mockOrders([
        order({ paymentRef: 'cod:cash', status: OrderStatus.DELIVERED, totalCents: 1590,
          customer: { name: 'Jaro Secret', email: 'secret@example.sk' },
          items: [{ productId: 'p1', productName: 'Calimero "Love"', quantity: 1, priceCents: 1290 }] }),
      ]);
      const csv = await service.exportOrdersCsv(['tenant-1'], start, end);
      expect(csv.startsWith('﻿')).toBe(true);
      const lines = csv.trim().split('\r\n');
      expect(lines[0]).toContain('Brand;Číslo objednávky;Vytvorená;Stav');
      expect(lines[1]).toContain('PornoPizza;0001;');
      expect(lines[1]).toContain(';DELIVERED;áno;hotovosť pri doručení;');
      expect(lines[1]).toContain('"1× Calimero ""Love"""');
      expect(csv).not.toContain('Jaro Secret');
      expect(csv).not.toContain('secret@example.sk');
    });
  });
});

describe('resolveAnalyticsPeriod', () => {
  it('days=N covers today plus N-1 previous local days', () => {
    // 2026-08-17 14:00 local (CEST = UTC+2)
    const now = new Date('2026-08-17T12:00:00.000Z');
    const { start, end } = resolveAnalyticsPeriod({ days: '7' }, now);
    expect(start.toISOString()).toBe('2026-08-10T22:00:00.000Z'); // 2026-08-11 00:00 local
    expect(end).toBe(now);
  });

  it('from/to is an inclusive local calendar range capped at now', () => {
    const now = new Date('2026-08-17T12:00:00.000Z');
    const { start, end } = resolveAnalyticsPeriod({ from: '2026-08-01', to: '2026-08-31' }, now);
    expect(start.toISOString()).toBe('2026-07-31T22:00:00.000Z');
    expect(end).toBe(now);

    const past = resolveAnalyticsPeriod({ from: '2026-01-05', to: '2026-01-06' }, now);
    expect(past.start.toISOString()).toBe('2026-01-04T23:00:00.000Z'); // CET = UTC+1
    expect(past.end.toISOString()).toBe('2026-01-06T22:59:59.999Z');
  });

  it('rejects malformed or reversed ranges', () => {
    expect(() => resolveAnalyticsPeriod({ from: '2026-13-01', to: '2026-01-02' })).toThrow();
    expect(() => resolveAnalyticsPeriod({ from: '2026-02-02', to: '2026-02-01' })).toThrow();
  });

  it('zonedStartOfDay/zonedEndOfDay handle DST switch days', () => {
    // DST starts 2026-03-29 in Europe (02:00 → 03:00)
    expect(zonedStartOfDay('2026-03-29').toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(zonedEndOfDay('2026-03-29').toISOString()).toBe('2026-03-29T21:59:59.999Z');
  });
});
