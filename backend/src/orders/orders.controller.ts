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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
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
}

// Admin endpoints for managing orders
@Controller('orders')
export class AdminOrdersController {
  private readonly logger = new Logger(AdminOrdersController.name);

  constructor(
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
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
}

// Public tracking endpoint
@Controller('track')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(private ordersService: OrdersService) {}

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @Get(':orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    this.logger.log(`Tracking order: ${orderId}`);
    try {
      const order = await this.ordersService.getOrderById(orderId);
      this.logger.log(`Order found: ${orderId}, status: ${order.status}`);
      return order;
    } catch (error) {
      this.logger.error(`Error tracking order ${orderId}:`, error);
      throw error;
    }
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('api/track/:orderId')
  async trackOrderApi(@Param('orderId') orderId: string) {
    this.logger.log(`API tracking order: ${orderId}`);
    try {
      const order = await this.ordersService.getOrderById(orderId);
      this.logger.log(`Order found via API: ${orderId}, status: ${order.status}`);
      return order;
    } catch (error) {
      this.logger.error(`Error tracking order via API ${orderId}:`, error);
      throw error;
    }
  }
}
