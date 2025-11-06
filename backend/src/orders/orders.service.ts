import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { CreateOrderDto } from './dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
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
    const orders = await this.prisma.order.findMany({
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
    });
    return orders as any as Order[];
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


