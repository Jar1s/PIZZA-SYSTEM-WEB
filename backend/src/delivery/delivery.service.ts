import { Injectable, BadRequestException, Logger, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WoltDriveService } from './wolt-drive.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { OrderStatus, DeliveryStatus, Address } from '@pizza-ecosystem/shared';
import { DeliveryConfig } from '../types/tenant.types';

interface AuthenticatedUser {
  id: string;
  role: string;
  tenantId?: string | null;
  email?: string | null;
}

interface ShipmentPromiseData {
  promiseId?: string;
  feeCents?: number;
  etaMinutes?: number;
  validUntil?: string;
  currency?: string;
  distance?: number;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private woltDrive: WoltDriveService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    @Inject(forwardRef(() => OrderStatusService))
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
  ) {}

  private assertTenantAccess(
    tenantId: string,
    user: AuthenticatedUser | undefined,
    context: string,
  ): void {
    if (!user) {
      // Internal service-to-service calls (e.g. payment webhooks) do not have request user context.
      return;
    }

    const userTenantId = user.tenantId || null;
    if (userTenantId && userTenantId !== tenantId) {
      this.logger.warn(`[${context}] Tenant mismatch`, {
        userId: user.id,
        userTenantId,
        targetTenantId: tenantId,
      });
      throw new ForbiddenException('You do not have access to this tenant data');
    }
  }

  private async getExistingDeliveryForOrder(orderId: string) {
    const latestOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!latestOrder?.deliveryId || !latestOrder.delivery) {
      return null;
    }

    return latestOrder.delivery;
  }

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

  async getQuote(tenantId: string, dropoffAddress: any, user?: AuthenticatedUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    this.assertTenantAccess(tenant.id, user, 'getQuote');

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

  /**
   * Get shipment promise for an order (check availability and get pricing)
   * This is the proper way according to Wolt Drive API documentation
   */
  async getShipmentPromiseForOrder(orderId: string, user?: AuthenticatedUser) {
    const order = await this.ordersService.getOrderById(orderId);
    this.assertTenantAccess(order.tenantId, user, 'getShipmentPromiseForOrder');
    
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

    // Get shipment promise from Wolt
    try {
      return await this.woltDrive.getShipmentPromise(
        woltConfig.apiKey,
        pickupAddress,
        address,
        customer.name,
        customer.phone,
      );
    } catch (error: any) {
      // Propagate user-friendly error message from WoltDriveService
      this.logger.error('Failed to get shipment promise', { 
        orderId, 
        error: error.message,
        status: error.status,
      });
      throw new BadRequestException(error.message || 'Nepodarilo sa skontrolovať dostupnosť Wolt');
    }
  }

  async createDeliveryForOrder(
    orderId: string,
    shipmentPromiseId?: string,
    promiseData?: ShipmentPromiseData,
    user?: AuthenticatedUser,
  ) {
    const order = await this.ordersService.getOrderById(orderId);
    this.assertTenantAccess(order.tenantId, user, 'createDeliveryForOrder');

    const existingDelivery = await this.getExistingDeliveryForOrder(order.id);
    if (existingDelivery) {
      this.logger.log('[createDeliveryForOrder] Delivery already exists, reusing existing record', {
        orderId: order.id,
        deliveryId: existingDelivery.id,
        jobId: existingDelivery.jobId,
      });
      return existingDelivery;
    }
    
    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.READY
    ) {
      throw new BadRequestException('Order must be paid or preparing before creating delivery');
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
    // If shipmentPromiseId is provided, use it (proper flow according to documentation)
    let woltDelivery;
    try {
      // Re-check immediately before external API call to reduce duplicate dispatches.
      const existingBeforeCreate = await this.getExistingDeliveryForOrder(order.id);
      if (existingBeforeCreate) {
        return existingBeforeCreate;
      }

      woltDelivery = await this.woltDrive.createDelivery(
        woltConfig.apiKey,
        order.id,
        pickupAddress,
        address,
        customer.name,
        customer.phone,
        shipmentPromiseId, // Optional: if provided, will use shipment promise ID
        promiseData,
      );
    } catch (error: any) {
      // Propagate user-friendly error message from WoltDriveService
      this.logger.error('Failed to create Wolt delivery', { 
        orderId, 
        error: error.message,
        status: error.status,
      });
      throw new BadRequestException(error.message || 'Nepodarilo sa vytvoriť Wolt doručenie');
    }

    // Save delivery record
    const quote: Record<string, unknown> = {};
    const feeCents = woltDelivery?.feeCents ?? promiseData?.feeCents;
    const etaMinutes = woltDelivery?.etaMinutes ?? woltDelivery?.courierEta ?? promiseData?.etaMinutes;
    const distance = woltDelivery?.distance ?? promiseData?.distance;
    const currency = woltDelivery?.currency ?? promiseData?.currency;
    const promiseId = woltDelivery?.promiseId ?? shipmentPromiseId ?? promiseData?.promiseId;
    const validUntil = woltDelivery?.validUntil ?? promiseData?.validUntil;

    if (typeof feeCents === 'number') quote.feeCents = feeCents;
    if (typeof etaMinutes === 'number') quote.etaMinutes = etaMinutes;
    if (typeof distance === 'number') quote.distance = distance;
    if (typeof currency === 'string') quote.currency = currency;
    if (typeof promiseId === 'string') quote.promiseId = promiseId;
    if (typeof validUntil === 'string') quote.validUntil = validUntil;

    const delivery = await this.prisma.delivery.create({
      data: {
        tenantId: order.tenantId,
        provider: 'wolt',
        jobId: woltDelivery.jobId,
        status: DeliveryStatus.PENDING,
        trackingUrl: woltDelivery.trackingUrl,
        quote: Object.keys(quote).length > 0 ? quote : { courierEta: woltDelivery.courierEta },
      },
    });

    // Link delivery to order safely (idempotent update).
    const linkResult = await this.prisma.order.updateMany({
      where: {
        id: order.id,
        deliveryId: null,
      },
      data: { deliveryId: delivery.id },
    });

    if (linkResult.count === 0) {
      const linkedDelivery = await this.getExistingDeliveryForOrder(order.id);

      this.logger.warn('[createDeliveryForOrder] Delivery link race detected, keeping existing linked delivery', {
        orderId: order.id,
        newDeliveryId: delivery.id,
        existingDeliveryId: linkedDelivery?.id,
      });

      // Best effort cleanup of duplicate local record and external Wolt job.
      try {
        if (delivery.jobId) {
          await this.woltDrive.cancelDelivery(woltConfig.apiKey, delivery.jobId);
        }
      } catch (cancelError: any) {
        this.logger.warn('[createDeliveryForOrder] Failed to cancel duplicate Wolt job', {
          orderId: order.id,
          deliveryId: delivery.id,
          jobId: delivery.jobId,
          error: cancelError?.message,
        });
      }

      await this.prisma.delivery.delete({
        where: { id: delivery.id },
      }).catch((deleteError: any) => {
        this.logger.warn('[createDeliveryForOrder] Failed to remove duplicate delivery record', {
          orderId: order.id,
          deliveryId: delivery.id,
          error: deleteError?.message,
        });
      });

      if (linkedDelivery) {
        return linkedDelivery;
      }
    }
    
    // Update order status to PREPARING
    if (order.status === OrderStatus.PAID) {
      await this.orderStatusService.updateStatus(order.id, OrderStatus.PREPARING);
    }

    return delivery;
  }

  async getDeliveryById(id: string, user?: AuthenticatedUser) {
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

    this.assertTenantAccess(delivery.tenantId, user, 'getDeliveryById');

    return delivery;
  }

  async handleWoltWebhook(webhookData: any) {
    const status = webhookData?.status;
    const deliveryJobId = webhookData?.delivery_id || webhookData?.job_id;

    if (!deliveryJobId) {
      this.logger.warn('Wolt webhook payload missing delivery identifier', {
        keys: webhookData ? Object.keys(webhookData) : [],
      });
      return;
    }

    const delivery = await this.prisma.delivery.findFirst({
      where: { jobId: deliveryJobId },
      include: { orders: true },
    });

    if (!delivery) {
      this.logger.error('Delivery not found for Wolt job', {
        deliveryId: deliveryJobId,
        woltJobId: deliveryJobId,
      });
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











