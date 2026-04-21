import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  const prisma = {
    order: {
      findMany: jest.fn(),
    },
  } as any;

  let service: CustomerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomerService(prisma);
  });

  it('returns direct customer orders and guest orders matched by normalized email', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-user',
        tenantId: 'tenant-1',
        orderNumber: 1,
        status: 'PAID',
        customer: { email: 'customer@example.com' },
        address: {},
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 0,
        totalCents: 1200,
        paymentRef: null,
        paymentStatus: 'success',
        deliveryId: null,
        userId: 'user-1',
        items: [],
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-01T10:00:00.000Z'),
      },
      {
        id: 'order-guest-match',
        tenantId: 'tenant-1',
        orderNumber: 2,
        status: 'PAID',
        customer: { email: ' CUSTOMER@example.com ' },
        address: {},
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 0,
        totalCents: 1200,
        paymentRef: null,
        paymentStatus: 'success',
        deliveryId: null,
        userId: null,
        items: [],
        createdAt: new Date('2025-01-02T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      },
      {
        id: 'order-guest-other',
        tenantId: 'tenant-1',
        orderNumber: 3,
        status: 'PAID',
        customer: { email: 'other@example.com' },
        address: {},
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 0,
        totalCents: 1200,
        paymentRef: null,
        paymentStatus: 'success',
        deliveryId: null,
        userId: null,
        items: [],
        createdAt: new Date('2025-01-03T10:00:00.000Z'),
        updatedAt: new Date('2025-01-03T10:00:00.000Z'),
      },
    ]);

    const orders = await service.getCustomerOrders('user-1', 'tenant-1', 'customer@example.com');

    expect(orders.map((order) => order.id)).toEqual(['order-guest-match', 'order-user']);
  });
});
