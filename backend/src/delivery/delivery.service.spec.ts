import { DeliveryStatus, OrderStatus } from '@pizza-ecosystem/shared';
import { DeliveryService } from './delivery.service';

describe('DeliveryService cancelDeliveryForOrder', () => {
  let service: DeliveryService;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    delivery: {
      update: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockWoltDrive = {
    cancelDelivery: jest.fn(),
  };

  const buildService = () =>
    new DeliveryService(
      mockPrisma as any,
      mockWoltDrive as any,
      {} as any,
      { updateStatus: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    service = buildService();

    mockPrisma.$transaction.mockImplementation(async (operations: any[]) => Promise.all(operations));
    mockPrisma.delivery.update.mockResolvedValue({});
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.orderStatusHistory.create.mockResolvedValue({});
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      deliveryConfig: {
        woltConfig: {
          apiKey: 'merchant-key',
          venueId: 'venue-1',
        },
      },
    });
    mockWoltDrive.cancelDelivery.mockResolvedValue({ status: 'CANCELLED' });
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('cancels active Wolt delivery and moves out-for-delivery order back to ready', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.OUT_FOR_DELIVERY,
      delivery: {
        id: 'delivery-1',
        provider: 'wolt',
        jobId: 'job-1',
        quote: { woltVenueIdUsed: 'venue-1' },
      },
    });

    const result = await service.cancelDeliveryForOrder('order-1');

    expect(mockWoltDrive.cancelDelivery).toHaveBeenCalledWith(
      'merchant-key',
      'job-1',
      3,
      expect.objectContaining({ venueId: 'venue-1' }),
    );
    expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: {
        status: DeliveryStatus.FAILED,
        quote: expect.objectContaining({
          woltVenueIdUsed: 'venue-1',
          canceledAt: expect.any(String),
          cancelSource: 'admin',
        }),
      },
    });
    expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        status: OrderStatus.READY,
      },
    });
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        deliveryId: null,
        status: OrderStatus.READY,
      },
    });
    expect(result).toEqual({
      success: true,
      orderId: 'order-1',
      deliveryId: 'delivery-1',
      jobId: 'job-1',
      message: 'Wolt delivery canceled',
    });
  });

  it('returns success for duplicate cancel when order has no active delivery', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.READY,
      delivery: null,
    });

    await expect(service.cancelDeliveryForOrder('order-1')).resolves.toEqual({
      success: true,
      orderId: 'order-1',
      message: 'No active delivery to cancel',
    });
    expect(mockWoltDrive.cancelDelivery).not.toHaveBeenCalled();
    expect(mockPrisma.delivery.update).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('rejects non-Wolt deliveries', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.READY,
      delivery: {
        id: 'delivery-1',
        provider: 'manual',
        jobId: 'manual-1',
        quote: null,
      },
    });

    await expect(service.cancelDeliveryForOrder('order-1')).rejects.toThrow(
      'Cancel endpoint currently supports only Wolt deliveries',
    );
    expect(mockWoltDrive.cancelDelivery).not.toHaveBeenCalled();
  });
});
