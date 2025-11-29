import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Param, 
  Body, 
  Query,
  NotFoundException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Public order creation endpoint (for customers)
 * Route: /api/:tenantSlug/orders
 */
@Controller(':tenantSlug/orders')
export class OrdersController {
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
    const tenant = await this.tenantsService.getTenantBySlug(tenantSlug);
    return this.ordersService.createOrder(tenant.id, data);
  }
}

/**
 * Admin order management endpoints
 * Route: /api/orders (protected, admin/operator only)
 * SECURITY: These endpoints require authentication and admin/operator role
 * Note: Global JwtAuthGuard applies automatically, RolesGuard enforces role requirements
 */
@Controller('orders')
export class AdminOrdersController {
  constructor(
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  @Public() // TODO: Remove in production - add proper authentication
  @Get()
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
    // Handle YYYY-MM-DD format dates correctly to avoid timezone issues
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;
    
    if (startDate) {
      // If date is in YYYY-MM-DD format, parse it as UTC to avoid timezone shifts
      if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        // Create date at beginning of day in UTC
        parsedStartDate = new Date(`${startDate}T00:00:00.000Z`);
      } else {
        // Fallback for other date formats
        const date = new Date(startDate);
        date.setUTCHours(0, 0, 0, 0);
        parsedStartDate = date;
      }
    }
    
    if (endDate) {
      // If date is in YYYY-MM-DD format, parse it as UTC to avoid timezone shifts
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        // Create date at end of day in UTC (23:59:59.999)
        parsedEndDate = new Date(`${endDate}T23:59:59.999Z`);
      } else {
        // Fallback for other date formats
        const date = new Date(endDate);
        date.setUTCHours(23, 59, 59, 999);
        parsedEndDate = date;
      }
    }
    
    return this.ordersService.getOrders(tenant.id, {
      status,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    });
  }

  @Public() // TODO: Remove in production - add proper authentication
  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Public() // TODO: Remove in production - add proper authentication
  @Patch(':id/status')
  @Roles('ADMIN', 'OPERATOR')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() data: UpdateOrderStatusDto,
  ) {
    await this.orderStatusService.updateStatus(id, data.status);
    return { message: 'Status updated' };
  }

  @Post(':id/sync-storyous')
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
  @Get(':orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    this.logger.log('trackOrder called', { orderId });
    try {
      const order = await this.ordersService.getOrderById(orderId);
      this.logger.debug('Order found', { orderId: order?.id });
      return order;
    } catch (error) {
      this.logger.error('Error getting order', { orderId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}













