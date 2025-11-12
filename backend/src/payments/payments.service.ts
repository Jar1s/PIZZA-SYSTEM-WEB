import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AdyenService } from './adyen.service';
import { GopayService } from './gopay.service';
import { WepayService } from './wepay.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { DeliveryService } from '../delivery/delivery.service';
import { OrderStatus } from '@pizza-ecosystem/shared';

@Injectable()
export class PaymentsService {
  constructor(
    private adyenService: AdyenService,
    private gopayService: GopayService,
    private wepayService: WepayService,
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
    private deliveryService: DeliveryService,
  ) {}

  async createPaymentSession(orderId: string) {
    const order = await this.ordersService.getOrderById(orderId);
    
    // Get tenant by ID (we need to add this method to TenantsService or use existing one)
    const tenant = await this.tenantsService.getTenantById(order.tenantId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order already processed');
    }

    let paymentSession;

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

    // Store payment reference
    await this.ordersService.updatePaymentRef(
      orderId,
      paymentSession.sessionId || paymentSession.paymentId,
      'pending'
    );

    return paymentSession;
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

    if (parsed.success) {
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
    } else {
      await this.ordersService.updatePaymentRef(order.id, parsed.paymentRef, 'failed');
      await this.orderStatusService.updateStatus(order.id, OrderStatus.CANCELED);
    }
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
}

