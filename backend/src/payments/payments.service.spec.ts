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
    updatePaymentRef: jest.fn(),
  };

  const mockOrderStatusService = {
    updateStatus: jest.fn(),
  };

  const mockTenantsService = {
    getTenantById: jest.fn(),
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
});

