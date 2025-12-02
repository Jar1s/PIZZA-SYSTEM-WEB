import { Injectable, BadRequestException, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { StoryousService } from '../storyous/storyous.service';

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
  ) {}

  async updateStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: true,
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

    // Send notifications (email, SMS) when status changes
    await this.sendStatusNotifications(order as any, newStatus);
  }

  private async sendStatusNotifications(order: any, newStatus: OrderStatus): Promise<void> {
    const customer = order.customer as any;
    const tenant = order.tenant;
    const tenantDomain = tenant.domain || `${tenant.subdomain}.localhost:3001`;
    const trackingUrl = `http://${tenantDomain}/order/${order.id}`;
    const orderNumber = order.id.slice(0, 8).toUpperCase();

    try {
      // Email notification - len pre statusy kde chceme posielať email
      // PAID a PENDING sa neposielajú (PENDING má confirmation email pri vytvorení objednávky)
      const statusMessages: Partial<Record<OrderStatus, { subject: string; message: string }>> = {
        [OrderStatus.PREPARING]: {
          subject: `👨‍🍳 Objednávka #${orderNumber} je v príprave`,
          message: `Skvelá správa! Vaša objednávka sa teraz pripravuje v našej kuchyni.`,
        },
        [OrderStatus.READY]: {
          subject: `🍕 Objednávka #${orderNumber} je pripravená!`,
          message: `Vaša objednávka je pripravená! Čoskoro bude doručená.`,
        },
        [OrderStatus.OUT_FOR_DELIVERY]: {
          subject: `🚗 Objednávka #${orderNumber} odovzdaná kuriérovi`,
          message: `Vaša objednávka je na ceste! Sledujte doručenie: ${trackingUrl}`,
        },
        [OrderStatus.DELIVERED]: {
          subject: `✅ Objednávka #${orderNumber} doručená`,
          message: `Vaša objednávka bola doručená! Dobrú chuť! 🍕`,
        },
        [OrderStatus.CANCELED]: {
          subject: `❌ Objednávka #${orderNumber} zrušená`,
          message: `Vaša objednávka bola zrušená. Ak máte otázky, kontaktujte nás prosím.`,
        },
        // PAID a PENDING sa neposielajú
      };

      const notification = statusMessages[newStatus];
      if (notification && customer.email) {
        const emailHtml = this.buildStatusUpdateEmail(
          order,
          customer,
          tenant.name,
          trackingUrl,
          notification.message,
        );

        // Use a public method if available, or access transporter directly
        const emailTransporter = (this.emailService as any).transporter;
        if (emailTransporter) {
          await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM || `"${tenant.name}" <orders@${tenantDomain}>`,
            to: customer.email,
            subject: notification.subject,
            html: emailHtml,
          });
        }

        this.logger.log(`✅ Status update email sent to ${customer.email} for order ${orderNumber}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send status notifications for order ${order.id}:`, error);
      // Don't throw - notification failure shouldn't break status update
    }
  }

  private buildStatusUpdateEmail(
    order: any,
    customer: any,
    tenantName: string,
    trackingUrl: string,
    message: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktualizácia stavu objednávky</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px; text-align: center; background-color: #FF6B00;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${tenantName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Aktualizácia stavu objednávky</h2>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Ahoj ${customer.name},
              </p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              <p style="margin: 30px 0; text-align: center;">
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 30px; background-color: #FF6B00; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Sledovať objednávku
                </a>
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Objednávka #${order.id.slice(0, 8).toUpperCase()}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
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
          tenant: true,
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













