import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { StoryousService } from '../storyous/storyous.service';

@Injectable()
export class OrderStatusService {
  private readonly logger = new Logger(OrderStatusService.name);
  
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
      // Email notification
      const statusMessages: Record<OrderStatus, { subject: string; message: string }> = {
        [OrderStatus.PAID]: {
          subject: `✅ Payment Received - Order #${orderNumber}`,
          message: `Your payment has been received. We're preparing your order!`,
        },
        [OrderStatus.PREPARING]: {
          subject: `👨‍🍳 Order #${orderNumber} is Being Prepared`,
          message: `Great news! Your order is now being prepared in our kitchen.`,
        },
        [OrderStatus.READY]: {
          subject: `🍕 Order #${orderNumber} is Ready!`,
          message: `Your order is ready! It will be delivered shortly.`,
        },
        [OrderStatus.OUT_FOR_DELIVERY]: {
          subject: `🚗 Order #${orderNumber} is Out for Delivery`,
          message: `Your order is on the way! Track your delivery: ${trackingUrl}`,
        },
        [OrderStatus.DELIVERED]: {
          subject: `✅ Order #${orderNumber} Delivered`,
          message: `Your order has been delivered! Enjoy your meal! 🍕`,
        },
        [OrderStatus.CANCELED]: {
          subject: `❌ Order #${orderNumber} Cancelled`,
          message: `Your order has been cancelled. If you have questions, please contact us.`,
        },
        [OrderStatus.PENDING]: {
          subject: `📦 Order #${orderNumber} Received`,
          message: `We've received your order and are processing it.`,
        },
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
  <title>Order Status Update</title>
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
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Order Status Update</h2>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Hello ${customer.name},
              </p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              <p style="margin: 30px 0; text-align: center;">
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 30px; background-color: #FF6B00; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Track Your Order
                </a>
              </p>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                Order #${order.id.slice(0, 8).toUpperCase()}
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
}













