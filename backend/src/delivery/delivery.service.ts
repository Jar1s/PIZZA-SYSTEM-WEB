import { Injectable, BadRequestException, Logger, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WoltDriveService } from './wolt-drive.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { DeliveryFeeTierService } from './delivery-fee-tier.service';
import { OrderStatus, DeliveryStatus, Address } from '@pizza-ecosystem/shared';
import { DeliveryConfig } from '../types/tenant.types';
import { Prisma } from '@prisma/client';

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
  pickupEtaMinutes?: number;
  dropoffEtaMinutes?: number;
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
    private deliveryFeeTierService: DeliveryFeeTierService,
  ) {}

  private assertWoltConfig(tenant: { slug: string; id: string }, woltConfig: any): void {
    const hasApiKey = Boolean(woltConfig?.apiKey && String(woltConfig.apiKey).trim());
    const hasVenueId = Boolean(woltConfig?.venueId && String(woltConfig.venueId).trim());

    if (!hasApiKey || !hasVenueId) {
      const missing = [
        !hasApiKey ? 'Merchant Key' : null,
        !hasVenueId ? 'Venue ID' : null,
      ].filter(Boolean);

      this.logger.warn('Incomplete Wolt config for tenant', {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        hasApiKey,
        hasVenueId,
        missing,
      });

      throw new BadRequestException(
        `Wolt konfigurácia je nekompletná pre tenant ${tenant.slug}. Chýba: ${missing.join(', ')}.`,
      );
    }
  }

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

  private parseCoordinate(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().replace(',', '.');
      if (!normalized) {
        return null;
      }

      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private extractCoordinates(address: Record<string, any>): { lat: number; lng: number } | null {
    const latCandidates = [
      address?.coordinates?.lat,
      address?.coordinates?.latitude,
      address?.lat,
      address?.latitude,
      address?.location?.lat,
      address?.location?.latitude,
    ];
    const lngCandidates = [
      address?.coordinates?.lng,
      address?.coordinates?.lon,
      address?.coordinates?.longitude,
      address?.lng,
      address?.lon,
      address?.longitude,
      address?.location?.lng,
      address?.location?.lon,
      address?.location?.longitude,
    ];

    let lat: number | null = null;
    for (const candidate of latCandidates) {
      lat = this.parseCoordinate(candidate);
      if (lat !== null) {
        break;
      }
    }

    let lng: number | null = null;
    for (const candidate of lngCandidates) {
      lng = this.parseCoordinate(candidate);
      if (lng !== null) {
        break;
      }
    }

    if (lat === null || lng === null) {
      return null;
    }

    return { lat, lng };
  }

  private async persistOrderAddressCoordinates(
    orderId: string,
    address: Address,
    context: string,
  ): Promise<void> {
    try {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { address: address as unknown as Prisma.InputJsonValue },
      });
    } catch (error: any) {
      this.logger.warn(`[${context}] Failed to persist geocoded order coordinates`, {
        orderId,
        error: error?.message,
      });
    }
  }

  private async normalizeDropoffAddress(
    tenantId: string,
    rawAddress: any,
    context: string,
    orderId?: string,
  ): Promise<Address> {
    const addressObject: Record<string, any> =
      rawAddress && typeof rawAddress === 'object' ? { ...rawAddress } : {};

    const normalizedCountry =
      typeof addressObject.country === 'string' && addressObject.country.trim()
        ? addressObject.country
        : 'SK';
    const resolved: Address = {
      ...addressObject,
      country: normalizedCountry,
    } as Address;

    const parsedCoordinates = this.extractCoordinates(addressObject);
    if (parsedCoordinates) {
      resolved.coordinates = parsedCoordinates;
      return resolved;
    }

    const hasAddressForGeocoding = Boolean(
      (typeof addressObject.street === 'string' && addressObject.street.trim()) ||
      (typeof addressObject.city === 'string' && addressObject.city.trim()) ||
      (typeof addressObject.postalCode === 'string' && addressObject.postalCode.trim()),
    );

    if (!hasAddressForGeocoding) {
      throw new BadRequestException(
        'Missing or invalid dropoff coordinates for Wolt delivery. Please set geolocation first.',
      );
    }

    try {
      const geocoded = await this.deliveryFeeTierService.geocodeAddress({
        street: addressObject.street,
        city: addressObject.city,
        postalCode: addressObject.postalCode,
        country: normalizedCountry,
      });

      resolved.coordinates = { lat: geocoded.lat, lng: geocoded.lng };

      this.logger.log(`[${context}] Dropoff coordinates geocoded`, {
        tenantId,
        orderId,
        lat: geocoded.lat,
        lng: geocoded.lng,
        city: addressObject.city,
        postalCode: addressObject.postalCode,
      });

      if (orderId) {
        await this.persistOrderAddressCoordinates(orderId, resolved, context);
      }

      return resolved;
    } catch (error: any) {
      this.logger.warn(`[${context}] Failed to geocode dropoff address`, {
        tenantId,
        orderId,
        city: addressObject.city,
        postalCode: addressObject.postalCode,
        error: error?.message,
      });
      throw new BadRequestException(
        'Missing or invalid dropoff coordinates for Wolt delivery. Please set geolocation first.',
      );
    }
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
    this.assertWoltConfig(tenant, woltConfig);

    // Get tenant-specific pickup address
    const pickupAddress = this.getPickupAddress(tenantId, deliveryConfig);
    const normalizedDropoffAddress = await this.normalizeDropoffAddress(
      tenantId,
      dropoffAddress,
      'getQuote',
    );
    
    return this.woltDrive.getQuote(
      woltConfig.apiKey,
      pickupAddress,
      normalizedDropoffAddress,
      3,
      woltConfig,
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
    this.assertWoltConfig(tenant, woltConfig);

    // Get tenant-specific pickup address
    const pickupAddress = this.getPickupAddress(order.tenantId, deliveryConfig);
    
    const customer = order.customer as any;
    const normalizedDropoffAddress = await this.normalizeDropoffAddress(
      order.tenantId,
      order.address as any,
      'getShipmentPromiseForOrder',
      order.id,
    );

    // Get shipment promise from Wolt
    try {
      return await this.woltDrive.getShipmentPromise(
        woltConfig.apiKey,
        pickupAddress,
        normalizedDropoffAddress,
        customer.name,
        customer.phone,
        3,
        woltConfig,
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
    minPreparationTimeMinutes?: number,
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
    this.assertWoltConfig(tenant, woltConfig);

    // Get tenant-specific pickup address
    const pickupAddress = this.getPickupAddress(order.tenantId, deliveryConfig);
    
    const customer = order.customer as any;
    const normalizedDropoffAddress = await this.normalizeDropoffAddress(
      order.tenantId,
      order.address as any,
      'createDeliveryForOrder',
      order.id,
    );

    const minPreparationTimeMinutesUsed =
      minPreparationTimeMinutes !== undefined ? minPreparationTimeMinutes : 20;

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
        normalizedDropoffAddress,
        customer.name,
        customer.phone,
        shipmentPromiseId, // Optional: if provided, will use shipment promise ID
        minPreparationTimeMinutesUsed,
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
    const quote: Prisma.JsonObject = {};
    const feeCents = woltDelivery?.feeCents;
    const etaMinutes =
      woltDelivery?.etaMinutes ??
      woltDelivery?.dropoffEtaMinutes ??
      woltDelivery?.courierEta;
    const pickupEtaMinutes = woltDelivery?.pickupEtaMinutes;
    const dropoffEtaMinutes = woltDelivery?.dropoffEtaMinutes;
    const distance = woltDelivery?.distance;
    const currency = woltDelivery?.currency;
    const promiseId = woltDelivery?.promiseId ?? shipmentPromiseId;
    const validUntil = woltDelivery?.validUntil;

    if (typeof feeCents === 'number') quote.feeCents = feeCents;
    if (typeof etaMinutes === 'number') quote.etaMinutes = etaMinutes;
    if (typeof pickupEtaMinutes === 'number') quote.pickupEtaMinutes = pickupEtaMinutes;
    if (typeof dropoffEtaMinutes === 'number') quote.dropoffEtaMinutes = dropoffEtaMinutes;
    if (typeof distance === 'number') quote.distance = distance;
    if (typeof currency === 'string') quote.currency = currency;
    if (typeof promiseId === 'string') quote.promiseId = promiseId;
    if (typeof validUntil === 'string') quote.validUntil = validUntil;

    const fallbackQuote: Prisma.JsonObject = { courierEta: woltDelivery?.courierEta ?? null };
    const finalQuote: Prisma.InputJsonValue = Object.keys(quote).length > 0 ? quote : fallbackQuote;

    const delivery = await this.prisma.delivery.create({
      data: {
        tenantId: order.tenantId,
        provider: 'wolt',
        jobId: woltDelivery.jobId,
        status: DeliveryStatus.PENDING,
        trackingUrl: woltDelivery.trackingUrl,
        quote: {
          ...(finalQuote as Prisma.JsonObject),
          minPreparationTimeMinutesUsed,
          requestMode: 'asap',
        } as Prisma.InputJsonValue,
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
          await this.woltDrive.cancelDelivery(woltConfig.apiKey, delivery.jobId, 3, woltConfig);
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
    const eventType = webhookData?.event;
    const orderData = webhookData?.order || {};
    const status = String(orderData?.status || webhookData?.status || '').toUpperCase();
    const deliveryJobId =
      orderData?.wolt_order_reference_id ||
      webhookData?.wolt_order_reference_id ||
      webhookData?.delivery_id ||
      webhookData?.job_id;

    if (!deliveryJobId) {
      this.logger.warn('Wolt webhook payload missing delivery identifier', {
        keys: webhookData ? Object.keys(webhookData) : [],
      });
      return;
    }

    this.logger.log('Processing Wolt webhook event', {
      eventType: eventType || 'unknown',
      deliveryJobId,
      status,
    });

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
      case 'INFO_RECEIVED':
        newDeliveryStatus = DeliveryStatus.PENDING;
        break;
      case 'COURIER_ASSIGNED':
        newDeliveryStatus = DeliveryStatus.COURIER_ASSIGNED;
        break;
      case 'ITEM_PICKED_UP':
      case 'PICKED_UP':
        newDeliveryStatus = DeliveryStatus.PICKED_UP;
        newOrderStatus = OrderStatus.OUT_FOR_DELIVERY;
        break;
      case 'COURIER_LEFT_PICK_UP':
      case 'IN_TRANSIT':
        newDeliveryStatus = DeliveryStatus.IN_TRANSIT;
        break;
      case 'DELIVERED':
        newDeliveryStatus = DeliveryStatus.DELIVERED;
        newOrderStatus = OrderStatus.DELIVERED;
        break;
      case 'CANCELLED':
      case 'FAILED':
      case 'REJECTED':
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











