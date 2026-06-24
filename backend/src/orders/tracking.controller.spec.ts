import { TrackingController } from './orders.controller';

describe('TrackingController public PII projection', () => {
  const fullOrder = {
    id: 'order-1',
    tenantId: 'tenant-1',
    orderNumber: 42,
    status: 'PREPARING',
    paymentStatus: 'success',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:05:00Z'),
    customer: { name: 'Jane Doe', email: 'jane@example.com', phone: '+421900000000' },
    address: { street: 'Main 1', city: 'Bratislava', postalCode: '81101' },
    items: [{ id: 'i1', productName: 'Margherita', quantity: 1 }],
    subtotalCents: 1000,
    taxCents: 0,
    deliveryFeeCents: 200,
    totalCents: 1200,
    deliveryId: 'd1',
    delivery: { provider: 'wolt', status: 'CREATED', trackingUrl: 'https://wolt/x' },
    statusHistory: [{ status: 'PENDING' }],
    // Sensitive internals that must NOT leak on the public endpoint:
    paymentRef: 'gopay-ref-123',
    userId: 'user-9',
    storyousOrderId: 'st-1',
    clientRequestId: 'crid-1',
  };

  function buildController() {
    const ordersService = {
      getOrderById: jest.fn().mockResolvedValue(fullOrder),
    } as any;
    return new TrackingController(ordersService);
  }

  it('returns order data the tracking page needs but strips contact PII and internals', async () => {
    const controller = buildController();
    const result: any = await controller.trackOrder('order-1');

    // Needed for the tracking UI:
    expect(result.status).toBe('PREPARING');
    expect(result.orderNumber).toBe(42);
    expect(result.customer).toEqual({ name: 'Jane Doe' });
    expect(result.items).toHaveLength(1);
    expect(result.totalCents).toBe(1200);
    expect(result.delivery.trackingUrl).toBe('https://wolt/x');

    // Contact PII must be gone:
    expect(result.customer.email).toBeUndefined();
    expect(result.customer.phone).toBeUndefined();

    // Internal references must be gone:
    expect(result.paymentRef).toBeUndefined();
    expect(result.userId).toBeUndefined();
    expect(result.storyousOrderId).toBeUndefined();
    expect(result.clientRequestId).toBeUndefined();
  });

  it('applies the same projection on the /api/track alias', async () => {
    const controller = buildController();
    const result: any = await controller.trackOrderApi('order-1');
    expect(result.paymentRef).toBeUndefined();
    expect(result.customer.phone).toBeUndefined();
    expect(result.totalCents).toBe(1200);
  });
});
