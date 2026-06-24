import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WepayService } from './wepay.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { DeliveryService } from '../delivery/delivery.service';
import { OrderStatus } from '@pizza-ecosystem/shared';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let adyenService: AdyenService;
  let gopayService: GopayService;
  let wepayService: WepayService;
  let ordersService: OrdersService;
  let orderStatusService: OrderStatusService;
  let tenantsService: TenantsService;
  let deliveryService: DeliveryService;

  const mockAdyenService = {
    createPaymentSession: jest.fn(),
    parseWebhook: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };

  const mockGopayService = {
    createPayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    parseWebhook: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  const mockWepayService = {
    createPayment: jest.fn(),
    parseWebhook: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  const mockOrdersService = {
    getOrderById: jest.fn(),
    getOrderByPaymentRef: jest.fn(),
    updatePaymentRef: jest.fn(),
    tryStartPaymentSession: jest.fn(),
    clearPaymentSessionLock: jest.fn(),
  };

  const mockOrderStatusService = {
    updateStatus: jest.fn(),
  };

  const mockTenantsService = {
    getTenantById: jest.fn(),
    getAllTenants: jest.fn(),
  };

  const mockDeliveryService = {
    createDeliveryForOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: AdyenService,
          useValue: mockAdyenService,
        },
        {
          provide: GopayService,
          useValue: mockGopayService,
        },
        {
          provide: WepayService,
          useValue: mockWepayService,
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: OrderStatusService,
          useValue: mockOrderStatusService,
        },
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
        {
          provide: DeliveryService,
          useValue: mockDeliveryService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    adyenService = module.get<AdyenService>(AdyenService);
    gopayService = module.get<GopayService>(GopayService);
    wepayService = module.get<WepayService>(WepayService);
    ordersService = module.get<OrdersService>(OrdersService);
    orderStatusService = module.get<OrderStatusService>(OrderStatusService);
    tenantsService = module.get<TenantsService>(TenantsService);
    deliveryService = module.get<DeliveryService>(DeliveryService);

    jest.clearAllMocks();
    mockOrdersService.tryStartPaymentSession.mockResolvedValue(true);
    mockOrdersService.clearPaymentSessionLock.mockResolvedValue(undefined);
  });

  describe('createPaymentSession', () => {
    const mockOrder = {
      id: 'order-123',
      tenantId: 'tenant-123',
      status: OrderStatus.PENDING,
      totalCents: 2500,
    };

    const mockTenant = {
      id: 'tenant-123',
      paymentProvider: 'adyen',
    };

    it('should create Adyen payment session', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockTenantsService.getTenantById.mockResolvedValue(mockTenant);
      mockAdyenService.createPaymentSession.mockResolvedValue({
        sessionId: 'adyen-session-123',
        redirectUrl: 'https://adyen.com/checkout',
      });
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);

      const result = await service.createPaymentSession('order-123');

      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(mockTenantsService.getTenantById).toHaveBeenCalledWith('tenant-123');
      expect(mockAdyenService.createPaymentSession).toHaveBeenCalledWith(mockOrder, mockTenant);
      expect(mockOrdersService.tryStartPaymentSession).toHaveBeenCalledWith(
        'order-123',
        expect.stringMatching(/^initializing:/),
      );
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'adyen-session-123',
        'pending',
      );
      expect(result).toEqual({
        sessionId: 'adyen-session-123',
        redirectUrl: 'https://adyen.com/checkout',
      });
    });

    it('should create GoPay payment session', async () => {
      const gopayTenant = { ...mockTenant, paymentProvider: 'gopay' };
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockTenantsService.getTenantById.mockResolvedValue(gopayTenant);
      mockGopayService.createPayment.mockResolvedValue({
        paymentId: 'gopay-123',
        redirectUrl: 'https://gopay.com/checkout',
      });
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);

      const result = await service.createPaymentSession('order-123');

      expect(mockGopayService.createPayment).toHaveBeenCalledWith(mockOrder, gopayTenant);
      expect(mockOrdersService.tryStartPaymentSession).toHaveBeenCalledWith(
        'order-123',
        expect.stringMatching(/^initializing:/),
      );
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'gopay-123',
        'pending',
      );
    });

    it('should create WePay payment session', async () => {
      const wepayTenant = { ...mockTenant, paymentProvider: 'wepay' };
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockTenantsService.getTenantById.mockResolvedValue(wepayTenant);
      mockWepayService.createPayment.mockResolvedValue({
        paymentId: 'wepay-123',
        redirectUrl: 'https://wepay.com/checkout',
      });
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);

      const result = await service.createPaymentSession('order-123');

      expect(mockWepayService.createPayment).toHaveBeenCalledWith(mockOrder, wepayTenant);
      expect(mockOrdersService.tryStartPaymentSession).toHaveBeenCalledWith(
        'order-123',
        expect.stringMatching(/^initializing:/),
      );
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'wepay-123',
        'pending',
      );
    });

    it('should throw BadRequestException if order already processed', async () => {
      const processedOrder = { ...mockOrder, status: OrderStatus.PAID };
      mockOrdersService.getOrderById.mockResolvedValue(processedOrder);
      mockTenantsService.getTenantById.mockResolvedValue(mockTenant);

      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        'Order already processed',
      );
    });

    it('should reject duplicate payment session for order with existing pending payment ref', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'pending',
        paymentRef: 'gopay-123',
      });
      mockTenantsService.getTenantById.mockResolvedValue({ ...mockTenant, paymentProvider: 'gopay' });

      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        'Payment session already initialized for this order',
      );

      expect(mockOrdersService.tryStartPaymentSession).not.toHaveBeenCalled();
      expect(mockGopayService.createPayment).not.toHaveBeenCalled();
    });

    it('should reject concurrent payment session when lock is already held', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockTenantsService.getTenantById.mockResolvedValue({ ...mockTenant, paymentProvider: 'gopay' });
      mockOrdersService.tryStartPaymentSession.mockResolvedValue(false);

      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        'Payment session already initialized for this order',
      );

      expect(mockGopayService.createPayment).not.toHaveBeenCalled();
    });

    it('should clear payment initialization lock when provider create fails', async () => {
      const gopayTenant = { ...mockTenant, paymentProvider: 'gopay' };
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockTenantsService.getTenantById.mockResolvedValue(gopayTenant);
      mockGopayService.createPayment.mockRejectedValue(new Error('provider down'));

      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        'Payment session failed: provider down',
      );

      expect(mockOrdersService.clearPaymentSessionLock).toHaveBeenCalledWith(
        'order-123',
        expect.stringMatching(/^initializing:/),
      );
    });

    it('should throw BadRequestException for unsupported payment provider', async () => {
      const unsupportedTenant = { ...mockTenant, paymentProvider: 'unsupported' };
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockTenantsService.getTenantById.mockResolvedValue(unsupportedTenant);

      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentSession('order-123')).rejects.toThrow(
        'Unsupported payment provider',
      );
    });
  });

  describe('handleAdyenWebhook', () => {
    const mockOrder = {
      id: 'order-123',
      tenantId: 'tenant-123',
      status: OrderStatus.PENDING,
    };

    it('should handle successful payment and create delivery', async () => {
      const notification = {
        merchantReference: 'order-123',
        success: true,
        eventCode: 'AUTHORISATION',
        pspReference: 'adyen-ref-123',
      };

      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockResolvedValue(undefined);

      await service.handleAdyenWebhook(notification);

      expect(mockAdyenService.parseWebhook).toHaveBeenCalledWith(notification);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'adyen-ref-123',
        'success',
      );
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.PAID,
      );
      expect(mockDeliveryService.createDeliveryForOrder).toHaveBeenCalledWith('order-123');
    });

    it('is idempotent: skips a duplicate AUTHORISATION for an already-paid order', async () => {
      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentStatus: 'success',
      });

      await service.handleAdyenWebhook({});

      expect(mockOrdersService.updatePaymentRef).not.toHaveBeenCalled();
      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
      expect(mockDeliveryService.createDeliveryForOrder).not.toHaveBeenCalled();
    });

    it('does not flip an already-paid order to CANCELED on a late failure event', async () => {
      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: false,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PREPARING,
      });

      await service.handleAdyenWebhook({});

      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalledWith(
        'order-123',
        OrderStatus.CANCELED,
      );
    });

    it('refuses to mark PAID when the webhook amount does not match the order total', async () => {
      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
        amount: 50, // order total is 1200
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        totalCents: 1200,
      });

      await service.handleAdyenWebhook({});

      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
      expect(mockDeliveryService.createDeliveryForOrder).not.toHaveBeenCalled();
    });

    it('marks PAID when the webhook amount matches the order total', async () => {
      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
        amount: 1200,
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        totalCents: 1200,
      });
      mockDeliveryService.createDeliveryForOrder.mockResolvedValue(undefined);

      await service.handleAdyenWebhook({});

      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.PAID,
      );
    });

    it('should handle failed payment', async () => {
      const notification = {
        merchantReference: 'order-123',
        success: false,
        eventCode: 'AUTHORISATION',
        pspReference: 'adyen-ref-123',
      };

      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: false,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);

      await service.handleAdyenWebhook(notification);

      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'adyen-ref-123',
        'failed',
      );
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.CANCELED,
      );
      expect(mockDeliveryService.createDeliveryForOrder).not.toHaveBeenCalled();
    });

    it('should handle delivery creation failure gracefully', async () => {
      const notification = {
        merchantReference: 'order-123',
        success: true,
        eventCode: 'AUTHORISATION',
        pspReference: 'adyen-ref-123',
      };

      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockRejectedValue(
        new Error('Delivery service error'),
      );

      // Should not throw - delivery failure shouldn't break payment processing
      await service.handleAdyenWebhook(notification);

      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalled();
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.PAID,
      );
    });

    it('should return early if order not found', async () => {
      const notification = {
        merchantReference: 'non-existent',
        success: true,
        eventCode: 'AUTHORISATION',
      };

      mockAdyenService.parseWebhook.mockReturnValue({
        merchantReference: 'non-existent',
        success: true,
        eventType: 'AUTHORISATION',
        paymentRef: 'adyen-ref-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(null);

      await service.handleAdyenWebhook(notification);

      expect(mockOrdersService.updatePaymentRef).not.toHaveBeenCalled();
      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('handleGopayWebhook', () => {
    const mockOrder = {
      id: 'order-123',
      tenantId: 'tenant-123',
      status: OrderStatus.PENDING,
    };

    it('should handle successful GoPay payment', async () => {
      const webhookData = {
        id: 'gopay-123',
        order_number: 'order-123',
        state: 'PAID',
      };

      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'gopay-123',
        eventType: 'PAID',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockResolvedValue(undefined);

      await service.handleGopayWebhook(webhookData);

      expect(mockGopayService.parseWebhook).toHaveBeenCalledWith(webhookData);
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'gopay-123',
        'success',
      );
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.PAID,
      );
      expect(mockDeliveryService.createDeliveryForOrder).toHaveBeenCalledWith('order-123');
    });

    it('should handle failed GoPay payment', async () => {
      const webhookData = {
        id: 'gopay-123',
        order_number: 'order-123',
        state: 'CANCELED',
      };

      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: false,
        paymentRef: 'gopay-123',
        eventType: 'CANCELED',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);

      await service.handleGopayWebhook(webhookData);

      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'gopay-123',
        'failed',
      );
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.CANCELED,
      );
      expect(mockDeliveryService.createDeliveryForOrder).not.toHaveBeenCalled();
    });
  });

  describe('handleWepayWebhook', () => {
    const mockOrder = {
      id: 'order-123',
      tenantId: 'tenant-123',
      status: OrderStatus.PENDING,
    };

    it('should handle successful WePay payment', async () => {
      const webhookData = {
        payment_id: 'wepay-123',
        reference_id: 'order-123',
        state: 'captured',
      };

      mockWepayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'wepay-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockResolvedValue(undefined);

      await service.handleWepayWebhook(webhookData, 'signature-123');

      expect(mockWepayService.parseWebhook).toHaveBeenCalledWith(webhookData);
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'wepay-123',
        'success',
      );
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.PAID,
      );
      expect(mockDeliveryService.createDeliveryForOrder).toHaveBeenCalledWith('order-123');
    });

    it('is idempotent: skips a duplicate success for an already-paid order', async () => {
      mockWepayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'wepay-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentStatus: 'success',
      });

      await service.handleWepayWebhook({}, 'sig');

      expect(mockOrdersService.updatePaymentRef).not.toHaveBeenCalled();
      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
      expect(mockDeliveryService.createDeliveryForOrder).not.toHaveBeenCalled();
    });

    it('does not flip an already-paid order to CANCELED on a late failure event', async () => {
      mockWepayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: false,
        paymentRef: 'wepay-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.OUT_FOR_DELIVERY,
      });

      await service.handleWepayWebhook({}, 'sig');

      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalledWith(
        'order-123',
        OrderStatus.CANCELED,
      );
    });

    it('should handle failed WePay payment', async () => {
      const webhookData = {
        payment_id: 'wepay-123',
        reference_id: 'order-123',
        state: 'failed',
      };

      mockWepayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: false,
        paymentRef: 'wepay-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);

      await service.handleWepayWebhook(webhookData, 'signature-123');

      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'wepay-123',
        'failed',
      );
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith(
        'order-123',
        OrderStatus.CANCELED,
      );
      expect(mockDeliveryService.createDeliveryForOrder).not.toHaveBeenCalled();
    });
  });

  describe('syncGopayPaymentById', () => {
    const gopayTenant = {
      id: 'tenant-123',
      slug: 'pornopizza',
      paymentProvider: 'gopay',
    };

    it('syncs GoPay payment by existing paymentRef', async () => {
      const order = {
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.PENDING,
        paymentRef: 'gopay-123',
        paymentStatus: 'pending',
      };
      const paymentData = {
        id: 'gopay-123',
        order_number: 'order-123',
        state: 'PAID',
      };

      mockOrdersService.getOrderByPaymentRef.mockResolvedValue(order);
      mockTenantsService.getTenantById.mockResolvedValue(gopayTenant);
      mockGopayService.getPaymentStatus.mockResolvedValue(paymentData);
      mockGopayService.parseWebhook.mockReturnValue({
        eventType: 'PAID',
        success: true,
        paymentRef: 'gopay-123',
        merchantReference: 'order-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(order);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockResolvedValue(undefined);

      const result = await service.syncGopayPaymentById('gopay-123');

      expect(result).toEqual({
        orderId: 'order-123',
        tenantSlug: 'pornopizza',
        state: 'PAID',
      });
      expect(mockGopayService.getPaymentStatus).toHaveBeenCalledWith('gopay-123', gopayTenant);
    });

    it('recovers GoPay return when paymentRef is not stored yet by using order_number from status response', async () => {
      const order = {
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.PENDING,
        paymentRef: null,
        paymentStatus: 'initializing',
      };
      const paymentData = {
        id: 'gopay-123',
        order_number: 'order-123',
        state: 'CREATED',
      };

      mockOrdersService.getOrderByPaymentRef.mockResolvedValue(null);
      mockTenantsService.getAllTenants.mockResolvedValue([gopayTenant]);
      mockGopayService.getPaymentStatus.mockResolvedValue(paymentData);
      mockOrdersService.getOrderById.mockResolvedValue(order);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockGopayService.parseWebhook.mockReturnValue({
        eventType: 'CREATED',
        success: false,
        paymentRef: 'gopay-123',
        merchantReference: 'order-123',
      });

      const result = await service.syncGopayPaymentById('gopay-123');

      expect(result).toEqual({
        orderId: 'order-123',
        tenantSlug: 'pornopizza',
        state: 'CREATED',
      });
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith(
        'order-123',
        'gopay-123',
        'pending',
      );
      expect(mockGopayService.getPaymentStatus).toHaveBeenCalledTimes(1);
    });

    it('throws not found when no GoPay tenant can resolve payment id', async () => {
      mockOrdersService.getOrderByPaymentRef.mockResolvedValue(null);
      mockTenantsService.getAllTenants.mockResolvedValue([gopayTenant]);
      mockGopayService.getPaymentStatus.mockRejectedValue(new Error('not found'));

      await expect(service.syncGopayPaymentById('missing-payment')).rejects.toThrow(
        'Order for GoPay payment missing-payment not found',
      );
    });
  });
});
