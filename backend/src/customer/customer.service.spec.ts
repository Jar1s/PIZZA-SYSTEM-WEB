import { CustomerService } from './customer.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    service = new CustomerService(mockPrismaService);
    jest.clearAllMocks();
  });

  it('returns empty array when required identifiers are missing', async () => {
    await expect(service.getCustomerOrders('', 'tenant-1')).resolves.toEqual([]);
    await expect(service.getCustomerOrders('user-1', '')).resolves.toEqual([]);

    expect((mockPrismaService.order.findMany as jest.Mock)).not.toHaveBeenCalled();
  });

  it('queries only authenticated user orders when customer email is not provided', async () => {
    (mockPrismaService.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'order-user-1',
        tenantId: 'tenant-1',
        orderNumber: 101,
        status: 'PENDING',
        customer: { email: 'user@example.com' },
        address: {},
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 150,
        totalCents: 1350,
        paymentRef: null,
        paymentStatus: null,
        deliveryId: null,
        userId: 'user-1',
        items: [],
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        updatedAt: new Date('2026-01-01T10:00:00.000Z'),
      },
    ]);

    const result = await service.getCustomerOrders('user-1', 'tenant-1');

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          OR: [{ userId: 'user-1' }, { userId: null }],
        },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('order-user-1');
  });

  it('includes guest orders whose normalized email matches the authenticated customer', async () => {
    (mockPrismaService.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'order-user-1',
        tenantId: 'tenant-1',
        orderNumber: 102,
        status: 'PAID',
        customer: { email: 'user@example.com' },
        address: {},
        subtotalCents: 1200,
        taxCents: 240,
        deliveryFeeCents: 100,
        totalCents: 1540,
        paymentRef: null,
        paymentStatus: null,
        deliveryId: null,
        userId: 'user-1',
        items: [],
        createdAt: new Date('2026-01-02T10:00:00.000Z'),
        updatedAt: new Date('2026-01-02T10:00:00.000Z'),
      },
      {
        id: 'order-guest-1',
        tenantId: 'tenant-1',
        orderNumber: 103,
        status: 'DELIVERED',
        customer: { email: 'USER@example.com' },
        address: {},
        subtotalCents: 900,
        taxCents: 180,
        deliveryFeeCents: 120,
        totalCents: 1200,
        paymentRef: null,
        paymentStatus: null,
        deliveryId: null,
        userId: null,
        items: [],
        createdAt: new Date('2026-01-03T10:00:00.000Z'),
        updatedAt: new Date('2026-01-03T10:00:00.000Z'),
      },
    ]);

    const result = await service.getCustomerOrders('user-1', 'tenant-1', '  USER@example.com  ');

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          OR: [{ userId: 'user-1' }, { userId: null }],
        },
      }),
    );
    expect(result.map((order) => order.id)).toEqual(['order-user-1', 'order-guest-1']);
  });

  it('does not include anonymous tenant-wide scope when no guest IDs match', async () => {
    (mockPrismaService.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'order-user-1',
        tenantId: 'tenant-1',
        orderNumber: 104,
        status: 'PAID',
        customer: { email: 'user@example.com' },
        address: {},
        subtotalCents: 1200,
        taxCents: 240,
        deliveryFeeCents: 100,
        totalCents: 1540,
        paymentRef: null,
        paymentStatus: null,
        deliveryId: null,
        userId: 'user-1',
        items: [],
        createdAt: new Date('2026-01-04T10:00:00.000Z'),
        updatedAt: new Date('2026-01-04T10:00:00.000Z'),
      },
      {
        id: 'order-guest-other',
        tenantId: 'tenant-1',
        orderNumber: 105,
        status: 'DELIVERED',
        customer: { email: 'other@example.com' },
        address: {},
        subtotalCents: 900,
        taxCents: 180,
        deliveryFeeCents: 120,
        totalCents: 1200,
        paymentRef: null,
        paymentStatus: null,
        deliveryId: null,
        userId: null,
        items: [],
        createdAt: new Date('2026-01-05T10:00:00.000Z'),
        updatedAt: new Date('2026-01-05T10:00:00.000Z'),
      },
    ]);

    const result = await service.getCustomerOrders('user-1', 'tenant-1', 'nomatch@example.com');

    expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          OR: [{ userId: 'user-1' }, { userId: null }],
        },
      }),
    );
    expect(result.map((order) => order.id)).toEqual(['order-user-1']);
  });
});
