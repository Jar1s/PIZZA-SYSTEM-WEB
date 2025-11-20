import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WoltDriveService } from './wolt-drive.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { OrderStatus, DeliveryStatus, Address } from '@pizza-ecosystem/shared';
import { DeliveryConfig } from '../types/tenant.types';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private woltDrive: WoltDriveService,
    private ordersService: OrdersService,
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  /**
   * Get pickup address from tenant configuration
   * Throws error if not configured
   */
  private getPickupAddress(tenantId: string, deliveryConfig: DeliveryConfig): Address & { phone?: string } {
    const pickupAddress = deliveryConfig.pickupAddress;
    
    if (!pickupAddress) {
      this.logger.error(`Pickup address not configured for tenant ${tenantId}`, { tenantId, deliveryConfig });
      throw new BadRequestException(
        'Pickup address is not configured for this tenant. Please configure the kitchen address in tenant settings.'
      );
    }

    // Validate required fields
    if (!pickupAddress.street || !pickupAddress.city || !pickupAddress.postalCode || !pickupAddress.country) {
      throw new BadRequestException(
        'Pickup address is incomplete. Required fields: street, city, postalCode, country'
      );
    }

    // Validate coordinates if provided
    if (pickupAddress.coordinates && (!pickupAddress.coordinates.lat || !pickupAddress.coordinates.lng)) {
      this.logger.warn(`Invalid coordinates for tenant ${tenantId} pickup address`, { tenantId, coordinates: pickupAddress.coordinates });
    }

    const address: Address = {
      street: pickupAddress.street,
      city: pickupAddress.city,
      postalCode: pickupAddress.postalCode,
      country: pickupAddress.country,
      coordinates: pickupAddress.coordinates,
      instructions: pickupAddress.instructions,
    };
    
    // Return address with phone as extended property (for WoltDriveService)
    return Object.assign(address, { phone: pickupAddress.phone }) as Address & { phone?: string };
  }

  async getQuote(tenantId: string, dropoffAddress: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const deliveryConfig = tenant.deliveryConfig as DeliveryConfig;
    const woltConfig = deliveryConfig.woltConfig;
    
    if (!woltConfig?.apiKey) {
      throw new BadRequestException('Wolt API key not configured for this tenant');
    }

    // Get tenant-specific pickup address
    const pickupAddress = this.getPickupAddress(tenantId, deliveryConfig);
    
    return this.woltDrive.getQuote(
      woltConfig.apiKey,
      pickupAddress,
      dropoffAddress,
    );
  }

  async createDeliveryForOrder(orderId: string) {
    const order = await this.ordersService.getOrderById(orderId);
    
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before creating delivery');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: order.tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const deliveryConfig = tenant.deliveryConfig as DeliveryConfig;
    const woltConfig = deliveryConfig.woltConfig;
    
    if (!woltConfig?.apiKey) {
      throw new BadRequestException('Wolt API key not configured for this tenant');
    }

    // Get tenant-specific pickup address
    const pickupAddress = this.getPickupAddress(order.tenantId, deliveryConfig);
    
    const customer = order.customer as any;
    const address = order.address as any;

    // Create Wolt delivery with tenant-specific pickup address
    const woltDelivery = await this.woltDrive.createDelivery(
      woltConfig.apiKey,
      order.id,
      pickupAddress,
      address,
      customer.name,
      customer.phone,
    );

    // Save delivery record
    const delivery = await this.prisma.delivery.create({
      data: {
        tenantId: order.tenantId,
        provider: 'wolt',
        jobId: woltDelivery.jobId,
        status: DeliveryStatus.PENDING,
        trackingUrl: woltDelivery.trackingUrl,
        quote: {
          courierEta: woltDelivery.courierEta,
        },
      },
    });

    // Link delivery to order
    await this.ordersService.updateDeliveryRef(order.id, delivery.id);
    
    // Update order status to PREPARING
    await this.orderStatusService.updateStatus(order.id, OrderStatus.PREPARING);

    return delivery;
  }

  async getDeliveryById(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new BadRequestException('Delivery not found');
    }

    return delivery;
  }

  async handleWoltWebhook(webhookData: any) {
    const { delivery_id, status, courier } = webhookData;

    const delivery = await this.prisma.delivery.findFirst({
      where: { jobId: delivery_id },
      include: { orders: true },
    });

    if (!delivery) {
      this.logger.error('Delivery not found for Wolt job', { deliveryId: delivery_id, woltJobId: delivery_id });
      return;
    }

    // Update delivery status
    let newDeliveryStatus: DeliveryStatus;
    let newOrderStatus: OrderStatus | null = null;

    switch (status) {
      case 'courier_assigned':
        newDeliveryStatus = DeliveryStatus.COURIER_ASSIGNED;
        break;
      case 'picked_up':
        newDeliveryStatus = DeliveryStatus.PICKED_UP;
        newOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
        break;
      case 'delivered':
        newDeliveryStatus = DeliveryStatus.DELIVERED;
        newOrderStatus = OrderStatus.DELIVERED;
        break;
      case 'failed':
      case 'cancelled':
        newDeliveryStatus = DeliveryStatus.FAILED;
        break;
      default:
        newDeliveryStatus = DeliveryStatus.IN_TRANSIT;
    }

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: newDeliveryStatus },
    });

    // Update order status if needed
    if (newOrderStatus && delivery.orders.length > 0) {
      for (const order of delivery.orders) {
        await this.orderStatusService.updateStatus(order.id, newOrderStatus);
      }
    }
  }
}













