import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WoltDriveService } from './wolt-drive.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatusService } from '../orders/order-status.service';
import { TenantsService } from '../tenants/tenants.service';
import { DeliveryFeeTierService } from './delivery-fee-tier.service';
import { DeliveryAreaCacheService, WoltAreaCheckResult } from './delivery-area-cache.service';
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
export class DeliveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryService.name);
  private stalePollingTimer: NodeJS.Timeout | null = null;
  private readonly stalePollingIntervalMs = 5 * 60 * 1000;
  private readonly staleWindowMs = 10 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private woltDrive: WoltDriveService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    @Inject(forwardRef(() => OrderStatusService))
    private orderStatusService: OrderStatusService,
    private tenantsService: TenantsService,
    private deliveryFeeTierService: DeliveryFeeTierService,
    private deliveryAreaCacheService: DeliveryAreaCacheService,
  ) {}

  onModuleInit() {
    this.stalePollingTimer = setInterval(() => {
      this.reconcileStaleWoltDeliveries().catch((error: any) => {
        this.logger.warn('[reconcileStaleWoltDeliveries] Background run failed', {
          error: error?.message,
        });
      });
    }, this.stalePollingIntervalMs);
  }

  onModuleDestroy() {
    if (this.stalePollingTimer) {
      clearInterval(this.stalePollingTimer);
      this.stalePollingTimer = null;
    }
  }

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

  private getQuoteObject(quote: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
    if (quote && typeof quote === 'object' && !Array.isArray(quote)) {
      return quote as Prisma.JsonObject;
    }
    return {};
  }

  private getWoltApiConfigFromQuote(quote: Prisma.JsonValue | null | undefined): {
    apiUrl?: string;
    venueId?: string;
    merchantId?: string;
  } {
    const quoteObj = this.getQuoteObject(quote);
    const apiUrlRaw = quoteObj.woltApiUrlUsed;
    const venueIdRaw = quoteObj.woltVenueIdUsed;
    const merchantIdRaw = quoteObj.woltMerchantIdUsed;

    return {
      apiUrl: typeof apiUrlRaw === 'string' && apiUrlRaw.trim() ? apiUrlRaw.trim() : undefined,
      venueId: typeof venueIdRaw === 'string' && venueIdRaw.trim() ? venueIdRaw.trim() : undefined,
      merchantId:
        typeof merchantIdRaw === 'string' && merchantIdRaw.trim() ? merchantIdRaw.trim() : undefined,
    };
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

  private parseWebhookTimestamp(value: unknown): string | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value * (value > 10_000_000_000 ? 1 : 1000)).toISOString();
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return null;
  }

  private mapWoltStatus(statusRaw: string): {
    deliveryStatus: DeliveryStatus;
    orderStatus: OrderStatus | null;
    releaseOrderForRedispatch: boolean;
  } | null {
    switch (statusRaw) {
      case 'INFO_RECEIVED':
        return { deliveryStatus: DeliveryStatus.PENDING, orderStatus: null, releaseOrderForRedispatch: false };
      case 'COURIER_ASSIGNED':
      case 'PICKUP_STARTED':
        return {
          deliveryStatus: DeliveryStatus.COURIER_ASSIGNED,
          orderStatus: null,
          releaseOrderForRedispatch: false,
        };
      case 'ITEM_PICKED_UP':
      case 'PICKED_UP':
        return {
          deliveryStatus: DeliveryStatus.PICKED_UP,
          orderStatus: OrderStatus.OUT_FOR_DELIVERY,
          releaseOrderForRedispatch: false,
        };
      case 'COURIER_LEFT_PICK_UP':
      case 'IN_TRANSIT':
      case 'DROPOFF_STARTED':
      case 'DROPOFF_ARRIVED':
        return {
          deliveryStatus: DeliveryStatus.IN_TRANSIT,
          orderStatus: OrderStatus.OUT_FOR_DELIVERY,
          releaseOrderForRedispatch: false,
        };
      case 'DELIVERED':
      case 'DROPOFF_COMPLETED':
        return {
          deliveryStatus: DeliveryStatus.DELIVERED,
          orderStatus: OrderStatus.DELIVERED,
          releaseOrderForRedispatch: false,
        };
      case 'CANCELLED':
      case 'FAILED':
      case 'REJECTED':
        return {
          deliveryStatus: DeliveryStatus.FAILED,
          orderStatus: OrderStatus.READY,
          releaseOrderForRedispatch: true,
        };
      default:
        return null;
    }
  }

  private mapWoltWebhookTypeToStatus(eventTypeRaw: string | null): string | null {
    switch ((eventTypeRaw || '').trim().toLowerCase()) {
      case 'order.received':
      case 'order.pickup_eta_updated':
        return 'INFO_RECEIVED';
      case 'order.pickup_started':
      case 'order.courier_assigned':
      case 'order.pickup_arrival':
        return 'PICKUP_STARTED';
      case 'order.picked_up':
        return 'PICKED_UP';
      case 'order.dropoff_started':
        return 'DROPOFF_STARTED';
      case 'order.dropoff_arrival':
        return 'DROPOFF_ARRIVED';
      case 'order.delivered':
      case 'order.dropoff_completed':
        return 'DELIVERED';
      case 'order.rejected':
        return 'REJECTED';
      case 'order.cancelled':
      case 'order.canceled':
        return 'CANCELLED';
      case 'order.failed':
      case 'order.customer_no_show':
        return 'FAILED';
      default:
        return null;
    }
  }

  private normalizeWoltStatus(webhookData: any, eventTypeRaw: string | null): string | null {
    const details = webhookData?.details && typeof webhookData.details === 'object' ? webhookData.details : {};
    const candidates = [
      details?.status,
      webhookData?.status,
      webhookData?.order?.status,
      webhookData?.delivery?.status,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim().toUpperCase();
      }
    }

    return this.mapWoltWebhookTypeToStatus(eventTypeRaw);
  }

  private getEtaMinutesFromWebhookValue(value: unknown, referenceTimestampIso: string): number | null {
    const etaIso =
      this.parseWebhookTimestamp((value as any)?.max) ||
      this.parseWebhookTimestamp((value as any)?.min) ||
      this.parseWebhookTimestamp(value);

    if (!etaIso) {
      return null;
    }

    const diffMs = new Date(etaIso).getTime() - new Date(referenceTimestampIso).getTime();
    if (!Number.isFinite(diffMs)) {
      return null;
    }

    return Math.max(0, Math.round(diffMs / 60000));
  }

  private buildWoltWebhookQuotePatch(
    webhookData: any,
    eventType: string | null,
    eventTimestamp: string,
    status: string | null,
    eventId: string | null,
  ): Prisma.JsonObject {
    const details = webhookData?.details && typeof webhookData.details === 'object' ? webhookData.details : {};
    const quotePatch: Record<string, unknown> = {
      lastWebhookTimestamp: eventTimestamp,
      lastWebhookEventType: eventType || null,
      lastWebhookEventId: eventId,
    };

    if (status) {
      quotePatch.lastWebhookStatus = status;
    }

    if (typeof details?.wolt_order_reference_id === 'string' && details.wolt_order_reference_id.trim()) {
      quotePatch.lastWebhookWoltOrderReferenceId = details.wolt_order_reference_id.trim();
    }

    const pickupEtaMinutes = this.getEtaMinutesFromWebhookValue(details?.pickup?.eta, eventTimestamp);
    const dropoffEtaMinutes = this.getEtaMinutesFromWebhookValue(details?.dropoff?.eta, eventTimestamp);
    if (pickupEtaMinutes !== null) {
      quotePatch.pickupEtaMinutes = pickupEtaMinutes;
    }
    if (dropoffEtaMinutes !== null) {
      quotePatch.dropoffEtaMinutes = dropoffEtaMinutes;
      quotePatch.etaMinutes = dropoffEtaMinutes;
    } else if (pickupEtaMinutes !== null) {
      quotePatch.etaMinutes = pickupEtaMinutes;
    }

    if (typeof details?.courier === 'object' && details.courier) {
      if (typeof details.courier.name === 'string' && details.courier.name.trim()) {
        quotePatch.courierName = details.courier.name.trim();
      }
      if (typeof details.courier.phone === 'string' && details.courier.phone.trim()) {
        quotePatch.courierPhone = details.courier.phone.trim();
      }
    }

    return quotePatch as Prisma.JsonObject;
  }

  private async returnOrderToReadyForWoltRedispatch(
    orderId: string,
    currentStatus: OrderStatus | null | undefined,
  ): Promise<void> {
    const orderUpdateData: Prisma.OrderUncheckedUpdateInput = { deliveryId: null };

    if (currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.CANCELED) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: orderUpdateData,
      });
      return;
    }

    const transaction: Prisma.PrismaPromise<any>[] = [];
    if (currentStatus !== OrderStatus.READY) {
      orderUpdateData.status = OrderStatus.READY;
      transaction.push(
        this.prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.READY,
          },
        }),
      );
    }

    transaction.push(
      this.prisma.order.update({
        where: { id: orderId },
        data: orderUpdateData,
      }),
    );

    await this.prisma.$transaction(transaction);
  }

  private async syncOrdersForWoltState(
    linkedOrders: Array<{ id: string; status: any }>,
    mapped: {
      deliveryStatus: DeliveryStatus;
      orderStatus: OrderStatus | null;
      releaseOrderForRedispatch: boolean;
    },
  ): Promise<void> {
    if (!linkedOrders.length) {
      return;
    }

    for (const linkedOrder of linkedOrders) {
      if (mapped.releaseOrderForRedispatch) {
        await this.returnOrderToReadyForWoltRedispatch(linkedOrder.id, linkedOrder.status);
        continue;
      }

      if (mapped.orderStatus && linkedOrder.status !== mapped.orderStatus) {
        await this.orderStatusService.updateStatus(linkedOrder.id, mapped.orderStatus);
      }
    }
  }

  async checkAreaByTenantSlug(
    tenantSlug: string,
    dropoffAddress: any,
    user?: AuthenticatedUser,
  ): Promise<WoltAreaCheckResult> {
    const normalizedTenantSlug = String(tenantSlug || '').trim().toLowerCase();
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: normalizedTenantSlug },
    });

    if (!tenant) {
      throw new BadRequestException(`Tenant ${tenantSlug} not found`);
    }

    this.assertTenantAccess(tenant.id, user, 'checkAreaByTenantSlug');

    const deliveryConfig = (tenant.deliveryConfig as DeliveryConfig) || {};
    const woltConfig = deliveryConfig?.woltConfig || {};
    const apiKey = String(woltConfig.apiKey || '').trim();
    const merchantId = String(woltConfig.merchantId || '').trim();

    if (!apiKey) {
      return {
        insideArea: null,
        source: 'fallback',
        reason: 'Wolt Merchant Key nie je nastavený pre tento tenant.',
      };
    }

    if (!merchantId) {
      return {
        insideArea: null,
        source: 'fallback',
        reason: 'Wolt Merchant ID nie je nastavený pre tento tenant.',
      };
    }

    let normalizedDropoff: Address;
    try {
      normalizedDropoff = await this.normalizeDropoffAddress(
        tenant.id,
        dropoffAddress,
        'checkAreaByTenantSlug',
      );
    } catch (error: any) {
      return {
        insideArea: null,
        source: 'fallback',
        reason: error?.message || 'Dropoff address coordinates are missing.',
      };
    }

    const coordinates = normalizedDropoff.coordinates;
    if (!coordinates) {
      return {
        insideArea: null,
        source: 'fallback',
        reason: 'Dropoff coordinates are not available.',
      };
    }

    return this.deliveryAreaCacheService.checkPoint(
      tenant.id,
      apiKey,
      merchantId,
      {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      woltConfig,
    );
  }

  async refreshAreasForTenantSlug(tenantSlug: string, user?: AuthenticatedUser) {
    const normalizedTenantSlug = String(tenantSlug || '').trim().toLowerCase();
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: normalizedTenantSlug },
    });

    if (!tenant) {
      throw new BadRequestException(`Tenant ${tenantSlug} not found`);
    }

    this.assertTenantAccess(tenant.id, user, 'refreshAreasForTenantSlug');

    const deliveryConfig = (tenant.deliveryConfig as DeliveryConfig) || {};
    const woltConfig = deliveryConfig?.woltConfig || {};
    const apiKey = String(woltConfig.apiKey || '').trim();
    const merchantId = String(woltConfig.merchantId || '').trim();

    if (!apiKey) {
      throw new BadRequestException('Wolt Merchant Key nie je nastavený pre tento tenant.');
    }
    if (!merchantId) {
      throw new BadRequestException('Wolt Merchant ID nie je nastavený pre tento tenant.');
    }

    const refreshed = await this.deliveryAreaCacheService.refreshTenantAreas(
      tenant.id,
      apiKey,
      merchantId,
      woltConfig,
    );

    return {
      ok: true,
      polygons: refreshed.polygons.length,
      fetchedAt: new Date(refreshed.fetchedAt).toISOString(),
    };
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
      20,
    );
  }

  /**
   * Get shipment promise for an order (check availability and get pricing)
   * This is the proper way according to Wolt Drive API documentation
   */
  async getShipmentPromiseForOrder(
    orderId: string,
    user?: AuthenticatedUser,
    minPreparationTimeMinutes?: number,
  ) {
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
        minPreparationTimeMinutes ?? 20,
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

    const merchantId = String(woltConfig?.merchantId || '').trim();
    if (merchantId && normalizedDropoffAddress.coordinates) {
      const areaResult = await this.deliveryAreaCacheService.checkPoint(
        order.tenantId,
        String(woltConfig.apiKey).trim(),
        merchantId,
        {
          lat: normalizedDropoffAddress.coordinates.lat,
          lng: normalizedDropoffAddress.coordinates.lng,
        },
        woltConfig,
      );

      if (areaResult.insideArea === false) {
        throw new BadRequestException(
          'Adresa zákazníka je mimo doručovacej zóny Wolt pre túto prevádzku.',
        );
      }
    }

    const minPreparationTimeMinutesUsed =
      minPreparationTimeMinutes !== undefined ? minPreparationTimeMinutes : 20;

    let promiseData: ShipmentPromiseData | undefined;
    let effectivePromiseId = shipmentPromiseId;

    // Wolt recommended flow: create shipment promise first, then create delivery with promise ID.
    if (!effectivePromiseId) {
      try {
        promiseData = await this.woltDrive.getShipmentPromise(
          woltConfig.apiKey,
          pickupAddress,
          normalizedDropoffAddress,
          customer.name,
          customer.phone,
          3,
          woltConfig,
          minPreparationTimeMinutesUsed,
        );
        effectivePromiseId = promiseData?.promiseId;
      } catch (error: any) {
        this.logger.error('Failed to get shipment promise before create delivery', {
          orderId,
          error: error.message,
          status: error.status,
        });
        throw new BadRequestException(error.message || 'Nepodarilo sa overiť dostupnosť Wolt doručenia');
      }
    }

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
        effectivePromiseId, // Optional: if provided, will use shipment promise ID
        minPreparationTimeMinutesUsed,
        3,
        woltConfig,
        {
          promiseSnapshot: promiseData,
          parcelCurrency: promiseData?.currency,
          orderNumber: order.orderNumber,
        },
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
    const feeCents = woltDelivery?.feeCents ?? promiseData?.feeCents;
    const etaMinutes =
      woltDelivery?.etaMinutes ??
      woltDelivery?.dropoffEtaMinutes ??
      woltDelivery?.courierEta ??
      promiseData?.etaMinutes ??
      promiseData?.dropoffEtaMinutes;
    const pickupEtaMinutes = woltDelivery?.pickupEtaMinutes ?? promiseData?.pickupEtaMinutes;
    const dropoffEtaMinutes = woltDelivery?.dropoffEtaMinutes ?? promiseData?.dropoffEtaMinutes;
    const distance = woltDelivery?.distance ?? promiseData?.distance;
    const currency = woltDelivery?.currency ?? promiseData?.currency;
    const promiseId = woltDelivery?.promiseId ?? effectivePromiseId ?? promiseData?.promiseId;
    const validUntil = woltDelivery?.validUntil ?? promiseData?.validUntil;

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
          woltApiUrlUsed: woltConfig?.apiUrl ?? null,
          woltVenueIdUsed: woltConfig?.venueId ?? null,
          woltMerchantIdUsed: woltConfig?.merchantId ?? null,
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
          const createdDeliveryQuote = this.getQuoteObject(delivery.quote);
          const snapshotConfig = this.getWoltApiConfigFromQuote(createdDeliveryQuote);
          const cancelConfig =
            snapshotConfig.venueId || snapshotConfig.apiUrl ? snapshotConfig : woltConfig;

          await this.woltDrive.cancelDelivery(woltConfig.apiKey, delivery.jobId, 3, cancelConfig);
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

  async cancelDeliveryForOrder(orderId: string, user?: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    this.assertTenantAccess(order.tenantId, user, 'cancelDeliveryForOrder');

    if (!order.delivery) {
      return {
        success: true,
        orderId: order.id,
        message: 'No active delivery to cancel',
      };
    }

    if (order.delivery.provider !== 'wolt') {
      throw new BadRequestException('Cancel endpoint currently supports only Wolt deliveries');
    }

    if (order.delivery.jobId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: order.tenantId } });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      const deliveryConfig = tenant.deliveryConfig as DeliveryConfig;
      const woltConfig = deliveryConfig?.woltConfig;
      const apiKey = woltConfig?.apiKey ? String(woltConfig.apiKey).trim() : '';

      if (!apiKey) {
        throw new BadRequestException('Wolt Merchant Key nie je nastavený pre tento tenant.');
      }

      const snapshotConfig = this.getWoltApiConfigFromQuote(order.delivery.quote);
      const cancelConfig = snapshotConfig.venueId || snapshotConfig.apiUrl ? snapshotConfig : woltConfig;

      try {
        await this.woltDrive.cancelDelivery(apiKey, order.delivery.jobId, 3, cancelConfig);
      } catch (error: any) {
        this.logger.error('[cancelDeliveryForOrder] Wolt cancel failed', {
          orderId,
          deliveryId: order.delivery.id,
          jobId: order.delivery.jobId,
          error: error?.message,
          status: error?.status,
        });
        throw new BadRequestException(error?.message || 'Nepodarilo sa zrušiť Wolt doručenie');
      }
    }

    const existingQuote = this.getQuoteObject(order.delivery.quote);
    const orderUpdateData: Prisma.OrderUncheckedUpdateInput = { deliveryId: null };
    const transaction: Prisma.PrismaPromise<any>[] = [
      this.prisma.delivery.update({
        where: { id: order.delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          quote: {
            ...existingQuote,
            canceledAt: new Date().toISOString(),
            cancelSource: 'admin',
          } as Prisma.InputJsonValue,
        },
      }),
    ];

    // Keep order alive after Wolt cancellation. If it was already handed to
    // courier, put it back into the dispatch queue without relaxing public
    // status transitions.
    if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
      orderUpdateData.status = OrderStatus.READY;
      transaction.push(
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.READY,
          },
        }),
      );
    }

    transaction.push(
      this.prisma.order.update({
        where: { id: order.id },
        data: orderUpdateData,
      }),
    );

    await this.prisma.$transaction(transaction);

    return {
      success: true,
      orderId: order.id,
      deliveryId: order.delivery.id,
      jobId: order.delivery.jobId,
      message: 'Wolt delivery canceled',
    };
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
    const details = webhookData?.details && typeof webhookData.details === 'object' ? webhookData.details : {};
    const eventType =
      typeof webhookData?.type === 'string'
        ? webhookData.type
        : typeof webhookData?.event === 'string'
          ? webhookData.event
          : null;
    const status = this.normalizeWoltStatus(webhookData, eventType);
    const eventId =
      webhookData?.event_id ||
      webhookData?.id ||
      webhookData?.eventId ||
      webhookData?.webhook_id ||
      null;
    const eventTimestamp =
      this.parseWebhookTimestamp(
        webhookData?.created_at ||
          webhookData?.occurred_at ||
          webhookData?.event_time ||
          webhookData?.timestamp,
      ) || new Date().toISOString();
    const deliveryJobId =
      details?.wolt_order_reference_id ||
      webhookData?.wolt_order_reference_id ||
      webhookData?.delivery_id ||
      webhookData?.job_id ||
      webhookData?.order?.wolt_order_reference_id;

    if (!deliveryJobId) {
      this.logger.warn('Wolt webhook payload missing delivery identifier', {
        keys: webhookData ? Object.keys(webhookData) : [],
        eventType: eventType || 'unknown',
      });
      return;
    }

    this.logger.log('Processing Wolt webhook event', {
      eventType: eventType || 'unknown',
      deliveryJobId,
      status: status || 'unknown',
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

    const quoteObj = this.getQuoteObject(delivery.quote);
    const lastEventId = typeof quoteObj.lastWebhookEventId === 'string' ? quoteObj.lastWebhookEventId : null;
    const lastStatus =
      typeof quoteObj.lastWebhookStatus === 'string'
        ? quoteObj.lastWebhookStatus.toUpperCase()
        : null;
    const lastTimestamp =
      typeof quoteObj.lastWebhookTimestamp === 'string' ? quoteObj.lastWebhookTimestamp : null;

    if (eventId && lastEventId && eventId === lastEventId) {
      this.logger.debug('Skipping duplicate Wolt webhook by eventId', {
        deliveryId: delivery.id,
        deliveryJobId,
        eventId,
      });
      return;
    }

    if (!eventId && status && lastStatus === status && lastTimestamp === eventTimestamp) {
      this.logger.debug('Skipping duplicate Wolt webhook by status+timestamp', {
        deliveryId: delivery.id,
        deliveryJobId,
        status,
        eventTimestamp,
      });
      return;
    }

    const quotePatch = this.buildWoltWebhookQuotePatch(
      webhookData,
      eventType,
      eventTimestamp,
      status,
      eventId,
    );
    const mappedStatus = status ? this.mapWoltStatus(status) : null;

    if (!mappedStatus) {
      this.logger.warn('Ignoring unknown Wolt webhook status/event', {
        deliveryId: delivery.id,
        deliveryJobId,
        eventType,
        status,
      });
      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          quote: {
            ...quoteObj,
            ...quotePatch,
          } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        status: mappedStatus.deliveryStatus,
        quote: {
          ...quoteObj,
          ...quotePatch,
        } as Prisma.InputJsonValue,
      },
    });

    await this.syncOrdersForWoltState(delivery.orders, mappedStatus);
  }

  private async reconcileStaleWoltDeliveries(): Promise<void> {
    const staleBefore = new Date(Date.now() - this.staleWindowMs);
    const staleDeliveries = await this.prisma.delivery.findMany({
      where: {
        provider: 'wolt',
        status: {
          in: [
            DeliveryStatus.PENDING,
            DeliveryStatus.COURIER_ASSIGNED,
            DeliveryStatus.PICKED_UP,
            DeliveryStatus.IN_TRANSIT,
          ],
        },
        updatedAt: { lte: staleBefore },
      },
      include: {
        orders: {
          select: { id: true, status: true, tenantId: true },
        },
        tenant: {
          select: { deliveryConfig: true, id: true },
        },
      },
      take: 50,
      orderBy: { updatedAt: 'asc' },
    });

    if (!staleDeliveries.length) {
      return;
    }

    for (const delivery of staleDeliveries) {
      try {
        const tenantDeliveryConfig = (delivery.tenant?.deliveryConfig as DeliveryConfig) || {};
        const woltConfig = tenantDeliveryConfig?.woltConfig || {};
        const apiKey = String(woltConfig.apiKey || '').trim();
        if (!apiKey || !delivery.jobId) {
          continue;
        }

        const quoteObj = this.getQuoteObject(delivery.quote);
        const snapshotConfig = this.getWoltApiConfigFromQuote(quoteObj);
        const statusConfig =
          snapshotConfig.venueId || snapshotConfig.apiUrl || snapshotConfig.merchantId
            ? snapshotConfig
            : woltConfig;

        const statusPayload = await this.woltDrive.getOrderStatus(apiKey, delivery.jobId, 2, statusConfig);
        const statusRaw = String(
          statusPayload?.status || statusPayload?.order?.status || statusPayload?.delivery?.status || '',
        ).toUpperCase();

        if (!statusRaw) {
          continue;
        }

        const mappedStatus = this.mapWoltStatus(statusRaw);
        const polledQuotePatch = {
          ...quoteObj,
          lastPolledStatus: statusRaw,
          lastPolledAt: new Date().toISOString(),
        } as Prisma.InputJsonValue;

        if (!mappedStatus) {
          this.logger.warn('[reconcileStaleWoltDeliveries] Ignoring unknown Wolt status', {
            deliveryId: delivery.id,
            jobId: delivery.jobId,
            statusRaw,
          });
          await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
              quote: polledQuotePatch,
            },
          });
          continue;
        }

        if (mappedStatus.deliveryStatus !== delivery.status) {
          await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
              status: mappedStatus.deliveryStatus,
              quote: polledQuotePatch,
            },
          });
        } else {
          await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
              quote: polledQuotePatch,
            },
          });
        }

        await this.syncOrdersForWoltState(delivery.orders, mappedStatus);
      } catch (error: any) {
        this.logger.warn('[reconcileStaleWoltDeliveries] Failed to reconcile delivery', {
          deliveryId: delivery.id,
          jobId: delivery.jobId,
          error: error?.message,
        });
      }
    }
  }
}

