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
import { TelegramNotificationsService } from '../notifications/telegram-notifications.service';
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
    refundPayment: jest.fn(),
  };

  const mockWepayService = {
    createPayment: jest.fn(),
    parseWebhook: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  const mockOrdersService = {
    getOrderById: jest.fn(),
    getOrderByPaymentRef: jest.fn(),
    findStalePendingGopayPaymentOrders: jest.fn(),
    updatePaymentRef: jest.fn(),
    updateRefundStatus: jest.fn(),
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

  const mockTelegramNotifications = {
    notifyError: jest.fn(),
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
        {
          provide: TelegramNotificationsService,
          useValue: mockTelegramNotifications,
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
    mockTelegramNotifications.notifyError.mockResolvedValue(undefined);
    mockOrdersService.findStalePendingGopayPaymentOrders.mockResolvedValue([]);
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
      expect(mockTelegramNotifications.notifyError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Wolt dispatch failed after payment',
          message: expect.stringContaining('Delivery service error'),
          tenantId: 'tenant-123',
          orderId: 'order-123',
          details: expect.objectContaining({
            paymentProvider: 'adyen',
            paymentRef: 'adyen-ref-123',
            orderStatus: OrderStatus.PAID,
            paymentStatus: 'success',
          }),
          stack: expect.any(String),
        }),
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

    it('alerts operator when GoPay payment succeeds but Wolt delivery creation fails', async () => {
      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'gopay-123',
        eventType: 'PAID',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockRejectedValue(new Error('Wolt unavailable'));

      await service.handleGopayWebhook({ state: 'PAID' });

      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith('order-123', 'gopay-123', 'success');
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith('order-123', OrderStatus.PAID);
      expect(mockTelegramNotifications.notifyError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Wolt dispatch failed after payment',
          message: expect.stringContaining('Wolt unavailable'),
          tenantId: 'tenant-123',
          orderId: 'order-123',
          details: expect.objectContaining({
            paymentProvider: 'gopay',
            paymentRef: 'gopay-123',
            orderStatus: OrderStatus.PAID,
            paymentStatus: 'success',
          }),
          stack: expect.any(String),
        }),
      );
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

    it('should record refund confirmation on REFUNDED webhook', async () => {
      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: false,
        paymentRef: 'gopay-123',
        eventType: 'REFUNDED',
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELED,
      });
      mockOrdersService.updateRefundStatus.mockResolvedValue(undefined);

      await service.handleGopayWebhook({ state: 'REFUNDED' });

      expect(mockOrdersService.updateRefundStatus).toHaveBeenCalledWith('order-123', 'refunded');
      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
    });

    it('should auto-refund when PAID arrives for canceled order without prior refund', async () => {
      const canceledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        totalCents: 2500,
        refundStatus: null,
      };
      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'gopay-123',
        eventType: 'PAID',
      });
      mockOrdersService.getOrderById.mockResolvedValue(canceledOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrdersService.updateRefundStatus.mockResolvedValue(undefined);
      mockTenantsService.getTenantById.mockResolvedValue({
        id: 'tenant-123',
        paymentProvider: 'gopay',
      });
      mockGopayService.refundPayment.mockResolvedValue(undefined);

      await service.handleGopayWebhook({ state: 'PAID' });

      expect(mockGopayService.refundPayment).toHaveBeenCalled();
      expect(mockOrdersService.updateRefundStatus).toHaveBeenCalledWith('order-123', 'refund_pending');
      expect(mockOrderStatusService.updateStatus).not.toHaveBeenCalled();
    });

    it('should not mark success nor refund when PAID for canceled order reports a mismatched amount', async () => {
      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'gopay-123',
        eventType: 'PAID',
        amount: 999, // order total is 2500
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        totalCents: 2500,
        refundStatus: null,
      });

      await service.handleGopayWebhook({ state: 'PAID' });

      expect(mockOrdersService.updatePaymentRef).not.toHaveBeenCalled();
      expect(mockGopayService.refundPayment).not.toHaveBeenCalled();
      expect(mockOrdersService.updateRefundStatus).not.toHaveBeenCalled();
    });

    it('should not refund again when PAID retries for canceled order with refund already recorded', async () => {
      mockGopayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'gopay-123',
        eventType: 'PAID',
      });
      mockOrdersService.getOrderById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        refundStatus: 'refund_pending',
      });
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);

      await service.handleGopayWebhook({ state: 'PAID' });

      expect(mockGopayService.refundPayment).not.toHaveBeenCalled();
      expect(mockOrdersService.updateRefundStatus).not.toHaveBeenCalled();
    });
  });

  describe('refundGopayPayment', () => {
    const paidOrder = {
      id: 'order-123',
      tenantId: 'tenant-123',
      orderNumber: 42,
      status: OrderStatus.CANCELED,
      paymentRef: 'gopay-123',
      totalCents: 2500,
      refundStatus: null,
    };
    const gopayTenant = { id: 'tenant-123', paymentProvider: 'gopay' };

    it('should mark refund_pending after GoPay accepts the refund', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(paidOrder);
      mockTenantsService.getTenantById.mockResolvedValue(gopayTenant);
      mockGopayService.refundPayment.mockResolvedValue(undefined);

      await service.refundGopayPayment('order-123');

      expect(mockGopayService.refundPayment).toHaveBeenCalledWith('gopay-123', 2500, gopayTenant);
      expect(mockOrdersService.updateRefundStatus).toHaveBeenCalledWith('order-123', 'refund_pending');
      expect(mockTelegramNotifications.notifyError).not.toHaveBeenCalled();
    });

    it('should mark refund_failed, notify Telegram and rethrow when GoPay refund fails', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(paidOrder);
      mockTenantsService.getTenantById.mockResolvedValue(gopayTenant);
      mockOrdersService.updateRefundStatus.mockResolvedValue(undefined);
      mockGopayService.refundPayment.mockRejectedValue(new Error('GoPay is down'));

      await expect(service.refundGopayPayment('order-123')).rejects.toThrow('GoPay is down');

      expect(mockOrdersService.updateRefundStatus).toHaveBeenCalledWith(
        'order-123',
        'refund_failed',
        'GoPay is down',
      );
      expect(mockTelegramNotifications.notifyError).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'order-123' }),
      );
    });

    it('should skip when order is already refunded', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({ ...paidOrder, refundStatus: 'refunded' });
      mockTenantsService.getTenantById.mockResolvedValue(gopayTenant);

      await service.refundGopayPayment('order-123');

      expect(mockGopayService.refundPayment).not.toHaveBeenCalled();
      expect(mockOrdersService.updateRefundStatus).not.toHaveBeenCalled();
    });
  });

  describe('retryGopayRefund', () => {
    it('should return refreshed refund state and not throw when the retry fails', async () => {
      const failingOrder = {
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        paymentStatus: 'success',
        totalCents: 2500,
        refundStatus: 'refund_failed',
        refundError: 'previous failure',
        refundedAt: null,
      };
      mockOrdersService.getOrderById.mockResolvedValue(failingOrder);
      mockTenantsService.getTenantById.mockResolvedValue({ id: 'tenant-123', paymentProvider: 'gopay' });
      mockOrdersService.updateRefundStatus.mockResolvedValue(undefined);
      mockGopayService.refundPayment.mockRejectedValue(new Error('still down'));

      const result = await service.retryGopayRefund('order-123');

      expect(result.refundStatus).toBe('refund_failed');
      expect(mockGopayService.refundPayment).toHaveBeenCalled();
    });

    it('should reject retry for cash-on-delivery orders', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.CANCELED,
        paymentRef: 'cod:cash',
        refundStatus: null,
      });

      await expect(service.retryGopayRefund('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should reject retry when already refunded', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        refundStatus: 'refunded',
      });

      await expect(service.retryGopayRefund('order-123')).rejects.toThrow(BadRequestException);
    });

    it('should reject retry for orders that are not canceled', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.PAID,
        paymentRef: 'gopay-123',
        paymentStatus: 'success',
        refundStatus: null,
      });

      await expect(service.retryGopayRefund('order-123')).rejects.toThrow(
        'Refund is only available for canceled orders',
      );
      expect(mockGopayService.refundPayment).not.toHaveBeenCalled();
    });

    it('should reject retry while a refund is pending confirmation', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        paymentStatus: 'success',
        refundStatus: 'refund_pending',
      });

      await expect(service.retryGopayRefund('order-123')).rejects.toThrow(BadRequestException);
      expect(mockGopayService.refundPayment).not.toHaveBeenCalled();
    });

    it('should reject retry when the payment never succeeded', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        paymentStatus: 'pending',
        refundStatus: null,
      });

      await expect(service.retryGopayRefund('order-123')).rejects.toThrow(
        'Order payment was not completed, there is nothing to refund',
      );
      expect(mockGopayService.refundPayment).not.toHaveBeenCalled();
    });

    it('should allow retry for partially refunded orders and attempt the refund', async () => {
      const partialOrder = {
        id: 'order-123',
        tenantId: 'tenant-123',
        status: OrderStatus.CANCELED,
        paymentRef: 'gopay-123',
        paymentStatus: 'success',
        totalCents: 2500,
        refundStatus: 'partially_refunded',
        refundError: null,
        refundedAt: null,
      };
      mockOrdersService.getOrderById.mockResolvedValue(partialOrder);
      mockTenantsService.getTenantById.mockResolvedValue({ id: 'tenant-123', paymentProvider: 'gopay' });
      mockOrdersService.updateRefundStatus.mockResolvedValue(undefined);
      mockGopayService.refundPayment.mockResolvedValue(undefined);

      await service.retryGopayRefund('order-123');

      expect(mockGopayService.refundPayment).toHaveBeenCalledWith('gopay-123', 2500, expect.anything());
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

    it('alerts operator when WePay payment succeeds but Wolt delivery creation fails', async () => {
      mockWepayService.parseWebhook.mockReturnValue({
        merchantReference: 'order-123',
        success: true,
        paymentRef: 'wepay-123',
      });
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      mockOrdersService.updatePaymentRef.mockResolvedValue(undefined);
      mockOrderStatusService.updateStatus.mockResolvedValue(undefined);
      mockDeliveryService.createDeliveryForOrder.mockRejectedValue(new Error('Wolt create failed'));

      await service.handleWepayWebhook({ state: 'captured' }, 'signature-123');

      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith('order-123', 'wepay-123', 'success');
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith('order-123', OrderStatus.PAID);
      expect(mockTelegramNotifications.notifyError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Wolt dispatch failed after payment',
          message: expect.stringContaining('Wolt create failed'),
          tenantId: 'tenant-123',
          orderId: 'order-123',
          details: expect.objectContaining({
            paymentProvider: 'wepay',
            paymentRef: 'wepay-123',
            orderStatus: OrderStatus.PAID,
            paymentStatus: 'success',
          }),
          stack: expect.any(String),
        }),
      );
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

    it('reconciles stale pending GoPay payments in the background worker', async () => {
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

      mockOrdersService.findStalePendingGopayPaymentOrders.mockResolvedValue([
        { id: 'order-123', tenantId: 'tenant-123', paymentRef: 'gopay-123' },
      ]);
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

      await (service as any).reconcilePendingGopayPayments();

      expect(mockOrdersService.findStalePendingGopayPaymentOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          olderThan: expect.any(Date),
          limit: expect.any(Number),
        }),
      );
      expect(mockGopayService.getPaymentStatus).toHaveBeenCalledWith('gopay-123', gopayTenant);
      expect(mockOrdersService.updatePaymentRef).toHaveBeenCalledWith('order-123', 'gopay-123', 'success');
      expect(mockOrderStatusService.updateStatus).toHaveBeenCalledWith('order-123', OrderStatus.PAID);
      expect(mockDeliveryService.createDeliveryForOrder).toHaveBeenCalledWith('order-123');
    });
  });
});
