import { OrderStatus } from '@pizza-ecosystem/shared';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const mockPrisma = {
    order: {
      findMany: jest.fn(),
    },
  };

  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnalyticsService(mockPrisma as any);
  });

  it('counts custom-delivery accepted orders in revenue cohort (all except canceled)', async () => {
    const now = new Date('2026-04-09T10:00:00.000Z');

    mockPrisma.order.findMany
      // current period orders (with statusHistory include)
      .mockResolvedValueOnce([
        {
          id: 'o-paid',
          status: OrderStatus.PAID,
          totalCents: 1200,
          createdAt: now,
          updatedAt: now,
          items: [
            { productId: 'p1', productName: 'Pizza', quantity: 1, priceCents: 1200 },
          ],
          statusHistory: [],
        },
        {
          id: 'o-preparing',
          status: OrderStatus.PREPARING,
          totalCents: 2300,
          createdAt: now,
          updatedAt: now,
          items: [
            { productId: 'p2', productName: 'Cola', quantity: 1, priceCents: 2300 },
          ],
          statusHistory: [],
        },
        {
          id: 'o-canceled',
          status: OrderStatus.CANCELED,
          totalCents: 9999,
          createdAt: now,
          updatedAt: now,
          items: [
            { productId: 'p3', productName: 'Ignored', quantity: 1, priceCents: 9999 },
          ],
          statusHistory: [],
        },
      ])
      // previous period orders
      .mockResolvedValueOnce([]);

    const analytics = await service.getAnalytics(
      'tenant-1',
      new Date('2026-04-09T00:00:00.000Z'),
      new Date('2026-04-09T23:59:59.999Z'),
    );

    expect(analytics.totalOrders).toBe(2);
    expect(analytics.totalRevenue).toBe(3500);
    expect(analytics.ordersByStatus[OrderStatus.CANCELED]).toBe(1);
    expect(analytics.ordersByStatus[OrderStatus.PAID]).toBe(1);
    expect(analytics.ordersByStatus[OrderStatus.PREPARING]).toBe(1);
  });
});
