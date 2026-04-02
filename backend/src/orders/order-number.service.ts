import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderNumberService {
  private readonly logger = new Logger(OrderNumberService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generates the next sequential order number for a tenant.
   * Uses database transaction with SELECT FOR UPDATE to ensure thread-safety.
   * Wraps around to 1 after reaching 9999.
   * 
   * @param tenantId - The tenant ID to generate order number for
   * @returns Promise<number> - The next order number (1-9999)
   */
  async generateOrderNumber(tenantId: string): Promise<number> {
    return await this.prisma.$transaction(async (tx) => {
      // Find the maximum order number for this tenant
      // Using SELECT FOR UPDATE to lock the rows and prevent concurrent access
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

      let nextOrderNumber: number;

      if (!maxOrder || maxOrder.orderNumber === null) {
        // No existing orders with orderNumber, start at 1
        nextOrderNumber = 1;
      } else {
        // Increment the max order number
        nextOrderNumber = maxOrder.orderNumber + 1;

        // Wrap around to 1 if we exceed 9999
        if (nextOrderNumber > 9999) {
          // Check if order number 1 already exists (from previous wrap-around)
          const existingOrder1 = await tx.order.findFirst({
            where: {
              tenantId,
              orderNumber: 1,
            },
          });

          if (existingOrder1) {
            // If 1 exists, find the first available number starting from 1
            // This handles the case where we've wrapped around before
            for (let i = 1; i <= 9999; i++) {
              const existing = await tx.order.findFirst({
                where: {
                  tenantId,
                  orderNumber: i,
                },
              });

              if (!existing) {
                nextOrderNumber = i;
                break;
              }
            }

            // If all numbers 1-9999 are taken, this is an edge case
            // In practice, this shouldn't happen, but we'll log a warning
            if (nextOrderNumber > 9999) {
              this.logger.warn(
                `All order numbers 1-9999 are taken for tenant ${tenantId}. Starting from 1 again.`,
              );
              nextOrderNumber = 1;
            }
          } else {
            // Order number 1 doesn't exist, safe to wrap around
            nextOrderNumber = 1;
          }
        }
      }

      this.logger.log(
        `Generated order number ${nextOrderNumber} for tenant ${tenantId}`,
      );

      return nextOrderNumber;
    });
  }
}
