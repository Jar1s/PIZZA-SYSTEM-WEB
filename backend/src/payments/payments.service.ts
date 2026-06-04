import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WepayService } from './wepay.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { DeliveryService } from '../delivery/delivery.service';
import { OrderStatus } from '@pizza-ecosystem/shared';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private adyenService: AdyenService,
    private gopayService: GopayService,
    private wepayService: WepayService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    @Inject(forwardRef(() => OrderStatusService))
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
    @Inject(forwardRef(() => DeliveryService))
    private deliveryService: DeliveryService,
  ) {}

  async createPaymentSession(orderId: string) {
    let tenantSlug = 'unknown';
    try {
      const normalizedOrderId = (orderId || '').trim();
      if (!normalizedOrderId) {
        throw new BadRequestException('Missing orderId');
      }

      const order = await this.ordersService.getOrderById(normalizedOrderId);
      
      // Get tenant by ID (we need to add this method to TenantsService or use existing one)
      const tenant = await this.tenantsService.getTenantById(order.tenantId);
      tenantSlug = tenant.slug;

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order already processed');
      }

      const existingPaymentStatus = String((order as any).paymentStatus || '').toLowerCase();
      const existingPaymentRef = String((order as any).paymentRef || '').trim();
      if (existingPaymentStatus === 'pending' && existingPaymentRef) {
        throw new BadRequestException('Payment session already initialized for this order');
      }

      let paymentSession: any;
      const paymentLockRef = `initializing:${crypto.randomUUID()}`;
      const lockAcquired = await this.ordersService.tryStartPaymentSession(
        normalizedOrderId,
        paymentLockRef,
      );

      if (!lockAcquired) {
        throw new BadRequestException('Payment session already initialized for this order');
      }

      try {
        switch (tenant.paymentProvider) {
          case 'adyen':
            paymentSession = await this.adyenService.createPaymentSession(order, tenant);
            break;
          case 'gopay':
            paymentSession = await this.gopayService.createPayment(order, tenant);
            break;
          case 'wepay':
            paymentSession = await this.wepayService.createPayment(order, tenant);
            break;
          default:
            throw new BadRequestException('Unsupported payment provider');
        }
      } catch (error) {
        await this.ordersService.clearPaymentSessionLock(normalizedOrderId, paymentLockRef);
        throw error;
      }

      await this.ordersService.updatePaymentRef(
        normalizedOrderId,
        paymentSession.sessionId || paymentSession.paymentId,
        'pending'
      );

      return paymentSession;
    } catch (error: any) {
      const errorMessage = (error?.message || 'Unknown payment provider error').toString().replace(/\s+/g, ' ').trim();

      this.logger.error(
        `Payment session creation failed for order ${orderId} (tenant=${tenantSlug}): ${errorMessage}`,
        error?.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof InternalServerErrorException) {
        const internalMessage = typeof error.getResponse === 'function' ? error.getResponse() : errorMessage;
        const normalizedInternalMessage =
          typeof internalMessage === 'string'
            ? internalMessage
            : (internalMessage as any)?.message || errorMessage;
        throw new BadRequestException(`Payment session failed: ${normalizedInternalMessage}`);
      }

      // Return provider error to frontend so checkout does not hide the root cause.
      throw new BadRequestException(`Payment session failed: ${errorMessage}`);
    }
  }

  async getGopayClientSecretForOrder(orderId: string): Promise<string | null> {
    try {
      const order = await this.ordersService.getOrderById(orderId);
      const tenant = await this.tenantsService.getTenantById(order.tenantId);
      const paymentConfig = (tenant.paymentConfig || {}) as Record<string, any>;
      const clientSecret = paymentConfig.clientSecret;

      return typeof clientSecret === 'string' && clientSecret.trim() ? clientSecret : null;
    } catch (error: any) {
      this.logger.warn(`Unable to resolve tenant GoPay secret for order ${orderId}: ${error?.message || error}`);
      return null;
    }
  }

  async handleAdyenWebhook(notification: any, tenantId?: string) {
    const parsed = this.adyenService.parseWebhook(notification);
    
    // Try to find order by merchant reference (orderId) first
    const order = await this.ordersService.getOrderById(parsed.merchantReference);

    if (!order) {
      console.error('Order not found for reference:', parsed.merchantReference);
      return;
    }

    if (parsed.success && parsed.eventType === 'AUTHORISATION') {
      // Payment successful
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.PAID);
      
      // 🚀 CREATE DELIVERY - Automatically dispatch courier
      try {
        await this.deliveryService.createDeliveryForOrder(order.id);
        console.log(`Payment successful for order ${order.id}, delivery created`);
      } catch (error) {
        console.error('Failed to create delivery:', error);
        // Don't fail the payment, admin can manually dispatch
      }
    } else if (!parsed.success && parsed.eventType === 'AUTHORISATION') {
      // Payment failed
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'failed');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.CANCELED);
      
      console.log(`Payment failed for order ${order.id}`);
    }
  }

  async handleGopayWebhook(data: any) {
    // GoPay webhook handling
    const parsed = this.gopayService.parseWebhook(data);
    
    const order = await this.ordersService.getOrderById(parsed.merchantReference);

    if (!order) {
      console.error('Order not found for GoPay reference:', parsed.merchantReference);
      return;
    }

    // Handle different GoPay states
    if (parsed.success && parsed.eventType === 'PAID') {
      // Admin might have canceled/rejected the order before the PAID webhook arrived.
      // In that case, keep order canceled and immediately issue refund.
      if (order.status === OrderStatus.CANCELED) {
        await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
        try {
          await this.refundGopayPayment(order.id);
          this.logger.warn(
            `GoPay PAID webhook arrived after order ${order.id} was canceled - refund initiated automatically`,
          );
        } catch (error: any) {
          this.logger.error(
            `GoPay PAID arrived for canceled order ${order.id}, but auto-refund failed: ${error?.message || error}`,
          );
        }
        return;
      }

      if ((order as any).paymentStatus === 'success' || this.isPaidFlowOrderStatus(order.status as OrderStatus)) {
        this.logger.log(`GoPay payment already processed for order ${order.id}, skipping duplicate PAID event`);
        return;
      }

      // Payment successful
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.PAID);
      
      // 🚀 CREATE DELIVERY - Automatically dispatch courier
      try {
        await this.deliveryService.createDeliveryForOrder(order.id);
        console.log(`GoPay payment successful for order ${order.id}, delivery created`);
      } catch (error) {
        console.error('Failed to create delivery:', error);
        // Don't fail the payment, admin can manually dispatch
      }
    } else if (parsed.eventType === 'CANCELED' || parsed.eventType === 'TIMEOUTED') {
      if (this.isPaidFlowOrderStatus(order.status as OrderStatus)) {
        this.logger.warn(
          `Ignoring GoPay ${parsed.eventType} for already processed order ${order.id} (status=${order.status})`
        );
        return;
      }

      // Payment failed or canceled
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'failed');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.CANCELED);
      console.log(`GoPay payment ${parsed.eventType.toLowerCase()} for order ${order.id}`);
    } else {
      // Other states (CREATED, PAYMENT_METHOD_CHOSEN) - just log, don't change status
      console.log(`GoPay webhook received state ${parsed.eventType} for order ${order.id}, no action taken`);
    }
  }

  private mapGopayStateToClientStatus(state: string): 'success' | 'canceled' | 'failed' | 'pending' {
    switch ((state || '').toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'CANCELED':
        return 'canceled';
      case 'TIMEOUTED':
        return 'failed';
      case 'CREATED':
      case 'PAYMENT_METHOD_CHOSEN':
        return 'pending';
      default:
        return 'pending';
    }
  }

  private isPaidFlowOrderStatus(status: OrderStatus): boolean {
    return [
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ].includes(status);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async resolveGopayPaymentContext(paymentId: string): Promise<{
    order: any;
    tenant: any;
    paymentData?: any;
  }> {
    const existingOrder = await this.ordersService.getOrderByPaymentRef(paymentId);
    if (existingOrder) {
      const tenant = await this.tenantsService.getTenantById(existingOrder.tenantId);
      if (tenant.paymentProvider !== 'gopay') {
        throw new BadRequestException(`Tenant payment provider is ${tenant.paymentProvider}, not gopay`);
      }
      return { order: existingOrder, tenant };
    }

    // GoPay return/notification contains only payment id. If the paymentRef write
    // has not completed yet, recover via GoPay status and its order_number.
    const tenants = await this.tenantsService.getAllTenants(false);
    const gopayTenants = tenants.filter((tenant: any) => tenant.paymentProvider === 'gopay');

    for (const tenant of gopayTenants) {
      try {
        const paymentData = await this.gopayService.getPaymentStatus(paymentId, tenant);
        const orderId = paymentData?.order_number ? String(paymentData.order_number).trim() : '';
        if (!orderId) {
          continue;
        }

        const order = await this.ordersService.getOrderById(orderId);
        if (order.tenantId !== tenant.id) {
          this.logger.warn('GoPay payment order_number resolved to a different tenant', {
            paymentId,
            orderId,
            paymentTenantId: tenant.id,
            orderTenantId: order.tenantId,
          });
          continue;
        }

        if (!(order as any).paymentRef) {
          await this.ordersService.updatePaymentRef(order.id, paymentId, 'pending');
        }

        return { order, tenant, paymentData };
      } catch (error: any) {
        this.logger.debug('GoPay payment fallback lookup failed for tenant', {
          paymentId,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          error: error?.message || String(error),
        });
      }
    }

    throw new NotFoundException(`Order for GoPay payment ${paymentId} not found`);
  }

  async syncGopayPaymentById(paymentId: string): Promise<{ orderId: string; tenantSlug: string; state: string }> {
    const normalizedPaymentId = (paymentId || '').trim();
    if (!normalizedPaymentId) {
      throw new BadRequestException('Missing GoPay payment id');
    }

    const { order, tenant, paymentData: resolvedPaymentData } =
      await this.resolveGopayPaymentContext(normalizedPaymentId);
    const paymentData =
      resolvedPaymentData || await this.gopayService.getPaymentStatus(normalizedPaymentId, tenant);
    await this.handleGopayWebhook(paymentData);

    return {
      orderId: order.id,
      tenantSlug: tenant.slug,
      state: String(paymentData?.state || '').toUpperCase(),
    };
  }

  async resolveGopayReturn(paymentId: string): Promise<{
    orderId: string;
    tenantSlug: string;
    status: 'success' | 'canceled' | 'failed' | 'pending';
    state: string;
  }> {
    const maxAttempts = 4;
    const delayMs = 1200;

    let synced = await this.syncGopayPaymentById(paymentId);
    let status = this.mapGopayStateToClientStatus(synced.state);

    for (let attempt = 1; attempt < maxAttempts && status === 'pending'; attempt += 1) {
      await this.sleep(delayMs);
      synced = await this.syncGopayPaymentById(paymentId);
      status = this.mapGopayStateToClientStatus(synced.state);
    }

    return {
      orderId: synced.orderId,
      tenantSlug: synced.tenantSlug,
      status,
      state: synced.state,
    };
  }

  async handleWepayWebhook(data: any, signature?: string) {
    const parsed = this.wepayService.parseWebhook(data);
    
    const order = await this.ordersService.getOrderById(parsed.merchantReference);

    if (!order) {
      console.error('Order not found for WePay reference:', parsed.merchantReference);
      return;
    }

    if (parsed.success) {
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'success');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.PAID);
      
      // 🚀 CREATE DELIVERY - Automatically dispatch courier
      try {
        await this.deliveryService.createDeliveryForOrder(order.id);
        console.log(`WePay payment successful for order ${order.id}, delivery created`);
      } catch (error) {
        console.error('Failed to create delivery:', error);
        // Don't fail the payment, admin can manually dispatch
      }
    } else {
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'failed');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.CANCELED);
      console.log(`WePay payment failed for order ${order.id}`);
    }
  }

  async refundGopayPayment(orderId: string): Promise<void> {
    const order = await this.ordersService.getOrderById(orderId);
    const tenant = await this.tenantsService.getTenantById(order.tenantId);
    
    if (!order.paymentRef) {
      throw new Error('Order has no payment reference');
    }
    
    if (tenant.paymentProvider !== 'gopay') {
      throw new Error(`Order payment provider is ${tenant.paymentProvider}, not gopay`);
    }
    
    await this.gopayService.refundPayment(
      order.paymentRef,
      order.totalCents,
      tenant
    );
  }
}
