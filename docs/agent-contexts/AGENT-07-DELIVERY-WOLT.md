# 🎯 AGENT 7: DELIVERY INTEGRATION (Wolt Drive)

You are Agent 7 integrating Wolt Drive API for automated courier dispatch.

## PROJECT CONTEXT
After payment success, automatically create Wolt delivery job. Handle webhooks for courier status updates (assigned, picked up, delivered).

## YOUR WORKSPACE
`/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/delivery/`

**CRITICAL:** Only create files in this folder.

## YOUR MISSION
1. Quote endpoint (get ETA + fee before order)
2. Create delivery job after payment
3. Webhook handler for courier updates
4. Status sync: courier events → order status
5. Tracking URL generation

## WOLT DRIVE API FLOW
```
1. GET /quote → Get delivery estimate
2. POST /deliveries → Create delivery job
3. Webhook → courier_assigned
4. Webhook → picked_up
5. Webhook → delivered
```

## FILES TO CREATE

### 1. `/backend/src/delivery/delivery.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { WoltDriveService } from './wolt-drive.service';
import { DeliveryController } from './delivery.controller';
import { WebhooksController } from './webhooks.controller';
import { OrdersModule } from '../orders/orders.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrdersModule, TenantsModule],
  controllers: [DeliveryController, WebhooksController],
  providers: [DeliveryService, WoltDriveService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
```

### 2. `/backend/src/delivery/wolt-drive.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { Address } from '@pizza-ecosystem/shared';

interface WoltLocation {
  lat: number;
  lon: number;
}

interface WoltQuoteRequest {
  pickup: {
    location: WoltLocation;
    comment?: string;
  };
  dropoff: {
    location: WoltLocation;
    comment?: string;
    contact: {
      name: string;
      phone: string;
    };
  };
}

@Injectable()
export class WoltDriveService {
  private apiUrl = 'https://daas-public-api.wolt.com/merchants/v1/deliveries';
  
  async getQuote(
    apiKey: string,
    pickupAddress: Address,
    dropoffAddress: Address,
  ) {
    const request: WoltQuoteRequest = {
      pickup: {
        location: {
          lat: pickupAddress.coordinates?.lat || 0,
          lon: pickupAddress.coordinates?.lng || 0,
        },
        comment: 'Kitchen entrance',
      },
      dropoff: {
        location: {
          lat: dropoffAddress.coordinates?.lat || 0,
          lon: dropoffAddress.coordinates?.lng || 0,
        },
        comment: dropoffAddress.instructions || '',
        contact: {
          name: 'Customer', // Will be replaced with actual customer name
          phone: '+421900000000', // Will be replaced
        },
      },
    };

    const response = await fetch(`${this.apiUrl}/quote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Wolt API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      feeCents: data.fee.amount, // Wolt returns in cents
      etaMinutes: data.dropoff_eta,
      distance: data.distance,
      currency: data.fee.currency,
    };
  }

  async createDelivery(
    apiKey: string,
    orderId: string,
    pickupAddress: Address,
    dropoffAddress: Address,
    customerName: string,
    customerPhone: string,
  ) {
    const request = {
      pickup: {
        location: {
          lat: pickupAddress.coordinates?.lat || 0,
          lon: pickupAddress.coordinates?.lng || 0,
        },
        address: `${pickupAddress.street}, ${pickupAddress.city}`,
        comment: 'Kitchen entrance - call on arrival',
        contact: {
          name: 'Kitchen Staff',
          phone: process.env.KITCHEN_PHONE || '+421900000000',
        },
      },
      dropoff: {
        location: {
          lat: dropoffAddress.coordinates?.lat || 0,
          lon: dropoffAddress.coordinates?.lng || 0,
        },
        address: `${dropoffAddress.street}, ${dropoffAddress.city}, ${dropoffAddress.postalCode}`,
        comment: dropoffAddress.instructions || '',
        contact: {
          name: customerName,
          phone: customerPhone,
        },
      },
      merchant_order_reference: orderId,
      contents: {
        description: 'Pizza delivery',
        count: 1,
      },
    };

    const response = await fetch(`${this.apiUrl}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Wolt API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      jobId: data.id,
      trackingUrl: data.tracking.url,
      status: data.status,
      courierEta: data.dropoff_eta,
    };
  }

  async cancelDelivery(apiKey: string, jobId: string) {
    const response = await fetch(`${this.apiUrl}/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Wolt API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### 3. `/backend/src/delivery/delivery.service.ts`
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WoltDriveService } from './wolt-drive.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { OrderStatus, DeliveryStatus } from '@pizza-ecosystem/shared';

@Injectable()
export class DeliveryService {
  // This should be your kitchen location
  private readonly KITCHEN_ADDRESS = {
    street: 'Kitchen Street 1',
    city: 'Bratislava',
    postalCode: '81101',
    country: 'SK',
    coordinates: {
      lat: 48.1486, // Replace with actual kitchen coordinates
      lng: 17.1077,
    },
  };

  constructor(
    private prisma: PrismaService,
    private woltDrive: WoltDriveService,
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  async getQuote(tenantId: string, dropoffAddress: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const woltConfig = tenant.deliveryConfig as any;
    
    return this.woltDrive.getQuote(
      woltConfig.apiKey,
      this.KITCHEN_ADDRESS,
      dropoffAddress,
    );
  }

  async createDeliveryForOrder(orderId: string) {
    const order = await this.ordersService.getOrderById(orderId);
    
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before creating delivery');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: order.tenantId },
    });

    const woltConfig = tenant.deliveryConfig as any;
    const customer = order.customer as any;
    const address = order.address as any;

    // Create Wolt delivery
    const woltDelivery = await this.woltDrive.createDelivery(
      woltConfig.apiKey,
      order.id,
      this.KITCHEN_ADDRESS,
      address,
      customer.name,
      customer.phone,
    );

    // Save delivery record
    const delivery = await this.prisma.delivery.create({
      data: {
        tenantId: order.tenantId,
        provider: 'wolt',
        jobId: woltDelivery.jobId,
        status: DeliveryStatus.PENDING,
        trackingUrl: woltDelivery.trackingUrl,
        quote: {
          courierEta: woltDelivery.courierEta,
        },
      },
    });

    // Link delivery to order
    await this.ordersService.updateDeliveryRef(order.id, delivery.id);
    
    // Update order status to PREPARING
    await this.orderStatusService.updateStatus(order.id, OrderStatus.PREPARING);

    return delivery;
  }

  async handleWoltWebhook(webhookData: any) {
    const { delivery_id, status, courier } = webhookData;

    const delivery = await this.prisma.delivery.findFirst({
      where: { jobId: delivery_id },
      include: { orders: true },
    });

    if (!delivery) {
      console.error('Delivery not found for Wolt job:', delivery_id);
      return;
    }

    // Update delivery status
    let newDeliveryStatus: DeliveryStatus;
    let newOrderStatus: OrderStatus | null = null;

    switch (status) {
      case 'courier_assigned':
        newDeliveryStatus = DeliveryStatus.COURIER_ASSIGNED;
        break;
      case 'picked_up':
        newDeliveryStatus = DeliveryStatus.PICKED_UP;
        newOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
        break;
      case 'delivered':
        newDeliveryStatus = DeliveryStatus.DELIVERED;
        newOrderStatus = OrderStatus.DELIVERED;
        break;
      case 'failed':
      case 'cancelled':
        newDeliveryStatus = DeliveryStatus.FAILED;
        break;
      default:
        newDeliveryStatus = DeliveryStatus.IN_TRANSIT;
    }

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: newDeliveryStatus },
    });

    // Update order status if needed
    if (newOrderStatus && delivery.orders.length > 0) {
      for (const order of delivery.orders) {
        await this.orderStatusService.updateStatus(order.id, newOrderStatus);
      }
    }
  }
}
```

### 4. `/backend/src/delivery/delivery.controller.ts`
```typescript
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('api/delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('quote')
  async getQuote(@Body() data: { tenantId: string; dropoffAddress: any }) {
    return this.deliveryService.getQuote(data.tenantId, data.dropoffAddress);
  }

  @Post('create')
  async createDelivery(@Body() data: { orderId: string }) {
    return this.deliveryService.createDeliveryForOrder(data.orderId);
  }
}
```

### 5. `/backend/src/delivery/webhooks.controller.ts`
```typescript
import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { DeliveryService } from './delivery.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('wolt')
  async handleWoltWebhook(
    @Body() body: any,
    @Headers('x-wolt-signature') signature: string,
    @Res() res: Response,
  ) {
    // TODO: Verify Wolt webhook signature
    // For now, accept all webhooks in development
    
    try {
      await this.deliveryService.handleWoltWebhook(body);
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Wolt webhook error:', error);
      return res.status(500).send('Error processing webhook');
    }
  }
}
```

### 6. Update Payment Service to Trigger Delivery

Add to `/backend/src/payments/payments.service.ts`:
```typescript
// After payment success, trigger delivery creation
import { DeliveryService } from '../delivery/delivery.service';

// In constructor, inject DeliveryService

// In handleAdyenWebhook, after status update to PAID:
if (parsed.success && parsed.eventType === 'AUTHORISATION') {
  await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
  await this.orderStatusService.updateStatus(order.id, OrderStatus.PAID);
  
  // 🚀 CREATE DELIVERY
  try {
    await this.deliveryService.createDeliveryForOrder(order.id);
  } catch (error) {
    console.error('Failed to create delivery:', error);
    // Don't fail the payment, admin can manually dispatch
  }
}
```

## DELIVERABLES CHECKLIST
- [ ] Quote endpoint (ETA + fee)
- [ ] Create delivery job
- [ ] Webhook handler for courier events
- [ ] Status sync (courier → order)
- [ ] Tracking URL in order response
- [ ] Integration with payment success

## DEPENDENCIES
- ✅ Agent 1 (shared types)
- ✅ Agent 2 (database)
- ✅ Agent 4 (orders)
- ✅ Agent 5 (payments - triggers delivery)

## WHEN TO START
⏳ **WAIT for Agent 4 and 5** to complete

## SETUP COMMANDS
```bash
cd backend
# No special packages needed, using fetch API
```

## WOLT DRIVE SETUP
1. Register for Wolt Drive: https://drive.wolt.com/
2. Get API key from Wolt Drive dashboard
3. Configure webhook URL: https://your-domain.com/api/webhooks/wolt
4. Test with Wolt sandbox environment

## TEST YOUR WORK
```bash
# Get quote
curl -X POST http://localhost:3000/api/delivery/quote \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_id",
    "dropoffAddress": {
      "street": "Test St 1",
      "city": "Bratislava",
      "postalCode": "81101",
      "country": "SK",
      "coordinates": { "lat": 48.15, "lng": 17.11 }
    }
  }'

# Create delivery (after payment success)
curl -X POST http://localhost:3000/api/delivery/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_id"}'
```

## COMPLETION SIGNAL
Create `/backend/src/delivery/AGENT-7-COMPLETE.md`:
```markdown
# Agent 7 Complete ✅

## What I Built
- Wolt Drive quote endpoint
- Automatic delivery creation after payment
- Webhook handler for courier updates
- Status synchronization (courier events → order status)
- Tracking URL generation

## API Endpoints
- POST /api/delivery/quote → Get delivery estimate
- POST /api/delivery/create → Create delivery job
- POST /api/webhooks/wolt → Wolt webhook (internal)

## Wolt Drive Integration
- Quote: Get ETA and fee before checkout
- Create: Automatically dispatch courier after payment
- Webhooks: courier_assigned, picked_up, delivered
- Tracking URL: Provided in order response

## Environment Variables
Add to backend/.env:
- WOLT_API_KEY_PORNOPIZZA=your_key
- WOLT_API_KEY_PIZZAVNUDZI=your_key
- KITCHEN_PHONE=+421900000000

## Next Agents Can Use
✅ Agent 8 (Dashboard can show delivery status)
✅ Agent 9 (Tracking page can show courier location)
```

BEGIN when Agent 4 and 5 signal complete!


