import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Param, 
  Body, 
  Query,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@pizza-ecosystem/shared';

@Controller(':tenantSlug/orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  @Post()
  async createOrder(
    @Param('tenantSlug') tenantSlug: string,
    @Body() data: CreateOrderDto,
  ) {
    // Skip reserved paths that should be handled by other controllers
    // IMPORTANT: Order matters - check specific paths first, then generic ones
    const reservedPaths = ['tenants', 'track', 'customer', 'customers', 'my-account', 'account', 'me', 'user', 'users', 'auth', 'payments', 'delivery', 'webhooks', 'analytics'];
    if (reservedPaths.includes(tenantSlug.toLowerCase())) {
      throw new NotFoundException(`Route not found`);
    }
    
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.ordersService.createOrder(tenant.id, data);
  }

  @Get()
  async getOrders(
    @Param('tenantSlug') tenantSlug: string,
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Skip reserved paths that should be handled by other controllers
    // IMPORTANT: Order matters - check specific paths first, then generic ones
    const reservedPaths = ['tenants', 'track', 'customer', 'customers', 'my-account', 'account', 'me', 'user', 'users', 'auth', 'payments', 'delivery', 'webhooks', 'analytics'];
    if (reservedPaths.includes(tenantSlug.toLowerCase())) {
      throw new NotFoundException(`Route not found`);
    }
    
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.ordersService.getOrders(tenant.id, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() data: UpdateOrderStatusDto,
  ) {
    await this.orderStatusService.updateStatus(id, data.status);
    return { message: 'Status updated' };
  }

  @Post(':id/sync-storyous')
  async syncToStoryous(
    @Param('tenantSlug') tenantSlug: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.syncOrderToStoryous(id);
  }
}

// Public tracking endpoint
@Controller('track')
export class TrackingController {
  constructor(private ordersService: OrdersService) {}

  @Get(':orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    console.log('[TrackingController] trackOrder called with orderId:', orderId);
    try {
      const order = await this.ordersService.getOrderById(orderId);
      console.log('[TrackingController] Order found:', order?.id);
      return order;
    } catch (error) {
      console.error('[TrackingController] Error getting order:', error);
      throw error;
    }
  }
}













