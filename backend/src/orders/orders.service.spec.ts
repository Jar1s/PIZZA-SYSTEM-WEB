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

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let storyousService: StoryousService;
  let productMappingService: ProductMappingService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
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
          provide: ProductMappingService,
          useValue: mockProductMappingService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
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
      modifiers: [
        {
          id: 'size',
          name: 'Size',
          options: [
            { id: 'small', name: 'Small', priceCents: 0 },
            { id: 'large', name: 'Large', priceCents: 500 },
          ],
        },
        {
          id: 'toppings',
          name: 'Extra Toppings',
          options: [
            { id: 'cheese', name: 'Extra Cheese', priceCents: 200 },
            { id: 'pepperoni', name: 'Pepperoni', priceCents: 300 },
          ],
        },
      ],
    };

    const mockTenant = {
      id: tenantId,
      name: 'Test Pizza',
      slug: 'testpizza',
      domain: 'testpizza.local',
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

    it('should create order with correct pricing (no modifiers)', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: mockTenant,
      });

      const result = await service.createOrder(tenantId, baseOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalCents: 1000,
          taxCents: 200, // 20% of 1000
          deliveryFeeCents: 300,
          totalCents: 1500, // 1000 + 200 + 300
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
      });
    });

    it('should calculate modifier prices correctly', async () => {
      const orderDtoWithModifiers: CreateOrderDto = {
        ...baseOrderDto,
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            modifiers: {
              size: ['large'], // +500
              toppings: ['cheese', 'pepperoni'], // +200 + 300 = +500
            },
          },
        ],
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 2000, // base 1000 + modifiers 1000
        taxCents: 400,
        deliveryFeeCents: 300,
        totalCents: 2700,
        items: [],
        tenant: mockTenant,
      });

      await service.createOrder(tenantId, orderDtoWithModifiers);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalCents: 2000, // 1000 (base) + 500 (large) + 200 (cheese) + 300 (pepperoni)
          taxCents: 400, // 20% of 2000
          totalCents: 2700, // 2000 + 400 + 300
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
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
              size: ['large'], // +500 per item
            },
          },
        ],
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 4500, // (1000 + 500) * 3
        taxCents: 900,
        deliveryFeeCents: 300,
        totalCents: 5700,
        items: [],
        tenant: mockTenant,
      });

      await service.createOrder(tenantId, orderDtoMultiple);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subtotalCents: 4500, // (1000 + 500) * 3
          taxCents: 900, // 20% of 4500
          totalCents: 5700, // 4500 + 900 + 300
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
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
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        userId: null,
        status: OrderStatus.PENDING,
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: mockTenant,
      });

      await service.createOrder(tenantId, baseOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
      });
    });

    it('should create user and return auth token for guest checkout with paymentMethod', async () => {
      const guestOrderDto: CreateOrderDto = {
        ...baseOrderDto,
        paymentMethod: 'cash',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      // User already exists (auto-login scenario)
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+421912345678',
        role: 'CUSTOMER',
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        userId: 'user-1',
        status: OrderStatus.PENDING,
        paymentStatus: 'pending',
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: mockTenant,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        token: 'refresh-token',
        expiresAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.createOrder(tenantId, guestOrderDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled(); // User exists, no creation
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          paymentStatus: 'pending',
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
      });
      expect(result).toHaveProperty('authToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should auto-login existing user by email', async () => {
      const guestOrderDto: CreateOrderDto = {
        ...baseOrderDto,
        paymentMethod: 'cash',
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'CUSTOMER',
      });
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        userId: 'existing-user',
        status: OrderStatus.PENDING,
        paymentStatus: 'pending',
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: mockTenant,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'refresh-1',
        userId: 'existing-user',
        token: 'refresh-token',
        expiresAt: new Date(),
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.createOrder(tenantId, guestOrderDto);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
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
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: mockTenant,
      });

      await service.createOrder(tenantId, orderDtoWithHouseNumber);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          address: expect.objectContaining({
            houseNumber: '42',
          }),
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
      });
    });

    it('should use default tax rate if tenant theme does not have taxRate', async () => {
      const tenantWithoutTaxRate = {
        ...mockTenant,
        theme: {},
      };

      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(tenantWithoutTaxRate);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 1000,
        taxCents: 200, // Default 20%
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: tenantWithoutTaxRate,
      });

      await service.createOrder(tenantId, baseOrderDto);

      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taxCents: 200, // Default 20%
        }),
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
            },
          },
        },
      });
    });

    it('should send order confirmation email', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: mockTenant,
      });

      await service.createOrder(tenantId, baseOrderDto);

      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalled();
    });

    it('should handle Storyous sync failure gracefully', async () => {
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
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        tenantId,
        status: OrderStatus.PENDING,
        subtotalCents: 1000,
        taxCents: 200,
        deliveryFeeCents: 300,
        totalCents: 1500,
        items: [],
        tenant: tenantWithStoryous,
      });
      mockStoryousService.createOrder.mockRejectedValue(new Error('Storyous API error'));

      // Should not throw - order is created, but Storyous sync fails
      const result = await service.createOrder(tenantId, baseOrderDto);

      expect(mockStoryousService.createOrder).toHaveBeenCalled();
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

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: true,
          delivery: true,
        },
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});

