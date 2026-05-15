import { Logger } from '@nestjs/common';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { OrderStatusService } from './order-status.service';

describe('OrderStatusService', () => {
  let service: OrderStatusService;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendOrderStatusUpdate: jest.fn(),
  };

  const mockTenantsService = {};

  const mockStoryousService = {
    createOrder: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrderState: jest.fn(),
  };

  const mockSettingsService = {
    getStoryousSettings: jest.fn(),
  };

  const mockPaymentsService = {
    refundGopayPayment: jest.fn(),
  };

  const baseOrder = {
    id: 'order-1',
    tenantId: 'tenant-1',
    status: OrderStatus.PAID,
    paymentStatus: 'pending',
    paymentRef: null,
    customer: { name: 'Jaro', email: 'jaro@example.com', phone: '+421900000000' },
    address: { street: 'Main', city: 'BA', postalCode: '81101', country: 'SK' },
    items: [{ id: 'item-1', quantity: 1, productName: 'Pizza', priceCents: 1000 }],
    tenant: {
      id: 'tenant-1',
      name: 'PornoPizza',
      slug: 'pornopizza',
      subdomain: 'pornopizza',
      domain: 'p0rnopizza.sk',
      emailConfig: null,
      paymentProvider: 'gopay',
    },
    delivery: { id: 'delivery-1', provider: 'custom', status: 'PENDING' },
    storyousOrderId: null,
    storyousOrderState: null,
  };

  beforeEach(() => {
    service = new OrderStatusService(
      mockPrisma as any,
      mockEmailService as any,
      mockTenantsService as any,
      mockStoryousService as any,
      mockSettingsService as any,
      mockPaymentsService as any,
    );

    jest.clearAllMocks();

    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.order.update.mockResolvedValue({});
    mockPrisma.orderStatusHistory.create.mockResolvedValue({});
    mockEmailService.sendOrderStatusUpdate.mockResolvedValue(undefined);
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      enabled: true,
      autoSync: true,
      merchantId: 'merchant-1',
      placeId: 'place-1',
    });
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  it('auto-syncs to Storyous on accept when order moves from PENDING to PAID', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.PENDING,
      storyousOrderId: null,
    });
    mockStoryousService.createOrder.mockResolvedValue({
      id: 'storyous-accepted-1',
      storyousState: 'CONFIRMED',
    });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(mockStoryousService.createOrder).toHaveBeenCalledTimes(1);
    expect(mockStoryousService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PAID,
      }),
      'merchant-1',
      'place-1',
    );
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        storyousOrderId: 'storyous-accepted-1',
        storyousOrderState: 'CONFIRMED',
      },
    });
    expect(loggerLogSpy).toHaveBeenCalledWith(
      '✅ Order order-1 auto-synced to Storyous: storyous-accepted-1',
      expect.objectContaining({
        orderId: 'order-1',
        storyousOrderId: 'storyous-accepted-1',
        storyousState: 'CONFIRMED',
        statusSyncSource: 'dashboard',
      }),
    );
  });

  it('persists NEW Storyous state on accept and logs warning without failing status update', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.PENDING,
      storyousOrderId: null,
    });
    mockStoryousService.createOrder.mockResolvedValue({
      id: 'storyous-new-1',
      storyousState: 'NEW',
    });

    await expect(service.updateStatus('order-1', OrderStatus.PAID)).resolves.toBeUndefined();

    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        storyousOrderId: 'storyous-new-1',
        storyousOrderState: 'NEW',
      },
    });
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      '⚠️ Order order-1 reached Storyous but still requires attention',
      expect.objectContaining({
        orderId: 'order-1',
        storyousOrderId: 'storyous-new-1',
        storyousState: 'NEW',
        statusSyncSource: 'dashboard',
      }),
    );
  });

  it('does not auto-sync on accept when Storyous order already exists', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.PENDING,
      storyousOrderId: 'storyous-existing',
    });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(mockStoryousService.createOrder).not.toHaveBeenCalled();
  });

  it('does not auto-sync on accept when autoSync is disabled', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.PENDING,
      storyousOrderId: null,
    });
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      enabled: true,
      autoSync: false,
      merchantId: 'merchant-1',
      placeId: 'place-1',
    });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(mockStoryousService.createOrder).not.toHaveBeenCalled();
  });

  it('keeps PREPARING auto-sync behavior for online confirmation flow', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.PAID,
      storyousOrderId: null,
    });
    mockStoryousService.createOrder.mockResolvedValue({
      id: 'storyous-preparing-1',
      storyousState: 'CONFIRMED',
    });

    await service.updateStatus('order-1', OrderStatus.PREPARING);

    expect(mockStoryousService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PREPARING,
      }),
      'merchant-1',
      'place-1',
    );
  });

  it('calls Storyous status update on cancel when storyousOrderId exists', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      storyousOrderId: 'storyous-123',
    });

    await service.updateStatus('order-1', OrderStatus.CANCELED);

    expect(mockStoryousService.updateOrderStatus).toHaveBeenCalledWith('storyous-123', OrderStatus.CANCELED);
  });

  it('does not call Storyous status update on cancel when storyousOrderId is missing', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      storyousOrderId: null,
    });

    await service.updateStatus('order-1', OrderStatus.CANCELED);

    expect(mockStoryousService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('does not call Storyous status update when Storyous settings are disabled', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      storyousOrderId: 'storyous-123',
    });
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      enabled: false,
      autoSync: true,
      merchantId: 'merchant-1',
      placeId: 'place-1',
    });

    await service.updateStatus('order-1', OrderStatus.CANCELED);

    expect(mockStoryousService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('does not push status back to Storyous when source is storyous (loop guard)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.READY,
      storyousOrderId: 'storyous-88',
    });

    await service.updateStatus('order-1', OrderStatus.OUT_FOR_DELIVERY, 'storyous');

    expect(mockStoryousService.updateOrderStatus).not.toHaveBeenCalled();
    expect(mockStoryousService.createOrder).not.toHaveBeenCalled();
  });

  it('reconciles Storyous DISPATCHED to local OUT_FOR_DELIVERY', async () => {
    mockPrisma.order.findMany.mockResolvedValue([
      { id: 'order-1', status: OrderStatus.READY, storyousOrderId: 'storyous-99' },
    ]);
    mockStoryousService.getOrderState.mockResolvedValue('DISPATCHED');

    const updateSpy = jest
      .spyOn(service, 'updateStatus')
      .mockResolvedValue(undefined as never);

    await (service as any).checkAndReconcileStoryousStatuses();

    expect(updateSpy).toHaveBeenCalledWith('order-1', OrderStatus.OUT_FOR_DELIVERY, 'storyous');
  });
});
