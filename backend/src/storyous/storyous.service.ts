import { Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { SettingsService } from '../settings/settings.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoryousService {
  private readonly logger = new Logger(StoryousService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private readonly apiBaseUrl = 'https://api.storyous.com';

  constructor(private settingsService: SettingsService) {}

  private buildMerchantPlaceId(merchantId: string, placeId: string): string {
    const merchant = String(merchantId || '').trim();
    const place = String(placeId || '').trim();

    if (!merchant || !place) {
      throw new Error('Storyous merchantId/placeId missing');
    }

    if (merchant.includes('-') && merchant.endsWith(`-${place}`)) {
      return merchant;
    }

    return `${merchant}-${place}`;
  }

  private buildMerchantPlaceId(merchantId: string, placeId: string): string {
    const merchant = String(merchantId || '').trim();
    const place = String(placeId || '').trim();

    if (!merchant || !place) {
      throw new Error('Storyous merchantId/placeId missing');
    }

    // Already combined by admin input (merchant-place format)
    if (merchant.includes('-') && merchant.endsWith(`-${place}`)) {
      return merchant;
    }

    return `${merchant}-${place}`;
  }

  private async getConfig() {
    const dbConfig = await this.settingsService.getStoryousSettings();
    if (dbConfig?.clientId && dbConfig?.clientSecret) {
      return {
        clientId: dbConfig.clientId,
        clientSecret: dbConfig.clientSecret,
        enabled: dbConfig.enabled,
      };
    }

    return {
      clientId: process.env.STORYOUS_CLIENT_ID,
      clientSecret: process.env.STORYOUS_CLIENT_SECRET,
      enabled: process.env.STORYOUS_ENABLED === 'true',
    };
  }

  async getAccessToken(): Promise<string> {
    const config = await this.getConfig();
    if (!config.enabled || !config.clientId || !config.clientSecret) {
      throw new Error('Storyous is not configured');
    }

    if (this.accessToken && this.tokenExpiresAt) {
      const bufferTime = new Date(Date.now() + 5 * 60 * 1000);
      if (bufferTime < this.tokenExpiresAt) {
        return this.accessToken;
      }
    }

    const response = await fetch('https://login.storyous.com/api/auth/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Storyous token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(data.expires_at);

    this.logger.log('✅ Storyous access token obtained');
    return this.accessToken;
  }

  private getOrderReference(order: Order): string {
    return order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-6)}`;
  }

  private computeRequestedDeliveryAt(order: Order, defaultLeadMinutes: number): string {
    const now = new Date();
    const tenantTheme = (order as any)?.tenant?.theme as Record<string, any> | undefined;
    const woltQuote = (order as any)?.delivery?.quote as Record<string, any> | undefined;

    const prepMinutes = Number(
      tenantTheme?.prepMinutes ?? tenantTheme?.preparationMinutes ?? tenantTheme?.kitchenPrepMinutes,
    );
    const deliveryMinutes = Number(
      woltQuote?.deliveryEta ?? woltQuote?.etaMinutes ?? woltQuote?.courierEta,
    );

    let totalLead = defaultLeadMinutes;
    if (Number.isFinite(prepMinutes) && Number.isFinite(deliveryMinutes) && prepMinutes > 0 && deliveryMinutes > 0) {
      totalLead = prepMinutes + deliveryMinutes;
    }

    const deliveryAt = new Date(now.getTime() + totalLead * 60_000);
    return deliveryAt.toISOString();
  }

  async createOrder(order: Order, merchantId: string, placeId: string): Promise<any> {
    const config = await this.getConfig();
    if (!config.enabled) {
      this.logger.debug('Storyous integration disabled, skipping');
      return null;
    }

    const customer = order.customer as any;
    const address = order.address as any;

    if (!address?.street || !address?.city || !address?.postalCode) {
      throw new Error(`Storyous sync failed: missing delivery address for order ${order.id}`);
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new Error(`Storyous sync failed: order ${order.id} has no items`);
    }

    const settings = await this.settingsService.getStoryousSettings();
    const defaultLeadMinutes = settings?.defaultDeliveryLeadMinutes ?? 45;
    const requestedDeliveryAt = this.computeRequestedDeliveryAt(order, defaultLeadMinutes);
    const orderReference = this.getOrderReference(order);

    const isAlreadyPaid = String((order as any).paymentStatus || '').toLowerCase() !== 'pending';

    const items = order.items.map((item: any) => {
      const storyousItemId = item.storyousItemId || item.storyous_item_id || item.storyousId;
      if (!storyousItemId) {
        throw new Error(
          `Storyous mapping missing for product "${item.productName}" (${item.productId}) in tenant ${(order as any).tenantId} (order ${order.id})`,
        );
      }

      const itemData: any = {
        itemId: storyousItemId,
        name: item.productName,
        quantity: item.quantity,
        count: item.quantity,
        price: item.priceCents / 100,
        unitPriceWithVat: item.priceCents / 100,
      };

      const resolvedModifierLines = Array.isArray(item.resolvedModifierLines)
        ? item.resolvedModifierLines.filter((line: string) => typeof line === 'string' && line.trim().length > 0)
        : [];

      if (resolvedModifierLines.length > 0 && (settings?.receiptIncludeModifierLines ?? true)) {
        itemData.note = resolvedModifierLines.map((line: string) => `+${line}`).join('\n');
      }

      return itemData;
    });

    const orderData: any = {
      items,
      customer: {
        name: customer?.name,
        phoneNumber: customer?.phone,
        email: customer?.email || null,
        deliveryAddress: `${address.street}, ${address.city}, ${address.postalCode}`,
      },
      delivery_address: {
        street: address.street,
        city: address.city,
        postal_code: address.postalCode,
        country: address.country || 'SK',
        description: address.description || address.instructions || null,
      },
      total: order.totalCents / 100,
      subtotal: order.subtotalCents / 100,
      tax: order.taxCents / 100,
      delivery_fee: order.deliveryFeeCents / 100,
      deliveryFeeWithVat: order.deliveryFeeCents / 100,
      externalId: (settings?.receiptIncludeOrderNumber ?? true) ? orderReference : order.id,
      external_id: (settings?.receiptIncludeOrderNumber ?? true) ? orderReference : order.id,
      reference: orderReference,
      status: this.mapOrderStatus(order.status),
      deliveryType: 'delivery',
      timing: 'scheduled',
      requestedDeliveryAt,
      deliveryAt: requestedDeliveryAt,
      scheduledAt: requestedDeliveryAt,
      alreadyPaid: isAlreadyPaid,
      timezone: 'Europe/Bratislava',
      note: `${orderReference} | ${customer?.name || 'Customer'} | ${address.street}, ${address.city}`,
    };

    this.logger.log('[Storyous] Sending order', {
      orderId: order.id,
      tenantId: (order as any).tenantId,
      orderReference,
      itemsCount: items.length,
      requestedDeliveryAt,
      deliveryType: orderData.deliveryType,
      timing: orderData.timing,
    });

    const token = await this.getAccessToken();
    const merchantPlaceId = this.buildMerchantPlaceId(merchantId, placeId);
    const requestUrl = `${this.apiBaseUrl}/delivery/orders/${encodeURIComponent(merchantPlaceId)}`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('[Storyous] API error response', {
        orderId: order.id,
        status: response.status,
        body: error,
      });
      throw new Error(`Storyous API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const normalizedResult = {
      ...result,
      id: result?.id || result?.orderId || undefined,
    };

    this.logger.log(`✅ Order ${order.id} sent to Storyous: ${normalizedResult.id || 'success'}`);
    return normalizedResult;
  }

  async updateOrderStatus(storyousOrderId: string, status: OrderStatus): Promise<void> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return;
    }

    const token = await this.getAccessToken();
    const mappedStatus = this.mapOrderStatus(status);

    const response = await fetch(`${this.apiBaseUrl}/delivery/orders/${storyousOrderId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: mappedStatus }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Storyous status update error: ${error}`);
    }

    this.logger.log(`✅ Storyous order ${storyousOrderId} status updated to ${mappedStatus}`);
  }

  private buildDeliveryAddressParts(address: Record<string, any>): {
    street: string;
    streetNumber: string;
    city: string;
    country: string;
    countryCode: string;
    zip: string;
    latitude?: number;
    longitude?: number;
  } {
    const rawStreet = String(address?.street || '').trim();
    const rawHouseNumber = String(address?.houseNumber || '').trim();

    let street = rawStreet || 'Unknown street';
    let streetNumber = rawHouseNumber;

    if (!streetNumber && rawStreet) {
      const trailingNumberMatch = rawStreet.match(/^(.*?)[,\s]+(\d+[A-Za-z0-9/.-]*)$/);
      if (trailingNumberMatch) {
        street = trailingNumberMatch[1].trim() || street;
        streetNumber = trailingNumberMatch[2].trim();
      }
    }

    if (!streetNumber) {
      streetNumber = '1';
    }

    const country = String(address?.country || 'Slovakia').trim() || 'Slovakia';
    const countryCode = this.resolveCountryCode(country);
    const city = String(address?.city || '').trim() || 'Unknown city';
    const zip = String(address?.postalCode || '').trim() || '00000';

    const latitudeRaw = Number(address?.coordinates?.lat);
    const longitudeRaw = Number(address?.coordinates?.lng);

    return {
      street,
      streetNumber,
      city,
      country,
      countryCode,
      zip,
      ...(Number.isFinite(latitudeRaw) && Number.isFinite(longitudeRaw)
        ? { latitude: latitudeRaw, longitude: longitudeRaw }
        : {}),
    };
  }

  private resolveCountryCode(country: string): string {
    const normalized = country.trim().toLowerCase();
    if (!normalized) {
      return 'SK';
    }

    if (country.length === 2) {
      return country.toUpperCase();
    }

    const map: Record<string, string> = {
      slovakia: 'SK',
      slovensko: 'SK',
      czechia: 'CZ',
      'czech republic': 'CZ',
      cesko: 'CZ',
      'česko': 'CZ',
      hungary: 'HU',
      madarsko: 'HU',
      maďarsko: 'HU',
      austria: 'AT',
      rakusko: 'AT',
      rakúsko: 'AT',
    };

    return map[normalized] || 'SK';
  }

  private getExplicitStoryousItemId(item: Record<string, any>): string | undefined {
    const rawValue = item.storyousItemId ?? item.storyous_item_id ?? item.storyousId;
    if (rawValue === undefined || rawValue === null) {
      return undefined;
    }

    const normalized = String(rawValue).trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private async getStoryousItemIdsByProductName(order: Order): Promise<Map<string, string>> {
    const productNames = Array.from(
      new Set(order.items.map((item) => item.productName).filter((name) => !!name?.trim())),
    );
    if (!order.tenantId || productNames.length === 0) {
      return new Map<string, string>();
    }

    const mappings = await this.prisma.productMapping.findMany({
      where: {
        tenantId: order.tenantId,
        internalProductName: {
          in: productNames,
        },
      },
      select: {
        internalProductName: true,
        externalIdentifier: true,
        source: true,
        updatedAt: true,
      },
      // Important: when duplicates exist for the same internalProductName,
      // we want the latest mapping to win.
      orderBy: [{ updatedAt: 'desc' }],
    });

    const byProductName = new Map<string, string>();
    for (const productName of productNames) {
      const candidates = mappings.filter(
        (mapping) =>
          mapping.internalProductName === productName &&
          typeof mapping.externalIdentifier === 'string' &&
          mapping.externalIdentifier.trim().length > 0,
      );

      if (candidates.length === 0) {
        continue;
      }

      const preferredMapping =
        candidates.find((mapping) => mapping.source?.trim().toLowerCase() === 'storyous') ||
        candidates.find((mapping) => !mapping.source);

      if (!preferredMapping) {
        continue;
      }

      const storyousCandidatesCount = candidates.filter(
        (mapping) => mapping.source?.trim().toLowerCase() === 'storyous',
      ).length;
      if (storyousCandidatesCount > 1) {
        this.logger.warn('[Storyous] Duplicate storyous mappings found; using latest updated mapping', {
          tenantId: order.tenantId,
          productName,
          chosenExternalIdentifier: preferredMapping.externalIdentifier,
          candidates: candidates.map((mapping) => ({
            externalIdentifier: mapping.externalIdentifier,
            source: mapping.source,
            updatedAt: mapping.updatedAt,
          })),
        });
      }

      byProductName.set(productName, preferredMapping.externalIdentifier.trim());
    }

    return byProductName;
  }

  private mapOrderStatus(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      PENDING: 'pending',
      PAID: 'paid',
      PREPARING: 'preparing',
      READY: 'ready',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered',
      CANCELED: 'cancelled',
    };
    return statusMap[status] || 'pending';
  }
}
