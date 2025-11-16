import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { CreateOrderDto } from './dto';
import { EmailService } from '../email/email.service';
import { StoryousService } from '../storyous/storyous.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private storyousService: StoryousService,
  ) {}

  async createOrder(tenantId: string, data: CreateOrderDto): Promise<Order> {
    // Validate products exist
    const productIds = data.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        isActive: true,
      },
    });
    
    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found or inactive');
    }

    // Calculate totals
    let subtotalCents = 0;
    const items = data.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      
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
        customer: data.customer as any,
        address: data.address as any,
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
        tenant: true,
      },
    });

    // Send order confirmation email
    const tenant = order.tenant;
    const tenantDomain = tenant.domain || `${tenant.subdomain}.localhost:3001`;
    await this.emailService.sendOrderConfirmation(
      order as any,
      tenant.name,
      tenantDomain,
    );

    // Send order to Storyous immediately (if enabled)
    try {
      const storyousConfig = (tenant as any).storyousConfig as any;
      
      if (storyousConfig?.enabled && storyousConfig?.merchantId && storyousConfig?.placeId) {
        const storyousResult = await this.storyousService.createOrder(
          order as any,
          storyousConfig.merchantId,
          storyousConfig.placeId
        );
        
        // Save Storyous order ID
        if (storyousResult?.id) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { storyousOrderId: storyousResult.id },
          });
          this.logger.log(`✅ Order ${order.id} synchronized to Storyous: ${storyousResult.id}`);
        }
      }
    } catch (error: any) {
      // Log but don't fail order creation
      this.logger.error(`⚠️ Failed to sync order ${order.id} to Storyous:`, error.message);
    }

    return order as any as Order;
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

    return order as any as Order;
  }

  async getOrders(tenantId: string, filters?: {
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Order[]> {
    // Build createdAt filter properly - combine both bounds if both are provided
    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (filters?.startDate) {
      createdAtFilter.gte = filters.startDate;
    }
    if (filters?.endDate) {
      createdAtFilter.lte = filters.endDate;
    }

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(Object.keys(createdAtFilter).length > 0 && { createdAt: createdAtFilter }),
      },
      include: {
        items: true,
        delivery: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return orders as any as Order[];
  }

  async syncOrderToStoryous(orderId: string): Promise<{ success: boolean; storyousOrderId?: string; message: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Check if already synced
    if ((order as any).storyousOrderId) {
      return {
        success: true,
        storyousOrderId: (order as any).storyousOrderId,
        message: 'Order already synced to Storyous',
      };
    }

    try {
      const tenant = order.tenant;
      const storyousConfig = (tenant as any).storyousConfig as any;
      
      if (!storyousConfig?.enabled || !storyousConfig?.merchantId || !storyousConfig?.placeId) {
        return {
          success: false,
          message: 'Storyous is not configured for this tenant',
        };
      }

      const storyousResult = await this.storyousService.createOrder(
        order as any,
        storyousConfig.merchantId,
        storyousConfig.placeId
      );
      
      if (storyousResult?.id) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { storyousOrderId: storyousResult.id },
        });
        this.logger.log(`✅ Order ${orderId} manually synced to Storyous: ${storyousResult.id}`);
        return {
          success: true,
          storyousOrderId: storyousResult.id,
          message: 'Order synced to Storyous successfully',
        };
      }

      return {
        success: false,
        message: 'Storyous API did not return order ID',
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to sync order ${orderId} to Storyous:`, error.message);
      return {
        success: false,
        message: error.message || 'Failed to sync order to Storyous',
      };
    }
  }

  async updatePaymentRef(orderId: string, paymentRef: string, paymentStatus: string): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentRef,
        paymentStatus,
      },
      include: {
        items: true,
      },
    });
    return order as any as Order;
  }

  async updateDeliveryRef(orderId: string, deliveryId: string): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryId },
      include: {
        items: true,
      },
    });
    return order as any as Order;
  }

  async getOrderByPaymentRef(paymentRef: string): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef },
      include: {
        items: true,
      },
    });

    return order ? (order as any as Order) : null;
  }
}


