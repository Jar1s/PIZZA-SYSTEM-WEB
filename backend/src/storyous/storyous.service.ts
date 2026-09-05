import { Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus } from '@pizza-ecosystem/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { buildStoryousModifierSelections, StoryousModifierSelection } from './storyous-modifier.util';

export interface StoryousReceiptPreviewItem {
  quantity: number;
  name: string;
  modifierLines: string[];
}

export interface StoryousReceiptPreview {
  printedTime: string;
  printedDate: string;
  title: string | null;
  orderReference: string;
  website: string;
  noteLines: string[];
  customerName: string;
  customerDetailLines: string[];
  items: StoryousReceiptPreviewItem[];
  warnings: string[];
}

export type StoryousDeliveryOrderState =
  | 'NEW'
  | 'SCHEDULING_DELIVERY'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELED'
  | 'VERIFICATION_FAILED';

export interface StoryousCreateOrderResult {
  id?: string;
  storyousState?: StoryousDeliveryOrderState | null;
  autoConfirmRequested: boolean;
  requiresManualAcceptance: boolean;
  verificationFailed: boolean;
  warnings?: string[];
  raw: Record<string, any>;
}

export interface StoryousCatalogAddition {
  additionId: string;
  title: string;
  additionCategoryId?: string;
  categoryTitle?: string;
}

@Injectable()
export class StoryousService {
  private readonly logger = new Logger(StoryousService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private readonly apiBaseUrl = 'https://api.storyous.com';

  constructor(
    private settingsService: SettingsService,
    private prisma: PrismaService,
  ) {}

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

  async getMenuAdditions(merchantId: string, placeId: string): Promise<StoryousCatalogAddition[]> {
    const token = await this.getAccessToken();
    const query = new URLSearchParams({
      placeId: String(placeId || '').trim(),
      depth: '-1',
    });

    const response = await fetch(
      `${this.apiBaseUrl}/menu/${encodeURIComponent(String(merchantId || '').trim())}?${query.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      throw new Error(error || 'Failed to fetch Storyous menu additions');
    }

    const payload = await response.json();
    const additionCategories = Array.isArray(payload?.additionCategories) ? payload.additionCategories : [];
    const additions: StoryousCatalogAddition[] = [];

    for (const category of additionCategories) {
      const categoryTitle = String(category?.title || '').trim();
      const additionCategoryId = String(category?.additionCategoryId || '').trim();
      const items = Array.isArray(category?.additions) ? category.additions : [];

      for (const item of items) {
        const additionId = String(item?.additionId || '').trim();
        const title = String(item?.title || '').trim();
        if (!additionId || !title) continue;

        additions.push({
          additionId,
          title,
          additionCategoryId: additionCategoryId || undefined,
          categoryTitle: categoryTitle || undefined,
        });
      }
    }

    return additions;
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

  private getOrderSourceWebsite(order: Order): string {
    const tenant = (order as any)?.tenant as Record<string, any> | undefined;
    const rawDomain = String(tenant?.domain || '').trim();
    if (rawDomain) {
      return rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    }

    const rawSource = String((order as any)?.source || '').trim();
    if (rawSource) {
      return rawSource.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    }

    const rawSlug = String(tenant?.slug || tenant?.subdomain || '').trim();
    if (rawSlug) {
      return rawSlug;
    }

    return 'unknown';
  }

  private normalizeStoryousState(value: unknown): StoryousDeliveryOrderState | null {
    const normalized = String(value || '').trim().toUpperCase();
    if (
      normalized === 'NEW' ||
      normalized === 'SCHEDULING_DELIVERY' ||
      normalized === 'CONFIRMED' ||
      normalized === 'DECLINED' ||
      normalized === 'DISPATCHED' ||
      normalized === 'DELIVERED' ||
      normalized === 'VERIFICATION_FAILED'
    ) {
      return normalized as StoryousDeliveryOrderState;
    }

    if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
      return 'CANCELED';
    }

    return null;
  }

  private isAcceptedStoryousState(state: StoryousDeliveryOrderState | null | undefined): boolean {
    return state === 'CONFIRMED' || state === 'SCHEDULING_DELIVERY' || state === 'DISPATCHED';
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getDeliveryOrderStatus(
    token: string,
    merchantPlaceId: string,
    orderId: string,
  ): Promise<{ orderId?: string; state: StoryousDeliveryOrderState | null; raw: Record<string, any> }> {
    const response = await fetch(
      `${this.apiBaseUrl}/delivery/orders/${encodeURIComponent(merchantPlaceId)}/${encodeURIComponent(orderId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Storyous order verification error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return {
      orderId: result?.orderId || result?.id || undefined,
      state: this.normalizeStoryousState(result?.state),
      raw: result as Record<string, any>,
    };
  }

  private async verifyDeliveryOrderState(
    token: string,
    merchantPlaceId: string,
    orderId: string,
    initialState: StoryousDeliveryOrderState | null,
    autoConfirmRequested: boolean,
  ): Promise<StoryousDeliveryOrderState> {
    let currentState = initialState;

    if (this.isAcceptedStoryousState(currentState) || currentState === 'DECLINED') {
      return currentState;
    }

    const attempts = autoConfirmRequested ? 3 : 1;
    const retryDelaysMs = [750, 1500];

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (attempt > 0) {
        await this.sleep(retryDelaysMs[Math.min(attempt - 1, retryDelaysMs.length - 1)]);
      }

      try {
        const statusResult = await this.getDeliveryOrderStatus(token, merchantPlaceId, orderId);
        currentState = statusResult.state;

        if (this.isAcceptedStoryousState(currentState) || currentState === 'DECLINED') {
          return currentState;
        }
      } catch (error: any) {
        this.logger.error('[Storyous] Failed to verify Storyous order state', {
          orderId,
          merchantPlaceId,
          error: error?.message || String(error),
        });
        return 'VERIFICATION_FAILED';
      }
    }

    return currentState || 'VERIFICATION_FAILED';
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

  private formatPreviewTime(value: Date | string): string {
    const parsed = value instanceof Date ? value : new Date(value);
    return parsed.toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatPreviewDate(value: Date | string): string {
    const parsed = value instanceof Date ? value : new Date(value);
    return parsed.toLocaleDateString('sk-SK');
  }

  private getPaymentReceiptLabel(order: Order): string {
    const paymentStatus = String((order as any)?.paymentStatus || '').toLowerCase();
    return paymentStatus === 'pending' ? 'pri prevzatí' : 'platené vopred';
  }

  private buildCustomerReceiptLines(order: Order, requestedDeliveryAt: string): string[] {
    const customer = (order.customer || {}) as Record<string, any>;
    const address = (order.address || {}) as Record<string, any>;
    const lines: string[] = [];

    if (customer?.name) {
      lines.push(String(customer.name));
    }

    const streetParts = [address?.street, address?.houseNumber].filter(Boolean);
    if (streetParts.length > 0) {
      lines.push(streetParts.join(' '));
    }

    const cityParts = [address?.city, address?.postalCode].filter(Boolean);
    if (cityParts.length > 0) {
      lines.push(cityParts.join(', '));
    }

    if (customer?.phone) {
      lines.push(String(customer.phone));
    }

    lines.push(`Spôsob platby: ${this.getPaymentReceiptLabel(order)}`);
    lines.push(`Požadované vyzdvihnutie kuriérom: v ${this.formatPreviewTime(requestedDeliveryAt)}`);

    return lines;
  }

  private normalizeReceiptNoteLine(value: string): string {
    return String(value || '')
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async getModifierMappingsByOptionId(tenantId: string): Promise<
    Map<string, { externalAdditionId: string; labelOverride: string | null }>
  > {
    if (!tenantId) {
      return new Map();
    }

    const mappings = await this.prisma.storyousModifierMapping.findMany({
      where: { tenantId },
      select: {
        optionId: true,
        externalAdditionId: true,
        labelOverride: true,
      },
    });

    return new Map(
      mappings.map((mapping) => [
        mapping.optionId,
        {
          externalAdditionId: mapping.externalAdditionId,
          labelOverride: mapping.labelOverride ?? null,
        },
      ]),
    );
  }

  private async enrichOrderForStoryous(order: Order): Promise<Order> {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return order;
    }

    const needsEnrichment = order.items.some((item: any) => !item?.storyousItemId);
    const tenantId = String((order as any)?.tenantId || '');

    const products = needsEnrichment && order.items.some((item: any) => !!item?.productId)
      ? await this.prisma.product.findMany({
          where: {
            id: {
              in: order.items
                .map((item: any) => item?.productId)
                .filter((productId: any): productId is string => !!productId),
            },
          },
          select: {
            id: true,
            name: true,
            category: true,
          },
        })
      : [];

    const productById = new Map(products.map((product) => [product.id, product]));
    const internalNames = needsEnrichment
      ? Array.from(
          new Set(
            order.items
              .map((item: any) => productById.get(item.productId)?.name || item.productName)
              .filter((name): name is string => !!name),
          ),
        )
      : [];

    const mappings = needsEnrichment && tenantId && internalNames.length > 0
      ? await this.prisma.productMapping.findMany({
          where: {
            tenantId,
            source: 'storyous',
            internalProductName: { in: internalNames },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        })
      : [];

    const mappingByInternalName = new Map<string, (typeof mappings)[number]>();
    for (const mapping of mappings) {
      if (!mappingByInternalName.has(mapping.internalProductName)) {
        mappingByInternalName.set(mapping.internalProductName, mapping);
      }
    }

    const tenantTheme = (order as any)?.tenant?.theme;
    const enrichedItems = order.items.map((item: any) => {
      const product = productById.get(item.productId);
      const internalProductName = product?.name || item.productName;
      const mapping = internalProductName ? mappingByInternalName.get(internalProductName) : undefined;
      const storyousItemId = item.storyousItemId || item.storyous_item_id || item.storyousId || mapping?.externalIdentifier;

      if (!storyousItemId) {
        throw new Error(
          `Storyous mapping missing for product "${internalProductName || item.productName}" (${item.productId}) in tenant ${tenantId} (order ${order.id})`,
        );
      }

      const storyousModifierSelections = Array.isArray(item.storyousModifierSelections)
        ? item.storyousModifierSelections
        : buildStoryousModifierSelections(
            item.modifiers as any,
            product?.category || 'PIZZA',
            tenantTheme,
          );

      const resolvedModifierLines = Array.isArray(item.resolvedModifierLines)
        ? item.resolvedModifierLines
        : storyousModifierSelections.map((selection) => selection.receiptLabel);

      return {
        ...item,
        productName: item.productName || internalProductName,
        storyousItemId,
        storyousModifierSelections,
        resolvedModifierLines,
      };
    });

    return {
      ...order,
      items: enrichedItems,
    } as Order;
  }

  private async buildStoryousOrderData(order: Order): Promise<{
    orderData: any;
    preview: StoryousReceiptPreview;
    warnings: string[];
  }> {
    const enrichedOrder = await this.enrichOrderForStoryous(order);
    const customer = order.customer as any;
    const address = order.address as any;

    if (!address?.street || !address?.city || !address?.postalCode) {
      throw new Error(`Storyous sync failed: missing delivery address for order ${order.id}`);
    }

    if (!Array.isArray(enrichedOrder.items) || enrichedOrder.items.length === 0) {
      throw new Error(`Storyous sync failed: order ${order.id} has no items`);
    }

    const settings = await this.settingsService.getStoryousSettings();
    const defaultLeadMinutes = settings?.defaultDeliveryLeadMinutes ?? 45;
    const requestedDeliveryAt = this.computeRequestedDeliveryAt(order, defaultLeadMinutes);
    const requestedPickupTime = requestedDeliveryAt;
    const orderReference = this.getOrderReference(order);
    const orderSourceWebsite = this.getOrderSourceWebsite(order);
    const isAlreadyPaid = String((order as any).paymentStatus || '').toLowerCase() !== 'pending';
    const receiptIncludeModifierLines = settings?.receiptIncludeModifierLines ?? true;
    const modifierMappingsByOptionId = await this.getModifierMappingsByOptionId(
      String((order as any)?.tenantId || ''),
    );
    const warnings = new Set<string>();

    const previewItems: StoryousReceiptPreviewItem[] = [];
    const items = enrichedOrder.items.map((item: any) => {
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

      const previewModifierLines: string[] = [];
      const resolvedModifierLines = Array.isArray(item.resolvedModifierLines)
        ? item.resolvedModifierLines.filter((line: string) => typeof line === 'string' && line.trim().length > 0)
        : [];
      const modifierSelections = Array.isArray(item.storyousModifierSelections)
        ? item.storyousModifierSelections.filter(
            (selection: StoryousModifierSelection) =>
              selection &&
              typeof selection.optionId === 'string' &&
              typeof selection.receiptLabel === 'string',
          )
        : [];

      if (receiptIncludeModifierLines && modifierSelections.length > 0) {
        const additions = [];
        const fallbackLines: string[] = [];

        for (const selection of modifierSelections) {
          const mapping = modifierMappingsByOptionId.get(selection.optionId);
          const previewLabel = this.normalizeReceiptNoteLine(
            mapping?.labelOverride || selection.receiptLabel,
          );

          if (mapping?.externalAdditionId) {
            additions.push({
              additionId: mapping.externalAdditionId,
              countPerMainItem: 1,
              unitPriceWithVat: 0,
            });
            if (previewLabel) {
              previewModifierLines.push(`+${previewLabel}`);
            }
            continue;
          }

          const fallbackLine = this.normalizeReceiptNoteLine(selection.receiptLabel);
          if (!fallbackLine) continue;

          fallbackLines.push(fallbackLine);
          previewModifierLines.push(`+${fallbackLine}`);
          warnings.add(
            `Modifier "${fallbackLine}" (${selection.optionId}) nema Storyous addition mapping, preto ostava vo fallback note.`,
          );
        }

        if (additions.length > 0) {
          itemData.additions = additions;
        }

        if (fallbackLines.length > 0) {
          itemData.note = fallbackLines.map((line: string) => `+${line}`).join('\n');
        }
      }

      if (
        previewModifierLines.length === 0 &&
        resolvedModifierLines.length > 0 &&
        receiptIncludeModifierLines
      ) {
        const normalizedModifierLines = resolvedModifierLines
          .map((line: string) => this.normalizeReceiptNoteLine(line))
          .filter((line: string) => line.length > 0);

        if (normalizedModifierLines.length > 0) {
          itemData.note = normalizedModifierLines.map((line: string) => `+${line}`).join('\n');
          previewModifierLines.push(...normalizedModifierLines.map((line: string) => `+${line}`));
          warnings.add(
            `Item "${item.productName}" pouziva legacy fallback note pre Storyous modifiery, lebo neobsahuje optionId selections.`,
          );
        }
      }

      previewItems.push({
        quantity: Number(item.quantity) || 1,
        name: String(item.productName || item.name || ''),
        modifierLines: previewModifierLines,
      });

      return itemData;
    });

    const orderNote = `${orderReference}\nWeb: ${orderSourceWebsite}`;

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
      ...(settings?.autoAcceptPrintMode ? { autoConfirm: true } : {}),
      externalId: (settings?.receiptIncludeOrderNumber ?? true) ? orderReference : order.id,
      external_id: (settings?.receiptIncludeOrderNumber ?? true) ? orderReference : order.id,
      reference: orderReference,
      status: this.mapOrderStatus(order.status),
      deliveryType: 'delivery',
      timing: {
        asSoonAsPossible: false,
        requestedPickupTime,
        requestedDeliveryTime: requestedDeliveryAt,
        at: requestedDeliveryAt,
      },
      requestedPickupTime,
      requestedDeliveryTime: requestedDeliveryAt,
      requestedDeliveryAt,
      deliveryAt: requestedDeliveryAt,
      scheduledAt: requestedDeliveryAt,
      alreadyPaid: isAlreadyPaid,
      timezone: 'Europe/Bratislava',
      note: orderNote,
    };

    const now = new Date();
    const preview: StoryousReceiptPreview = {
      printedTime: this.formatPreviewTime(now),
      printedDate: this.formatPreviewDate(now),
      title: order.status === OrderStatus.CANCELED ? 'STORNO' : null,
      orderReference,
      website: orderSourceWebsite,
      noteLines: orderNote.split('\n').filter(Boolean),
      customerName: String(customer?.name || ''),
      customerDetailLines: this.buildCustomerReceiptLines(order, requestedDeliveryAt),
      items: previewItems,
      warnings: Array.from(warnings),
    };

    return {
      orderData,
      preview,
      warnings: Array.from(warnings),
    };
  }

  async getReceiptPreview(order: Order): Promise<StoryousReceiptPreview> {
    const { preview } = await this.buildStoryousOrderData(order);
    return preview;
  }

  async createOrder(order: Order, merchantId: string, placeId: string): Promise<StoryousCreateOrderResult | null> {
    const config = await this.getConfig();
    if (!config.enabled) {
      this.logger.debug('Storyous integration disabled, skipping');
      return null;
    }

    const readiness = await this.settingsService.getStoryousAutoPrintReadiness();
    if (!readiness.ready || readiness.warnings.length > 0) {
      this.logger.warn('[Storyous] Auto-confirm readiness is not fully green', {
        orderId: order.id,
        ready: readiness.ready,
        blockers: readiness.blockers,
        warnings: readiness.warnings,
      });
    }
    const { orderData, warnings } = await this.buildStoryousOrderData(order);

    this.logger.log('[Storyous] Sending order', {
      orderId: order.id,
      tenantId: (order as any).tenantId,
      orderReference: this.getOrderReference(order),
      itemsCount: orderData.items.length,
      requestedDeliveryAt: orderData.requestedDeliveryAt,
      requestedPickupTime: orderData.requestedPickupTime,
      orderSourceWebsite: this.getOrderSourceWebsite(order),
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
    const autoConfirmRequested = Boolean(orderData.autoConfirm);
    let storyousState = this.normalizeStoryousState(normalizedResult?.state);

    if (normalizedResult.id) {
      storyousState = await this.verifyDeliveryOrderState(
        token,
        merchantPlaceId,
        normalizedResult.id,
        storyousState,
        autoConfirmRequested,
      );
    }

    const createResult: StoryousCreateOrderResult = {
      id: normalizedResult.id,
      storyousState,
      autoConfirmRequested,
      requiresManualAcceptance: storyousState === 'NEW',
      verificationFailed: storyousState === 'VERIFICATION_FAILED',
      warnings,
      raw: normalizedResult,
    };

    if (this.isAcceptedStoryousState(storyousState)) {
      this.logger.log(`✅ Order ${order.id} sent to Storyous and confirmed: ${normalizedResult.id || 'success'}`);
    } else if (storyousState === 'NEW') {
      this.logger.warn('[Storyous] Order created but still requires manual acceptance', {
        orderId: order.id,
        storyousOrderId: normalizedResult.id,
        autoConfirmRequested,
      });
    } else if (storyousState === 'DECLINED') {
      this.logger.error('[Storyous] Order was declined by Storyous during verification', {
        orderId: order.id,
        storyousOrderId: normalizedResult.id,
      });
    } else if (storyousState === 'VERIFICATION_FAILED') {
      this.logger.error('[Storyous] Order created but confirmation could not be verified', {
        orderId: order.id,
        storyousOrderId: normalizedResult.id,
        autoConfirmRequested,
      });
    } else {
      this.logger.log(`✅ Order ${order.id} sent to Storyous: ${normalizedResult.id || 'success'}`);
    }

    return createResult;
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

  async getOrderState(
    storyousOrderId: string,
    merchantId: string,
    placeId: string,
  ): Promise<StoryousDeliveryOrderState | null> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return null;
    }

    const token = await this.getAccessToken();
    const merchantPlaceId = this.buildMerchantPlaceId(merchantId, placeId);
    const result = await this.getDeliveryOrderStatus(token, merchantPlaceId, storyousOrderId);
    return result.state;
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
