import { OrderStatusService } from './order-status.service';
import { DeliveryStatus, OrderStatus } from '@pizza-ecosystem/shared';

describe('OrderStatusService', () => {
  const baseOrder = {
    id: 'order-1',
    status: OrderStatus.PENDING,
    paymentStatus: 'pending',
    storyousOrderId: null,
    customer: { name: 'Jaro', email: 'jaro@example.com', phone: '+421900000000' },
    address: {
      street: 'Main Street 1',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'SK',
    },
    delivery: null,
    tenant: {
      id: 'tenant-1',
      name: 'Porno Pizza',
      domain: 'p0rnopizza.sk',
      subdomain: 'pornopizza',
      slug: 'pornopizza',
      emailConfig: null,
    },
  };

  const buildService = (orderOverrides: Partial<any> = {}) => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          ...baseOrder,
          ...orderOverrides,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      orderStatusHistory: {
        create: jest.fn().mockResolvedValue(undefined),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const emailService = {
      sendOrderStatusUpdate: jest.fn().mockResolvedValue(undefined),
    };

    const tenantsService = {};

    const storyousService = {
      createOrder: jest.fn().mockResolvedValue({
        id: 'storyous-1',
        storyousState: 'CONFIRMED',
      }),
      updateOrderStatus: jest.fn().mockResolvedValue(undefined),
    };

    const settingsService = {
      getStoryousSettings: jest.fn().mockResolvedValue({
        enabled: true,
        autoSync: true,
        merchantId: 'merchant-1',
        placeId: 'place-1',
      }),
    };

    const paymentsService = {
      refundGopayPayment: jest.fn().mockResolvedValue(undefined),
    };

    const service = new OrderStatusService(
      prisma as any,
      emailService as any,
      tenantsService as any,
      storyousService as any,
      settingsService as any,
      paymentsService as any,
    );

    return {
      service,
      prisma,
      emailService,
      storyousService,
      settingsService,
      paymentsService,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('auto-syncs to Storyous when delivery-payment order is accepted to PAID', async () => {
    const { service, storyousService, prisma } = buildService({
      status: OrderStatus.PENDING,
      paymentStatus: 'pending',
    });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(storyousService.createOrder).toHaveBeenCalledTimes(1);
    expect(storyousService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PREPARING,
      }),
      'merchant-1',
      'place-1',
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        storyousOrderId: 'storyous-1',
        storyousOrderState: 'CONFIRMED',
      },
    });
  });

  it('does not auto-sync to Storyous on PAID for online-paid orders', async () => {
    const { service, storyousService } = buildService({
      status: OrderStatus.PENDING,
      paymentStatus: 'success',
    });

    await service.updateStatus('order-1', OrderStatus.PAID);

    expect(storyousService.createOrder).not.toHaveBeenCalled();
  });

  it('keeps auto-sync on PREPARING for online-paid orders', async () => {
    const { service, storyousService } = buildService({
      status: OrderStatus.PAID,
      paymentStatus: 'success',
      delivery: {
        id: 'delivery-1',
        provider: 'wolt',
        status: DeliveryStatus.CREATED,
      },
    });

    await service.updateStatus('order-1', OrderStatus.PREPARING);

    expect(storyousService.createOrder).toHaveBeenCalledTimes(1);
    expect(storyousService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'order-1',
        status: OrderStatus.PREPARING,
      }),
      'merchant-1',
      'place-1',
    );
  });
});
