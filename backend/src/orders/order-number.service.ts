import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderNumberService {
  private readonly logger = new Logger(OrderNumberService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generates the next sequential order number for a tenant.
   * Uses an atomic per-tenant counter in the database to ensure thread-safety.
   * Existing tenants are initialized from the current maximum historical order number.
   * 
   * @param tenantId - The tenant ID to generate order number for
   * @returns Promise<number> - The next monotonically increasing order number
   */
  async generateOrderNumber(tenantId: string): Promise<number> {
    return await this.prisma.$transaction(async (tx) => {
      const maxOrder = await tx.order.findFirst({
        where: {
          tenantId,
          orderNumber: {
            not: null,
          },
        },
        orderBy: {
          orderNumber: 'desc',
        },
        select: {
          orderNumber: true,
        },
      });

      const initialOrderNumber = (maxOrder?.orderNumber ?? 0) + 1;
      const counter = await tx.tenantOrderCounter.upsert({
        where: { tenantId },
        create: {
          tenantId,
          lastOrderNumber: initialOrderNumber,
        },
        update: {
          lastOrderNumber: {
            increment: 1,
          },
        },
        select: {
          lastOrderNumber: true,
        },
      });

      this.logger.log(
        `Generated order number ${counter.lastOrderNumber} for tenant ${tenantId}`,
      );

      return counter.lastOrderNumber;
    });
  }
}
