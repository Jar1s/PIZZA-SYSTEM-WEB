import { Injectable, BadRequestException, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Order, CustomerInfo, Address } from '@pizza-ecosystem/shared';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { StoryousService } from '../storyous/storyous.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrderStatusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderStatusService.name);
  private autoDeliveredInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_DELIVERED_DELAY_MINUTES = 30; // Auto-deliver after 30 minutes
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute
  
  // Valid status transitions
  // Note: READY status is kept for backward compatibility but not used in new flow
  // New flow: PENDING → PAID → PREPARING → OUT_FOR_DELIVERY → DELIVERED
  private transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELED],
    [OrderStatus.PREPARING]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELED], // Skip READY
    [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELED], // Backward compatibility only
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELED]: [],
  };

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private tenantsService: TenantsService,
    private storyousService: StoryousService,
    private settingsService: SettingsService,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) {}

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            subdomain: true,
            slug: true,
            emailConfig: true,
          },
        },
      },
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

    // Auto-sync to Storyous when order is confirmed (PREPARING) and autoSync is enabled
    // This runs ONLY ONCE when status changes to PREPARING, not on subsequent status changes
    if (newStatus === OrderStatus.PREPARING && !(order as any).storyousOrderId) {
      try {
        // Get global Storyous settings
        const storyousSettings = await this.settingsService.getStoryousSettings();
        
        if (storyousSettings?.enabled && storyousSettings?.autoSync && storyousSettings?.merchantId && storyousSettings?.placeId) {
          // Convert Prisma Order to shared Order type
          const orderForStoryous: Order = {
            ...order,
            status: newStatus as OrderStatus,
            customer: order.customer as unknown as CustomerInfo,
            address: order.address as unknown as Address,
          } as unknown as Order;
          
          const storyousResult = await this.storyousService.createOrder(
            orderForStoryous,
            storyousSettings.merchantId,
            storyousSettings.placeId
          );
          
          if (storyousResult?.id) {
            await this.prisma.order.update({
              where: { id: orderId },
              data: { storyousOrderId: storyousResult.id },
            });
            this.logger.log(`✅ Order ${orderId} auto-synced to Storyous: ${storyousResult.id}`);
          }
        }
      } catch (error: any) {
        // Log but don't fail status update
        this.logger.error(`⚠️ Failed to auto-sync order ${orderId} to Storyous:`, error.message);
      }
    }

    // Update Storyous order status (if order was sent to Storyous)
    try {
      const storyousOrderId = (order as any).storyousOrderId;
      const tenant = order.tenant;
      const storyousConfig = (tenant as any).storyousConfig as any;
      
      if (storyousOrderId && storyousConfig?.enabled) {
        await this.storyousService.updateOrderStatus(storyousOrderId, newStatus);
        this.logger.log(`✅ Order ${orderId} status updated in Storyous`);
      }
    } catch (error: any) {
      // Log but don't fail status update
      this.logger.error(`⚠️ Failed to update Storyous order status:`, error.message);
    }

    // If order is being canceled and was paid via GoPay, initiate refund
    if (newStatus === OrderStatus.CANCELED) {
      const tenant = order.tenant as any;
      const paymentProvider = tenant.paymentProvider;
      const paymentRef = (order as any).paymentRef;
      const paymentStatus = String((order as any).paymentStatus || '').toLowerCase();
      
      // Auto-refund for paid GoPay orders on admin cancellation/rejection.
      // We intentionally do not gate by order.status here, because payment webhooks can arrive
      // slightly before/after manual status actions.
      if (paymentProvider === 'gopay' && 
          paymentRef && 
          paymentStatus === 'success') {
        try {
          await this.paymentsService.refundGopayPayment(orderId);
          this.logger.log(`✅ GoPay refund initiated for order ${orderId}`);
        } catch (error: any) {
          // Log but don't fail status update - refund can be retried manually
          this.logger.error(`⚠️ Failed to refund GoPay payment for order ${orderId}:`, error.message);
        }
      }
    }

    // Send notifications (email, SMS) when status changes
    await this.sendStatusNotifications(order as any, newStatus);
  }

  private async sendStatusNotifications(order: any, newStatus: OrderStatus): Promise<void> {
    const tenant = order.tenant;
    const tenantDomain = tenant.domain || `${tenant.subdomain}.localhost:3001`;

    try {
      // Use EmailService to send status update email
      await this.emailService.sendOrderStatusUpdate(
        order,
        newStatus,
        tenant.name,
        tenantDomain,
        tenant.emailConfig,
      );
    } catch (error) {
      this.logger.error(`Failed to send status notifications for order ${order.id}:`, error);
      // Don't throw - notification failure shouldn't break status update
    }
  }

  canTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return this.transitions[currentStatus]?.includes(newStatus) || false;
  }

  async onModuleInit() {
    // Start automatic DELIVERED status check
    this.logger.log('🚀 Starting automatic DELIVERED status checker...');
    this.autoDeliveredInterval = setInterval(
      () => this.checkAndAutoDeliver(),
      this.CHECK_INTERVAL_MS,
    );
  }

  async onModuleDestroy() {
    // Clean up interval on shutdown
    if (this.autoDeliveredInterval) {
      clearInterval(this.autoDeliveredInterval);
      this.autoDeliveredInterval = null;
      this.logger.log('🛑 Stopped automatic DELIVERED status checker');
    }
  }

  /**
   * Automatically set orders to DELIVERED if they've been OUT_FOR_DELIVERY for more than 30 minutes
   * This is a fallback in case Wolt webhook doesn't fire or for non-Wolt deliveries
   */
  private async checkAndAutoDeliver(): Promise<void> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - this.AUTO_DELIVERED_DELAY_MINUTES);

      // Find orders that have been OUT_FOR_DELIVERY for more than 30 minutes
      const ordersToDeliver = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.OUT_FOR_DELIVERY,
          updatedAt: {
            lte: cutoffTime,
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
              subdomain: true,
              slug: true,
              emailConfig: true,
            },
          },
        },
      });

      if (ordersToDeliver.length > 0) {
        this.logger.log(`📦 Found ${ordersToDeliver.length} order(s) to auto-deliver`);

        for (const order of ordersToDeliver) {
          try {
            // Use updateStatus to ensure proper transitions and notifications
            await this.updateStatus(order.id, OrderStatus.DELIVERED);
            this.logger.log(`✅ Auto-delivered order ${order.id.slice(0, 8)}`);
          } catch (error: any) {
            // Log but don't throw - continue with other orders
            this.logger.error(
              `⚠️ Failed to auto-deliver order ${order.id}:`,
              error.message,
            );
          }
        }
      }
    } catch (error: any) {
      // Log but don't throw - this is a background task
      this.logger.error('⚠️ Error in auto-deliver check:', error.message);
    }
  }
}












