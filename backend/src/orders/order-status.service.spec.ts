import { OrderStatus } from '@pizza-ecosystem/shared';
import { OrderStatusService } from './order-status.service';

describe('OrderStatusService', () => {
  let service: OrderStatusService;

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
    status: OrderStatus.PENDING,
    paymentStatus: 'pending',
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
    mockSettingsService.getStoryousSettings.mockResolvedValue({
      enabled: true,
      autoSync: true,
      merchantId: 'merchant-1',
      placeId: 'place-1',
    });
  });

  it('auto-creates Storyous order when custom-delivery order is accepted (PENDING -> PAID)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, status: OrderStatus.PENDING, paymentStatus: 'pending' });
    mockStoryousService.createOrder.mockResolvedValue({ id: 'storyous-1', storyousState: 'CONFIRMED' });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(mockStoryousService.createOrder).toHaveBeenCalledTimes(1);
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          storyousOrderId: 'storyous-1',
          storyousOrderState: 'CONFIRMED',
        }),
      }),
    );
  });

  it('does not auto-create Storyous order on PAID for online-paid order', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, status: OrderStatus.PENDING, paymentStatus: 'success' });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(mockStoryousService.createOrder).not.toHaveBeenCalled();
  });

  it('pushes OUT_FOR_DELIVERY status to Storyous using global settings gate', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.READY,
      storyousOrderId: 'storyous-77',
      tenant: {
        ...baseOrder.tenant,
        storyousConfig: undefined,
      },
    });

    await service.updateStatus('order-1', OrderStatus.OUT_FOR_DELIVERY);

    expect(mockSettingsService.getStoryousSettings).toHaveBeenCalled();
    expect(mockStoryousService.updateOrderStatus).toHaveBeenCalledWith('storyous-77', OrderStatus.OUT_FOR_DELIVERY);
  });

  it('does not push status back to Storyous when source is storyous (loop guard)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: OrderStatus.READY,
      storyousOrderId: 'storyous-88',
    });

    await service.updateStatus('order-1', OrderStatus.OUT_FOR_DELIVERY, 'storyous');

    expect(mockStoryousService.updateOrderStatus).not.toHaveBeenCalled();
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
  it('does not reconcile Wolt orders from Storyous DISPATCHED because Wolt is delivery source of truth', async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockStoryousService.getOrderState.mockResolvedValue('DISPATCHED');

    const updateSpy = jest
      .spyOn(service, 'updateStatus')
      .mockResolvedValue(undefined as never);

    await (service as any).checkAndReconcileStoryousStatuses();

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { deliveryId: null },
            { delivery: { is: { provider: { not: 'wolt' } } } },
          ],
        }),
      }),
    );
    expect(mockStoryousService.getOrderState).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });

});
