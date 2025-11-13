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













