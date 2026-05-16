import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StoryousService } from '../storyous/storyous.service';
import { ProductMappingService } from '../products/product-mapping.service';
import { JwtService } from '@nestjs/jwt';
import { CreateOrderDto } from './dto';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { SettingsService } from '../settings/settings.service';
import { DeliveryFeeTierService } from '../delivery/delivery-fee-tier.service';
import { OrderNumberService } from './order-number.service';
import { TelegramNotificationsService } from '../notifications/telegram-notifications.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let storyousService: StoryousService;
  let productMappingService: ProductMappingService;
  let jwtService: JwtService;
  let deliveryFeeTierService: DeliveryFeeTierService;
  let orderNumberService: OrderNumberService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    address: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    productMapping: {
      findMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
    },
  };

  const mockEmailService = {
    sendOrderConfirmation: jest.fn(),
    sendPasswordSetupEmail: jest.fn(),
  };

  const mockStoryousService = {
    createOrder: jest.fn(),
  };

  const mockSettingsService = {
    getStoryousSettings: jest.fn().mockResolvedValue(null),
    getStoryousAutoPrintReadiness: jest.fn().mockResolvedValue({
      ready: true,
      blockers: [],
      warnings: [],
      checks: {
        enabled: true,
        credentialsConfigured: true,
        merchantPlaceConfigured: true,
        autoAcceptPrintMode: true,
        receiptIncludeModifierLines: true,
        receiptIncludeOrderNumber: true,
      },
    }),
  };

  const mockDeliveryFeeTierService = {
    getApplicableFee: jest.fn().mockResolvedValue(null),
    getDeliveryFeeByDistance: jest.fn().mockResolvedValue({
      deliveryFeeCents: 300,
      distanceMeters: 0,
      isOutOfRange: false,
    }),
  };

  const mockOrderNumberService = {
    getNextOrderNumber: jest.fn().mockResolvedValue(1),
    generateOrderNumber: jest.fn().mockResolvedValue(1),
  };

  const mockTelegramNotificationsService = {
    notifyOrderCreated: jest.fn().mockResolvedValue(undefined),
    notifyOrderStatusChanged: jest.fn().mockResolvedValue(undefined),
    notifyError: jest.fn().mockResolvedValue(undefined),
  };

  const mockProductMappingService = {
    resolveToInternalName: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: StoryousService,
          useValue: mockStoryousService,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: DeliveryFeeTierService,
          useValue: mockDeliveryFeeTierService,
        },
        {
          provide: OrderNumberService,
          useValue: mockOrderNumberService,
        },
        {
          provide: ProductMappingService,
          useValue: mockProductMappingService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TelegramNotificationsService,
          useValue: mockTelegramNotificationsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    storyousService = module.get<StoryousService>(StoryousService);
    productMappingService = module.get<ProductMappingService>(ProductMappingService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const tenantId = 'tenant-123';
    const mockProduct = {
      id: 'product-1',
      name: 'Margherita',
      priceCents: 1000,
      tenantId,
      isActive: true,
      category: 'PIZZA',
      modifiers: null,
    };

    const mockTenant = {
      id: tenantId,
      name: 'Test Pizza',
      slug: 'testpizza',
      subdomain: 'testpizza',
      domain: 'testpizza.local',
      currency: 'EUR',
      theme: {
        taxRate: 20,
      },
    };

    const baseOrderDto: CreateOrderDto = {
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+421912345678',
      },
      address: {
        street: 'Main Street',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
        coordinates: { lat: 48.1486, lng: 17.1077 },
      },
      items: [
        {
          productId: 'product-1',
          quantity: 1,
        },
      ],
      deliveryFeeCents: 300,
    };

    const buildOrderResult = (overrides: Partial<any> = {}) => ({
      id: 'order-1',
      tenantId,
      userId: null,
      status: OrderStatus.PENDING,
      subtotalCents: 1000,
      taxCents: 0,
      deliveryFeeCents: 300,
      totalCents: 1300,
      items: [],
      tenant: mockTenant,
      customer: baseOrderDto.customer,
      address: baseOrderDto.address,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should create order with correct pricing (no modifiers)', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(buildOrderResult());

      const result = await service.createOrder(tenantId, baseOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalCents: 1000,
          taxCents: 0, // Prices already include VAT
          deliveryFeeCents: 300,
          totalCents: 1300, // 1000 + 300
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
    });

    it('should use saved address coordinates as backend fallback for logged-in user orders', async () => {
      const orderDtoWithoutCoordinates: CreateOrderDto = {
        ...baseOrderDto,
        userId: 'user-1',
        addressId: 'address-1',
        address: {
          street: 'Wrong payload street',
          city: 'Wrong payload city',
          postalCode: '99999',
          country: 'SK',
        },
      };

      mockPrismaService.address.findFirst.mockResolvedValue({
        id: 'address-1',
        street: 'Saved Street 12',
        description: '3. poschodie',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
        latitude: 48.1486,
        longitude: 17.1077,
      });
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          userId: 'user-1',
          address: {
            street: 'Saved Street 12',
            city: 'Bratislava',
            postalCode: '81101',
            country: 'SK',
            instructions: '3. poschodie',
            coordinates: { lat: 48.1486, lng: 17.1077 },
          },
        }),
      );

      await service.createOrder(tenantId, orderDtoWithoutCoordinates);

      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'address-1',
          userId: 'user-1',
        },
        select: {
          id: true,
          street: true,
          description: true,
          city: true,
          postalCode: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      });
      expect(mockDeliveryFeeTierService.getDeliveryFeeByDistance).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          street: 'Saved Street 12',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
          coordinates: { lat: 48.1486, lng: 17.1077 },
        }),
      );
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            address: expect.objectContaining({
              street: 'Saved Street 12',
              city: 'Bratislava',
              postalCode: '81101',
              country: 'SK',
              instructions: '3. poschodie',
              coordinates: { lat: 48.1486, lng: 17.1077 },
            }),
          }),
        }),
      );
    });

    it('should calculate modifier prices correctly', async () => {
      const orderDtoWithModifiers: CreateOrderDto = {
        ...baseOrderDto,
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            modifiers: {
              dough: ['gluten-free-28'], // +249
              toppings: ['parmesan', 'bacon'], // +199 + 199
            },
          },
        ],
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          subtotalCents: 1647, // base 1000 + modifiers 647
          taxCents: 0,
          deliveryFeeCents: 300,
          totalCents: 1947, // 1647 + 300
        }),
      );

      await service.createOrder(tenantId, orderDtoWithModifiers);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalCents: 1647, // 1000 (base) + 249 + 199 + 199
          taxCents: 0, // Prices already include VAT
          totalCents: 1947, // 1647 + 300
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
    });

    it('should calculate quantity correctly', async () => {
      const orderDtoMultiple: CreateOrderDto = {
        ...baseOrderDto,
        items: [
          {
            productId: 'product-1',
            quantity: 3,
            modifiers: {
              dough: ['cheesy-edge'], // +249 per item
            },
          },
        ],
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          subtotalCents: 3747, // (1000 + 249) * 3
          taxCents: 0,
          deliveryFeeCents: 300,
          totalCents: 4047,
        }),
      );

      await service.createOrder(tenantId, orderDtoMultiple);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalCents: 3747, // (1000 + 249) * 3
          taxCents: 0, // Prices already include VAT
          totalCents: 4047, // 3747 + 300
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
    });

    it('should throw BadRequestException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.createOrder(tenantId, baseOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(tenantId, baseOrderDto)).rejects.toThrow(
        'Product not found',
      );
    });

    it('should create guest order without userId', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          userId: null,
        }),
      );

      await service.createOrder(tenantId, baseOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
    });

    it('should create user and return auth token for guest checkout with paymentMethod', async () => {
      const guestOrderDto: CreateOrderDto = {
        ...baseOrderDto,
        paymentMethod: 'cash',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      // User already exists (auto-login scenario)
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+421912345678',
        role: 'CUSTOMER',
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          userId: 'user-1',
          paymentStatus: 'pending',
          paymentRef: 'cod:cash',
        }),
      );
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        token: process.env.TEST_REFRESH_TOKEN || 'test-refresh-token',
        expiresAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.createOrder(tenantId, guestOrderDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled(); // User exists, no creation
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          paymentStatus: 'pending',
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
      expect(result).toHaveProperty('authToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should store card-on-delivery marker in paymentRef without changing pending payment status', async () => {
      const cardOrderDto: CreateOrderDto = {
        ...baseOrderDto,
        paymentMethod: 'card',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-card',
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+421912345678',
        role: 'CUSTOMER',
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          userId: 'user-card',
          paymentStatus: 'pending',
          paymentRef: 'cod:card',
        }),
      );
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'refresh-card',
        userId: 'user-card',
        token: process.env.TEST_REFRESH_TOKEN || 'test-refresh-token',
        expiresAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      await service.createOrder(tenantId, cardOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-card',
          paymentStatus: 'pending',
          paymentRef: 'cod:card',
        }),
        include: expect.any(Object),
      });
    });

    it('should auto-login existing user by email', async () => {
      const guestOrderDto: CreateOrderDto = {
        ...baseOrderDto,
        paymentMethod: 'cash',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'CUSTOMER',
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          userId: 'existing-user',
          paymentStatus: 'pending',
        }),
      );
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'refresh-1',
        userId: 'existing-user',
        token: process.env.TEST_REFRESH_TOKEN || 'test-refresh-token',
        expiresAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.createOrder(tenantId, guestOrderDto);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'john@example.com', tenantId, role: 'CUSTOMER' },
      });
      expect(result).toHaveProperty('authToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should include houseNumber in address', async () => {
      const orderDtoWithHouseNumber: CreateOrderDto = {
        ...baseOrderDto,
        address: {
          ...baseOrderDto.address,
          houseNumber: '42',
        },
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          address: orderDtoWithHouseNumber.address,
        }),
      );

      await service.createOrder(tenantId, orderDtoWithHouseNumber);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          address: expect.objectContaining({
            houseNumber: '42',
          }),
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
    });

    it('should keep taxCents at zero when prices include VAT', async () => {
      const tenantWithoutTaxRate = {
        ...mockTenant,
        theme: {},
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(tenantWithoutTaxRate);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          tenant: tenantWithoutTaxRate,
        }),
      );

      await service.createOrder(tenantId, baseOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taxCents: 0, // Prices already include VAT
        }),
        include: expect.objectContaining({
          items: true,
          tenant: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
            }),
          }),
        }),
      });
    });

    it('should send order confirmation email', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue(buildOrderResult());

      await service.createOrder(tenantId, baseOrderDto);

      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalled();
    });

    it('should not call Storyous during order creation', async () => {
      const tenantWithStoryous = {
        ...mockTenant,
        theme: {
          taxRate: 20,
          storyousConfig: {
            enabled: true,
            merchantId: 'merchant-123',
            placeId: 'place-123',
          },
        },
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(tenantWithStoryous);
      mockPrismaService.order.create.mockResolvedValue(
        buildOrderResult({
          tenant: tenantWithStoryous,
        }),
      );

      const result = await service.createOrder(tenantId, baseOrderDto);

      expect(mockStoryousService.createOrder).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      const mockOrder = {
        id: 'order-1',
        tenantId: 'tenant-123',
        status: OrderStatus.PENDING,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order-1');

      expect(result).toEqual(expect.objectContaining(mockOrder));
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: true,
          delivery: true,
          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncOrderToStoryous', () => {
    const syncedOrderBase = {
      id: 'order-storyous-1',
      tenantId: 'tenant-123',
      storyousOrderId: null,
      storyousOrderState: null,
      status: OrderStatus.PREPARING,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+421912345678',
      },
      address: {
        street: 'Main Street',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'SK',
      },
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          productName: 'Margherita',
          quantity: 1,
          priceCents: 1000,
          modifiers: null,
        },
      ],
      tenant: {
        id: 'tenant-123',
        slug: 'testpizza',
        subdomain: 'testpizza',
        domain: 'testpizza.local',
        theme: {
          taxRate: 20,
        },
      },
      delivery: null,
      subtotalCents: 1000,
      taxCents: 0,
      deliveryFeeCents: 300,
      totalCents: 1300,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockSettingsService.getStoryousSettings.mockResolvedValue({
        clientId: 'client',
        clientSecret: 'secret',
        merchantId: 'merchant-123',
        placeId: 'place-123',
        enabled: true,
        autoSync: true,
        defaultDeliveryLeadMinutes: 45,
        autoAcceptPrintMode: true,
        receiptIncludeModifierLines: true,
        receiptIncludeOrderNumber: true,
      });
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          name: 'Margherita',
          category: 'PIZZA',
        },
      ]);
      mockPrismaService.productMapping.findMany.mockResolvedValue([
        {
          externalIdentifier: 'storyous-item-1',
          internalProductName: 'Margherita',
          updatedAt: new Date(),
        },
      ]);
    });

    it('returns success and persists CONFIRMED state when Storyous confirms the order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(syncedOrderBase);
      mockStoryousService.createOrder.mockResolvedValue({
        id: 'storyous-1',
        storyousState: 'CONFIRMED',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...syncedOrderBase,
        storyousOrderId: 'storyous-1',
        storyousOrderState: 'CONFIRMED',
      });

      const result = await service.syncOrderToStoryous('order-storyous-1');

      expect(result).toEqual({
        success: true,
        storyousOrderId: 'storyous-1',
        storyousState: 'CONFIRMED',
        message: 'Order confirmed in Storyous successfully (storyous-1)',
      });
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-storyous-1' },
        data: {
          storyousOrderId: 'storyous-1',
          storyousOrderState: 'CONFIRMED',
        },
      });
    });

    it('returns failure and persists NEW state when Storyous still requires manual acceptance', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(syncedOrderBase);
      mockStoryousService.createOrder.mockResolvedValue({
        id: 'storyous-2',
        storyousState: 'NEW',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...syncedOrderBase,
        storyousOrderId: 'storyous-2',
        storyousOrderState: 'NEW',
      });

      const result = await service.syncOrderToStoryous('order-storyous-1');

      expect(result.success).toBe(false);
      expect(result.storyousOrderId).toBe('storyous-2');
      expect(result.storyousState).toBe('NEW');
      expect(result.message).toContain('still requires manual acceptance');
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-storyous-1' },
        data: {
          storyousOrderId: 'storyous-2',
          storyousOrderState: 'NEW',
        },
      });
    });
  });
});
