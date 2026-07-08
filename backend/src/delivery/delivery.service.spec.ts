import { DeliveryStatus, OrderStatus } from '@pizza-ecosystem/shared';
import { DeliveryService } from './delivery.service';

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  delivery: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockWoltDrive = {
  cancelDelivery: jest.fn(),
  getOrderStatus: jest.fn(),
  getShipmentPromise: jest.fn(),
  createDelivery: jest.fn(),
};

const mockOrderStatusService = {
  updateStatus: jest.fn(),
};

const mockOrdersService = {
  getOrderById: jest.fn(),
};

const buildService = () =>
  new DeliveryService(
    mockPrisma as any,
    mockWoltDrive as any,
    mockOrdersService as any,
    mockOrderStatusService as any,
    {} as any,
    {} as any,
    {} as any,
  );

beforeEach(() => {
  mockPrisma.tenant.findMany.mockResolvedValue([]);
});

describe('DeliveryService cancelDeliveryForOrder', () => {
  let service: DeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = buildService();

    mockPrisma.$transaction.mockImplementation(async (operations: any[]) => Promise.all(operations));
    mockPrisma.delivery.findFirst.mockResolvedValue(null);
    mockPrisma.delivery.update.mockResolvedValue({});
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.orderStatusHistory.create.mockResolvedValue({});
    mockOrderStatusService.updateStatus.mockResolvedValue({});
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-1',
      deliveryConfig: {
        woltConfig: {
          apiKey: 'merchant-key',
          venueId: 'venue-1',
        },
      },
    });
    mockPrisma.tenant.findMany.mockResolvedValue([]);
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

describe('DeliveryService Wolt opening-hours guard', () => {
  let service: DeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = buildService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('blocks Wolt dispatch when shared opening hours from another tenant are closed', async () => {
    mockPrisma.tenant.findMany.mockResolvedValue([
      {
        id: 'tenant-1',
        slug: 'pornopizza',
        theme: {},
      },
      {
        id: 'tenant-party',
        slug: 'pizzaparty',
        theme: {
          openingHours: {
            enabled: true,
            timezone: 'UTC',
            days: {
              thursday: { open: '10:00', close: '12:00', closed: false },
            },
          },
        },
      },
    ]);

    const currentTenant = {
      id: 'tenant-1',
      slug: 'pornopizza',
      theme: {},
    };

    jest.spyOn(service as any, 'getZonedDateParts').mockReturnValue({
      dayName: 'thursday',
      minutes: 13 * 60,
    });

    await expect((service as any).assertTenantCanDispatchWolt(currentTenant)).rejects.toThrow(
      'Prevádzka je aktuálne zatvorená',
    );
  });

  it('allows Wolt dispatch when opening-hours automation is disabled', async () => {
    mockPrisma.tenant.findMany.mockResolvedValue([
      {
        id: 'tenant-1',
        slug: 'pornopizza',
        theme: {
          openingHours: {
            enabled: false,
          },
        },
      },
    ]);

    await expect(
      (service as any).assertTenantCanDispatchWolt({
        id: 'tenant-1',
        slug: 'pornopizza',
        theme: {},
      }),
    ).resolves.toBeUndefined();
  });
});


describe('DeliveryService handleWoltWebhook', () => {
  let service: DeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = buildService();

    mockPrisma.$transaction.mockImplementation(async (operations: any[]) => Promise.all(operations));
    mockPrisma.delivery.update.mockResolvedValue({});
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.orderStatusHistory.create.mockResolvedValue({});
    mockOrderStatusService.updateStatus.mockResolvedValue({});
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('maps documented Wolt webhook types to internal delivery and order states', async () => {
    mockPrisma.delivery.findFirst.mockResolvedValue({
      id: 'delivery-1',
      jobId: 'job-1',
      status: DeliveryStatus.PENDING,
      quote: {},
      orders: [{ id: 'order-1', status: OrderStatus.PREPARING }],
    });

    await service.handleWoltWebhook({
      type: 'order.picked_up',
      event_id: 'evt-1',
      created_at: '2026-05-16T10:00:00.000Z',
      details: {
        wolt_order_reference_id: 'job-1',
        pickup: { eta: '2026-05-16T10:05:00.000Z' },
        dropoff: { eta: { max: '2026-05-16T10:25:00.000Z' } },
      },
    });

    expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        status: DeliveryStatus.PICKED_UP,
        quote: expect.objectContaining({
          lastWebhookStatus: 'PICKED_UP',
          lastWebhookEventType: 'order.picked_up',
          pickupEtaMinutes: expect.any(Number),
          dropoffEtaMinutes: expect.any(Number),
          etaMinutes: expect.any(Number),
        }),
      }),
    });
    expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.OUT_FOR_DELIVERY,
    );
  });

  it('releases failed Wolt deliveries back to ready for redispatch', async () => {
    mockPrisma.delivery.findFirst.mockResolvedValue({
      id: 'delivery-1',
      jobId: 'job-1',
      status: DeliveryStatus.IN_TRANSIT,
      quote: {},
      orders: [{ id: 'order-1', status: OrderStatus.OUT_FOR_DELIVERY }],
    });

    await service.handleWoltWebhook({
      type: 'order.rejected',
      event_id: 'evt-2',
      created_at: '2026-05-16T10:00:00.000Z',
      details: {
        wolt_order_reference_id: 'job-1',
      },
    });

    expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        status: DeliveryStatus.FAILED,
        quote: expect.objectContaining({
          lastWebhookStatus: 'REJECTED',
          lastWebhookEventType: 'order.rejected',
        }),
      }),
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
    expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
  });

  it('ignores unknown Wolt webhook types without forcing in-transit state', async () => {
    mockPrisma.delivery.findFirst.mockResolvedValue({
      id: 'delivery-1',
      jobId: 'job-1',
      status: DeliveryStatus.PENDING,
      quote: {},
      orders: [{ id: 'order-1', status: OrderStatus.PREPARING }],
    });

    await service.handleWoltWebhook({
      type: 'order.mystery_event',
      event_id: 'evt-3',
      created_at: '2026-05-16T10:00:00.000Z',
      details: {
        wolt_order_reference_id: 'job-1',
      },
    });

    expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: {
        quote: expect.objectContaining({
          lastWebhookEventId: 'evt-3',
          lastWebhookEventType: 'order.mystery_event',
          lastWebhookTimestamp: '2026-05-16T10:00:00.000Z',
        }),
      },
    });
    expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('disables stale polling after Wolt permission errors', async () => {
    mockPrisma.delivery.findMany.mockResolvedValue([
      {
        id: 'delivery-1',
        jobId: 'job-1',
        status: DeliveryStatus.PENDING,
        quote: {},
        tenant: {
          id: 'tenant-1',
          deliveryConfig: {
            woltConfig: {
              apiKey: 'merchant-key',
              venueId: 'venue-1',
            },
          },
        },
        orders: [{ id: 'order-1', status: OrderStatus.PREPARING, tenantId: 'tenant-1' }],
      },
    ]);
    mockWoltDrive.getOrderStatus = jest.fn().mockRejectedValue({
      status: 403,
      message: 'Wolt API odmietol požiadavku. Skontrolujte oprávnenia vášho API kľúča.',
    });

    await (service as any).reconcileStaleWoltDeliveries();

    expect(mockPrisma.delivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: {
        quote: expect.objectContaining({
          woltPollingDisabledAt: expect.any(String),
          woltPollingDisabledReason: 'permission_denied',
          lastPolledAt: expect.any(String),
          lastPolledAuthError: 'Wolt API odmietol požiadavku. Skontrolujte oprávnenia vášho API kľúča.',
        }),
      },
    });
  });
});

describe('DeliveryService rebookDeliveryForOrder', () => {
  let service: DeliveryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = buildService();

    mockPrisma.$transaction.mockImplementation(async (operations: any[]) => Promise.all(operations));
    mockPrisma.orderStatusHistory.create.mockResolvedValue({});
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.delivery.update.mockResolvedValue({});
    mockPrisma.delivery.create.mockResolvedValue({
      id: 'delivery-2',
      jobId: 'job-2',
      trackingUrl: 'https://tracking.example/job-2',
    });
    mockPrisma.delivery.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockPrisma.delivery.delete.mockResolvedValue({});
    mockOrdersService.getOrderById.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.READY,
      orderNumber: 141,
      customer: { name: 'Jaro', phone: '+421900000000' },
      address: {
        street: 'Main',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
        coordinates: { lat: 48.1, lng: 17.1 },
      },
      deliveryId: null,
    });
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
    mockWoltDrive.getShipmentPromise = jest.fn().mockResolvedValue({
      promiseId: 'promise-2',
      feeCents: 1050,
      etaMinutes: 30,
      pickupEtaMinutes: 18,
      dropoffEtaMinutes: 30,
      validUntil: '2026-05-24T12:00:00.000Z',
      currency: 'EUR',
      distance: 2500,
    });
    mockWoltDrive.createDelivery = jest.fn().mockResolvedValue({
      jobId: 'job-2',
      trackingUrl: 'https://tracking.example/job-2',
      feeCents: 1050,
      etaMinutes: 30,
      pickupEtaMinutes: 18,
      dropoffEtaMinutes: 30,
      currency: 'EUR',
      promiseId: 'promise-2',
      validUntil: '2026-05-24T12:00:00.000Z',
    });
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('cancels and recreates Wolt delivery with a new preparation time', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      tenantId: 'tenant-1',
      status: OrderStatus.READY,
      orderNumber: 141,
      customer: { name: 'Jaro', phone: '+421900000000' },
      address: {
        street: 'Main',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
        coordinates: { lat: 48.1, lng: 17.1 },
      },
      delivery: {
        id: 'delivery-1',
        provider: 'wolt',
        jobId: 'job-1',
        quote: { woltVenueIdUsed: 'venue-1' },
      },
    });
    jest.spyOn(service as any, 'normalizeDropoffAddress').mockResolvedValue({
      street: 'Main',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
      coordinates: { lat: 48.1, lng: 17.1 },
    });
    jest.spyOn(service as any, 'getPickupAddress').mockReturnValue({
      street: 'Kitchen',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
      coordinates: { lat: 48.15, lng: 17.11 },
      phone: '+421900111222',
    });
    jest.spyOn(service as any, 'assertWoltConfig').mockImplementation(() => {});
    jest.spyOn(service as any, 'assertTenantAccess').mockImplementation(() => {});

    const result = await service.rebookDeliveryForOrder('order-1', 35);

    expect(mockWoltDrive.cancelDelivery).toHaveBeenCalledWith(
      'merchant-key',
      'job-1',
      3,
      expect.objectContaining({ venueId: 'venue-1' }),
    );
    expect(mockWoltDrive.getShipmentPromise).toHaveBeenCalledWith(
      'merchant-key',
      expect.any(Object),
      expect.any(Object),
      'Jaro',
      '+421900000000',
      3,
      expect.any(Object),
      35,
    );
    expect(mockWoltDrive.createDelivery).toHaveBeenCalledWith(
      'merchant-key',
      'order-1',
      expect.any(Object),
      expect.any(Object),
      'Jaro',
      '+421900000000',
      'promise-2',
      35,
      3,
      expect.any(Object),
      expect.objectContaining({
        orderNumber: 141,
      }),
    );
    expect(result).toEqual({
      success: true,
      orderId: 'order-1',
      previousDeliveryId: 'delivery-1',
      previousJobId: 'job-1',
      deliveryId: 'delivery-2',
      jobId: 'job-2',
      trackingUrl: 'https://tracking.example/job-2',
      message: 'Wolt delivery rebooked',
    });
  });
});
