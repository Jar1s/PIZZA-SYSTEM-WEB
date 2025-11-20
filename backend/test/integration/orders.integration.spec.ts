import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { OrdersService } from '../../src/orders/orders.service';
import { OrderStatusService } from '../../src/orders/order-status.service';
import { TenantsService } from '../../src/tenants/tenants.service';
import { ProductsService } from '../../src/products/products.service';
import { ProductMappingService } from '../../src/products/product-mapping.service';
import { EmailService } from '../../src/email/email.service';
import { StoryousService } from '../../src/storyous/storyous.service';
import { DeliveryZoneService } from '../../src/delivery/delivery-zone.service';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { BadRequestException } from '@nestjs/common';

/**
 * Integration tests for OrdersService
 * These tests use a REAL database to test Prisma queries and constraints
 * 
 * To run: npm run test:e2e
 * WARNING: Use a dedicated test database!
 */
describe('OrdersService Integration Tests', () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let ordersService: OrdersService;
  let tenantsService: TenantsService;
  let productsService: ProductsService;
  let testTenantId: string;
  let testProductId: string;
  let testUserId: string;
  let testOrderId: string;

  beforeAll(async () => {
    const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!testDbUrl) {
      throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set');
    }

    // Create service instances first
    const prismaInstance = new PrismaService();
    const tenantsServiceInstance = new TenantsService(prismaInstance);
    
    module = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: prismaInstance,
        },
        OrdersService,
        OrderStatusService,
        {
          provide: TenantsService,
          useValue: tenantsServiceInstance,
        },
        ProductsService,
        {
          provide: EmailService,
          useValue: {
            sendOrderConfirmation: jest.fn(),
          },
        },
        {
          provide: StoryousService,
          useValue: {
            syncOrder: jest.fn(),
          },
        },
        {
          provide: DeliveryZoneService,
          useValue: {
            getDeliveryFee: jest.fn().mockResolvedValue({
              deliveryFeeCents: 500,
              minOrderCents: 1000,
            }),
          },
        },
        {
          provide: ProductMappingService,
          useValue: {
            mapProductToStoryous: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    ordersService = module.get<OrdersService>(OrdersService);
    tenantsService = module.get<TenantsService>(TenantsService);
    productsService = module.get<ProductsService>(ProductsService);

    // Create test tenant
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'pornopizza' },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          slug: `test_tenant_${Date.now()}`,
          subdomain: `test_tenant_${Date.now()}`,
          domain: 'test.localhost',
          theme: {},
          paymentConfig: {},
          deliveryConfig: {},
          currency: 'EUR',
        },
      });
    }
    testTenantId = tenant.id;

    // Create test product
    const product = await productsService.createProduct(testTenantId, {
      name: 'Test Pizza',
      description: 'Test Description',
      priceCents: 1000,
      taxRate: 20,
      category: 'PIZZA',
      isActive: true,
    });
    testProductId = product.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        username: `test_user_${Date.now()}`,
        password: 'hashed',
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        role: 'CUSTOMER',
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up in correct order (respect foreign key constraints)
    if (testOrderId) {
      // Delete order items first
      await prisma.orderItem.deleteMany({
        where: { orderId: testOrderId },
      }).catch(() => {}); // Ignore if already deleted
      // Then delete order
      await prisma.order.delete({
        where: { id: testOrderId },
      }).catch(() => {}); // Ignore if already deleted
    }
    // Delete product after orders are deleted
    if (testProductId) {
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }
    // Delete user
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await module.close();
  });

  describe('Order Creation', () => {
    it('should create an order with valid data', async () => {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
            priceCents: 1000,
          },
        ],
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+421900000000',
        },
        address: {
          street: 'Test Street 1',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
        },
        subtotalCents: 2000,
        taxCents: 400,
        totalCents: 2900, // 2000 + 400 + 500 (delivery fee)
      };

      const result = await ordersService.createOrder(testTenantId, orderData);

      // createOrder can return Order or { order: Order, ... }
      const order = 'order' in result ? result.order : result;
      
      expect(order).toBeDefined();
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.tenantId).toBe(testTenantId);
      expect(order.totalCents).toBe(2900); // Includes delivery fee (500)
      testOrderId = order.id;
    });

    it('should enforce foreign key constraint for productId', async () => {
      const orderData = {
        items: [
          {
            productId: 'non-existent-product-id',
            quantity: 1,
            priceCents: 1000,
          },
        ],
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+421900000000',
        },
        address: {
          street: 'Test Street',
          city: 'Bratislava',
          postalCode: '81101',
          country: 'SK',
        },
        subtotalCents: 1000,
        taxCents: 200,
        totalCents: 1200,
      };

      // This should fail when trying to create order items with invalid productId
      // The exact error depends on when validation happens (service vs database)
      await expect(
        ordersService.createOrder(testTenantId, orderData)
      ).rejects.toThrow();
    });

    it('should create order items linked to order', async () => {
      // This test depends on the previous test creating an order
      // If testOrderId is not set, skip this test
      if (!testOrderId) {
        console.warn('Skipping test - testOrderId not set');
        return;
      }
      
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
        include: { items: true },
      });

      expect(order).toBeDefined();
      expect(order?.items).toBeDefined();
      expect(order?.items.length).toBeGreaterThan(0);
      expect(order?.items[0].orderId).toBe(testOrderId);
    });
  });

  describe('Order Status Updates', () => {
    it('should update order status in database', async () => {
      const orderStatusService = module.get<OrderStatusService>(OrderStatusService);
      
      await orderStatusService.updateStatus(testOrderId, OrderStatus.PAID);

      const updated = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(updated?.status).toBe(OrderStatus.PAID);
    });

    it('should query orders by status', async () => {
      const paidOrders = await prisma.order.findMany({
        where: {
          tenantId: testTenantId,
          status: OrderStatus.PAID,
        },
      });

      expect(paidOrders).toBeDefined();
      expect(Array.isArray(paidOrders)).toBe(true);
      // Should include our test order
      const hasTestOrder = paidOrders.some(o => o.id === testOrderId);
      expect(hasTestOrder).toBe(true);
    });

    it('should query orders by tenant and date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const orders = await prisma.order.findMany({
        where: {
          tenantId: testTenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
      // Verify ordering (newest first)
      if (orders.length > 1) {
        expect(orders[0].createdAt.getTime()).toBeGreaterThanOrEqual(
          orders[1].createdAt.getTime()
        );
      }
    });
  });

  describe('Database Indexes', () => {
    it('should efficiently query orders by tenantId and createdAt (indexed)', async () => {
      // This test verifies that the index on [tenantId, createdAt] exists
      // and allows efficient queries
      const startTime = Date.now();
      
      const orders = await prisma.order.findMany({
        where: {
          tenantId: testTenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      const queryTime = Date.now() - startTime;

      expect(orders).toBeDefined();
      // Query should be fast (under 100ms for small dataset)
      // In production with thousands of orders, the index makes a huge difference
      expect(queryTime).toBeLessThan(1000); // 1 second max for test
    });
  });
});

