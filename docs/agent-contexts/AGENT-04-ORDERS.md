# 🎯 AGENT 4: ORDERS MODULE

You are Agent 4 building the core order management system with status transitions.

## PROJECT CONTEXT
Orders are the central entity. They connect products, payments, and delivery. Must handle state machine carefully.

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/orders/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Order creation (cart → order)
2. Status state machine (pending → delivered)
3. Order history & retrieval
4. Total calculation with tax
5. Webhook endpoints for payments/delivery status updates

## ORDER STATUS FLOW
```
PENDING → PAID → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
   ↓
CANCELED (can happen from any status)
```

## FILES TO CREATE

### 1. `/backend/src/orders/orders.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderStatusService } from './order-status.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, TenantsModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStatusService],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}
```

### 2. `/backend/src/orders/orders.service.ts`
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  async createOrder(tenantId: string, data: CreateOrderDto): Promise<Order> {
    // Validate products exist
    const productIds = data.items.map(item => item.productId);
    const products = await this.productsService.getProductsByIds(productIds);
    
    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found');
    }

    // Calculate totals
    let subtotalCents = 0;
    const items = data.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const basePrice = product.priceCents;
      
      // Add modifier prices
      let modifierPrice = 0;
      if (item.modifiers) {
        // Calculate modifier costs from product.modifiers
        // This is simplified - you'd need to traverse the modifier structure
        modifierPrice = 0; // TODO: Implement modifier price calculation
      }
      
      const itemPrice = (basePrice + modifierPrice) * item.quantity;
      subtotalCents += itemPrice;
      
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        priceCents: basePrice + modifierPrice,
        modifiers: item.modifiers,
      };
    });

    const taxCents = Math.round(subtotalCents * 0.20); // 20% VAT
    const deliveryFeeCents = data.deliveryFeeCents || 0;
    const totalCents = subtotalCents + taxCents + deliveryFeeCents;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        status: OrderStatus.PENDING,
        customer: data.customer,
        address: data.address,
        subtotalCents,
        taxCents,
        deliveryFeeCents,
        totalCents,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    return order as Order;
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order as Order;
  }

  async getOrders(tenantId: string, filters?: {
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && {
          createdAt: { gte: filters.startDate },
        }),
        ...(filters?.endDate && {
          createdAt: { lte: filters.endDate },
        }),
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<Order[]>;
  }

  async updatePaymentRef(orderId: string, paymentRef: string, paymentStatus: string): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentRef,
        paymentStatus,
      },
      include: {
        items: true,
      },
    }) as Promise<Order>;
  }

  async updateDeliveryRef(orderId: string, deliveryId: string): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryId },
      include: {
        items: true,
      },
    }) as Promise<Order>;
  }

  async getOrderByPaymentRef(paymentRef: string): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef },
      include: {
        items: true,
      },
    });

    return order as Order | null;
  }
}
```

### 3. `/backend/src/orders/order-status.service.ts`
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@pizza-ecosystem/shared';

@Injectable()
export class OrderStatusService {
  // Valid status transitions
  private transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELED],
    [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELED]: [],
  };

  constructor(private prisma: PrismaService) {}

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Check if transition is valid
    const allowedTransitions = this.transitions[order.status as OrderStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}`
      );
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // TODO: Send notifications (email, SMS) when status changes
  }

  canTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return this.transitions[currentStatus]?.includes(newStatus) || false;
  }
}
```

### 4. `/backend/src/orders/orders.controller.ts`
```typescript
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
```

### 5. `/backend/src/orders/dto/create-order.dto.ts`
```typescript
import { IsString, IsEmail, IsNumber, IsArray, ValidateNested, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerInfoDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;
}

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsObject()
  modifiers?: Record<string, any>;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsNumber()
  deliveryFeeCents?: number;
}
```

### 6. `/backend/src/orders/dto/update-order-status.dto.ts`
```typescript
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@pizza-ecosystem/shared';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
```

### 7. `/backend/src/orders/dto/index.ts`
```typescript
export * from './create-order.dto';
export * from './update-order-status.dto';
```

## DELIVERABLES CHECKLIST
- [ ] Order creation endpoint
- [ ] Order retrieval (by ID, by tenant)
- [ ] Status state machine with validation
- [ ] Order history with filters
- [ ] Public tracking endpoint
- [ ] DTOs with validation
- [ ] Test order flow

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 2 (database + tenants)
- ✅ Agent 3 (products - for validation)

## WHO NEEDS YOUR OUTPUT
- Agent 5 (Payments - updates order after payment)
- Agent 6 (Frontend - creates orders)
- Agent 7 (Delivery - updates status)
- Agent 8 (Dashboard - displays orders)
- Agent 9 (Tracking - shows order status)

## WHEN TO START
⏳ **WAIT for Agent 2 and 3** to complete

## TEST YOUR WORK
```bash
# Create an order
curl -X POST http://localhost:3000/api/pornopizza/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+421900123456"
    },
    "address": {
      "street": "Main St 123",
      "city": "Bratislava",
      "postalCode": "81101",
      "country": "SK"
    },
    "items": [
      {
        "productId": "product_id_here",
        "quantity": 2
      }
    ]
  }'

# Get orders
curl http://localhost:3000/api/pornopizza/orders

# Update status
curl -X PATCH http://localhost:3000/api/pornopizza/orders/{orderId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'

# Track order (public)
curl http://localhost:3000/api/track/{orderId}
```

## COMPLETION SIGNAL
Create `/backend/src/orders/AGENT-4-COMPLETE.md`:
```markdown
# Agent 4 Complete ✅

## What I Built
- Order creation with total calculation
- Status state machine (prevents invalid transitions)
- Order history with filters
- Public tracking endpoint

## API Endpoints
- POST /api/:tenantSlug/orders → Create order
- GET /api/:tenantSlug/orders → List orders (with filters)
- GET /api/:tenantSlug/orders/:id → Get order
- PATCH /api/:tenantSlug/orders/:id/status → Update status
- GET /api/track/:orderId → Public tracking

## Status Flow
PENDING → PAID → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
(CANCELED can happen from any status)

## Next Agents Can Start
✅ Agent 5 (Payments), 6 (Frontend), 7 (Delivery), 8 (Dashboard), 9 (Tracking)
```

BEGIN when Agent 2 and 3 signal complete!


