import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Param, 
  Body, 
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatusService } from './order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { OrderStatus } from '@pizza-ecosystem/shared';

@Controller('api/:tenantSlug/orders')
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
}

// Public tracking endpoint
@Controller('api/track')
export class TrackingController {
  constructor(private ordersService: OrdersService) {}

  @Get(':orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }
}








