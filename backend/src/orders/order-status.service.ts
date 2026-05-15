import { Injectable, BadRequestException, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Order, CustomerInfo, Address, DeliveryStatus } from '@pizza-ecosystem/shared';
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
  private readonly STORYOUS_RECONCILE_STATUSES: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY,
  ];
  
  // Valid status transitions
  // Active flow: PENDING → PAID → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
  private transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELED],
    [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELED],
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

  private isAcceptedStoryousState(state: string | null | undefined): boolean {
    return state === 'CONFIRMED' || state === 'SCHEDULING_DELIVERY' || state === 'DISPATCHED';
  }

  private shouldAutoSyncToStoryous(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return (
      (currentStatus === OrderStatus.PENDING && newStatus === OrderStatus.PAID) ||
      (currentStatus === OrderStatus.PAID && newStatus === OrderStatus.PREPARING)
    );
  }

  private async maybeAutoSyncToStoryous(
    order: any,
    newStatus: OrderStatus,
    statusSyncSource: 'dashboard' | 'storyous' | 'system',
  ): Promise<void> {
    if (
      statusSyncSource === 'storyous' ||
      !this.shouldAutoSyncToStoryous(order.status as OrderStatus, newStatus)
    ) {
      return;
    }

    if ((order as any).storyousOrderId) {
      return;
    }

    try {
      const storyousSettings = await this.settingsService.getStoryousSettings();

      if (
        !storyousSettings?.enabled ||
        !storyousSettings?.autoSync ||
        !storyousSettings?.merchantId ||
        !storyousSettings?.placeId
      ) {
        return;
      }

      const orderForStoryous: Order = {
        ...order,
        status: newStatus as OrderStatus,
        customer: order.customer as unknown as CustomerInfo,
        address: order.address as unknown as Address,
      } as unknown as Order;

      const storyousResult = await this.storyousService.createOrder(
        orderForStoryous,
        storyousSettings.merchantId,
        storyousSettings.placeId,
      );

      if (!storyousResult?.id) {
        return;
      }

      const storyousState = String(storyousResult.storyousState || '').trim().toUpperCase() || null;
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          storyousOrderId: storyousResult.id,
          storyousOrderState: storyousState,
        },
      });

      if (this.isAcceptedStoryousState(storyousState)) {
        this.logger.log(`✅ Order ${order.id} auto-synced to Storyous: ${storyousResult.id}`, {
          orderId: order.id,
          storyousOrderId: storyousResult.id,
          storyousState,
          statusSyncSource,
        });
      } else {
        this.logger.warn(`⚠️ Order ${order.id} reached Storyous but still requires attention`, {
          orderId: order.id,
          storyousOrderId: storyousResult.id,
          storyousState,
          statusSyncSource,
        });
      }
    } catch (error: any) {
      this.logger.error(`⚠️ Failed to auto-sync order ${order.id} to Storyous:`, {
        orderId: order.id,
        statusSyncSource,
        error: error.message,
      });
    }
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    statusSyncSource: 'dashboard' | 'storyous' | 'system' = 'dashboard',
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        delivery: {
          select: {
            id: true,
            provider: true,
            status: true,
          },
        },
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

    // For Wolt deliveries, DELIVERED can only be set after Wolt confirms it.
    // This prevents false "delivered" status from internal timers/manual clicks.
    if (
      newStatus === OrderStatus.DELIVERED &&
      order.delivery?.provider === 'wolt' &&
      order.delivery.status !== DeliveryStatus.DELIVERED
    ) {
      throw new BadRequestException(
        `Cannot transition Wolt order to ${newStatus} before Wolt confirms delivery`
      );
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
        },
      }),
    ]);

    await this.maybeAutoSyncToStoryous(order, newStatus, statusSyncSource);

    // Update Storyous order status (if order was sent to Storyous).
    // Use global settings gate to avoid stale tenant.theme flags.
    try {
      const storyousOrderId = (order as any).storyousOrderId as string | null;
      const storyousSettings = await this.settingsService.getStoryousSettings();

      if (
        statusSyncSource !== 'storyous' &&
        storyousOrderId &&
        storyousSettings?.enabled
      ) {
        await this.storyousService.updateOrderStatus(storyousOrderId, newStatus);
        this.logger.log(`✅ Order ${orderId} status updated in Storyous`, {
          orderId,
          storyousOrderId,
          status: newStatus,
          statusSyncSource,
        });
      }
    } catch (error: any) {
      this.logger.error(`⚠️ Failed to update Storyous order status:`, {
        orderId,
        status: newStatus,
        statusSyncSource,
        error: error.message,
      });
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
    this.logger.log('🚀 Starting order background status workers...');
    this.autoDeliveredInterval = setInterval(
      () => this.runBackgroundStatusWorkers(),
      this.CHECK_INTERVAL_MS,
    );
  }

  async onModuleDestroy() {
    // Clean up interval on shutdown
    if (this.autoDeliveredInterval) {
      clearInterval(this.autoDeliveredInterval);
      this.autoDeliveredInterval = null;
      this.logger.log('🛑 Stopped order background status workers');
    }
  }

  private async runBackgroundStatusWorkers(): Promise<void> {
    await this.checkAndAutoDeliver();
    await this.checkAndReconcileStoryousStatuses();
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
          OR: [
            { deliveryId: null },
            {
              delivery: {
                is: {
                  provider: {
                    not: 'wolt',
                  },
                },
              },
            },
          ],
        },
        include: {
          delivery: {
            select: {
              provider: true,
              status: true,
            },
          },
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
            await this.updateStatus(order.id, OrderStatus.DELIVERED, 'system');
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

  private mapStoryousStateToOrderStatus(
    state: string | null | undefined,
  ): OrderStatus | null {
    const normalized = String(state || '').trim().toUpperCase();
    if (normalized === 'DISPATCHED') {
      return OrderStatus.OUT_FOR_DELIVERY;
    }
    if (normalized === 'DELIVERED') {
      return OrderStatus.DELIVERED;
    }
    if (normalized === 'DECLINED' || normalized === 'CANCELED' || normalized === 'CANCELLED') {
      return OrderStatus.CANCELED;
    }
    return null;
  }

  private async checkAndReconcileStoryousStatuses(): Promise<void> {
    try {
      const storyousSettings = await this.settingsService.getStoryousSettings();
      if (!storyousSettings?.enabled || !storyousSettings?.merchantId || !storyousSettings?.placeId) {
        return;
      }

      const trackedOrders = await this.prisma.order.findMany({
        where: {
          storyousOrderId: { not: null },
          status: { in: this.STORYOUS_RECONCILE_STATUSES },
          OR: [
            { deliveryId: null },
            {
              delivery: {
                is: {
                  provider: { not: 'wolt' },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          status: true,
          storyousOrderId: true,
        },
      });

      for (const trackedOrder of trackedOrders) {
        try {
          const remoteState = await this.storyousService.getOrderState(
            trackedOrder.storyousOrderId as string,
            storyousSettings.merchantId,
            storyousSettings.placeId,
          );
          const mappedStatus = this.mapStoryousStateToOrderStatus(remoteState);

          if (!mappedStatus || mappedStatus === trackedOrder.status) {
            continue;
          }

          const allowedTransitions = this.transitions[trackedOrder.status as OrderStatus] || [];
          if (!allowedTransitions.includes(mappedStatus)) {
            this.logger.warn('Skipping Storyous reconcile due to invalid transition', {
              orderId: trackedOrder.id,
              from: trackedOrder.status,
              to: mappedStatus,
              storyousState: remoteState,
              statusSyncSource: 'storyous',
            });
            continue;
          }

          await this.updateStatus(trackedOrder.id, mappedStatus, 'storyous');
          this.logger.log('✅ Reconciled order status from Storyous', {
            orderId: trackedOrder.id,
            from: trackedOrder.status,
            to: mappedStatus,
            storyousState: remoteState,
            statusSyncSource: 'storyous',
          });
        } catch (error: any) {
          this.logger.warn('⚠️ Storyous reconcile failed for order', {
            orderId: trackedOrder.id,
            storyousOrderId: trackedOrder.storyousOrderId,
            error: error?.message || String(error),
          });
        }
      }
    } catch (error: any) {
      this.logger.error('⚠️ Error in Storyous reconcile worker:', error.message);
    }
  }
}






