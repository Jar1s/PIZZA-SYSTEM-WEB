import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Param, 
  Body, 
  Query,
  Request,
  NotFoundException,
  UseGuards,
  Logger,
  Header,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { PaymentsService } from '../payments/payments.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';

// Public customer-facing endpoints
@Controller(':tenantSlug/orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 orders per minute
  @Post()
  async createOrder(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: CreateOrderDto,
  ) {
    // Log raw data before DTO validation/transformation
    this.logger.log('createOrder received data', {
      tenantSlug,
      itemsCount: data.items?.length,
      items: data.items?.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        modifiers: item.modifiers,
      })),
    });

    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const result = await this.ordersService.createOrder(tenant.id, data);
    
    // Handle both return types: Order or { order: Order; authToken?: string; ... }
    const order = 'order' in result ? result.order : result;
    
    this.logger.log('Order created successfully', {
      orderId: order.id,
      itemsCount: order.items?.length,
    });
    
    return result;
  }

  // Backward-compatible admin sync route with tenant prefix
  // Some frontend builds call /api/:tenantSlug/orders/:id/sync-storyous
  @Post(':id/sync-storyous')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async syncToStoryousTenantRoute(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    const order = await this.ordersService.getOrderById(id);
    const orderTenantId = (order as any)?.tenantId;

    if (orderTenantId && orderTenantId !== tenant.id) {
      throw new NotFoundException(`Order ${id} not found for tenant ${tenantSlug}`);
    }

    return this.ordersService.syncOrderToStoryous(id);
  }
}

// Admin endpoints for managing orders
@Controller('orders')
export class AdminOrdersController {
  private readonly logger = new Logger(AdminOrdersController.name);

  constructor(
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getOrders(
    @Query('tenantSlug') tenantSlug?: string,
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!tenantSlug) {
      throw new NotFoundException('tenantSlug query parameter is required');
    }
    
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    
    // Parse dates properly - startDate should be beginning of day, endDate should be end of day
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? (() => {
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999); // Set to end of day
      return date;
    })() : undefined;

    return this.ordersService.getOrders(tenant.id, {
      status,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Get(':id/storyous-preview')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getStoryousPreview(@Param('id') id: string) {
    return this.ordersService.getStoryousReceiptPreview(id);
  }

  @Get('storyous-preview-sample/current')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async getStoryousSamplePreview(@Query('tenantSlug') tenantSlug?: string) {
    return this.ordersService.getStoryousSampleReceiptPreview(tenantSlug);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() data: UpdateOrderStatusDto,
  ) {
    await this.orderStatusService.updateStatus(id, data.status);
    return { message: 'Status updated' };
  }

  @Post(':id/sync-storyous')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async syncToStoryous(
    @Param('id') id: string,
  ) {
    return this.ordersService.syncOrderToStoryous(id);
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
  async refundOrder(@Param('id') id: string) {
    return this.paymentsService.retryGopayRefund(id);
  }
}

// Public tracking endpoint
@Controller('track')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private ordersService: OrdersService) {}

  /**
   * Public tracking is reachable by anyone holding the order id, so it must not
   * expose contact PII (email/phone) or internal references (paymentRef, userId,
   * Storyous ids). Return only the fields the tracking page renders.
   */
  private toPublicTrackingOrder(order: any) {
    if (!order || typeof order !== 'object') {
      return order;
    }

    const customer =
      order.customer && typeof order.customer === 'object' ? order.customer : null;

    return {
      id: order.id,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // Name only — email and phone are not shown on the tracking page.
      customer: customer ? { name: customer.name } : customer,
      address: order.address,
      items: order.items,
      subtotalCents: order.subtotalCents,
      taxCents: order.taxCents,
      deliveryFeeCents: order.deliveryFeeCents,
      totalCents: order.totalCents,
      deliveryId: order.deliveryId,
      delivery: order.delivery,
      statusHistory: order.statusHistory,
    };
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('Surrogate-Control', 'no-store')
  @Get(':orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    try {
      const order = await this.ordersService.getOrderById(orderId);
      return this.toPublicTrackingOrder(order);
    } catch (error) {
      this.logger.error(`Error tracking order ${orderId}:`, error);
      throw error;
    }
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('Surrogate-Control', 'no-store')
  @Get('api/track/:orderId')
  async trackOrderApi(@Param('orderId') orderId: string) {
    try {
      const order = await this.ordersService.getOrderById(orderId);
      return this.toPublicTrackingOrder(order);
    } catch (error) {
      this.logger.error(`Error tracking order via API ${orderId}:`, error);
      throw error;
    }
  }
}
