import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole, Order as PrismaOrder } from '@prisma/client';
import { Order, OrderStatus, CustomerInfo, Address, calculateModifierPrice as calculateModifierPriceShared } from '@pizza-ecosystem/shared';
import { CreateOrderDto } from './dto';
import { EmailService } from '../email/email.service';
import {
  StoryousReceiptPreview,
  StoryousService,
} from '../storyous/storyous.service';
import { buildStoryousModifierSelections } from '../storyous/storyous-modifier.util';
import { SettingsService } from '../settings/settings.service';
import { ProductMappingService } from '../products/product-mapping.service';
import { DeliveryFeeTierService } from '../delivery/delivery-fee-tier.service';
import { OrderNumberService } from './order-number.service';
import { TenantTheme } from '../types/tenant.types';
import { appConfig } from '../config/app.config';
import { OrderResponseSchema } from '../common/schemas/order.schema';
import { getProductDisplayName } from '../utils/product-name-mapper';
import * as crypto from 'crypto';

// Type definitions for Prisma JSON fields
type UserWithPasswordReset = User & {
  passwordResetToken?: string | null;
};

type StoryousSyncResult = {
  success: boolean;
  storyousOrderId?: string;
  storyousState?: string | null;
  message: string;
  warnings?: string[];
};

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true;
    tenant: {
      select: {
        id: true;
        name: true;
        slug: true;
        domain: true;
        subdomain: true;
        currency: true;
      };
    };
  };
}>;

const isStoryousAcceptedState = (state: string | null | undefined): boolean =>
  state === 'CONFIRMED' || state === 'SCHEDULING_DELIVERY' || state === 'DISPATCHED';

const buildStoryousSyncMessage = (
  state: string | null | undefined,
  storyousOrderId?: string,
): string => {
  if (isStoryousAcceptedState(state)) {
    return `Order confirmed in Storyous successfully (${storyousOrderId || 'ID neznáme'})`;
  }
  if (state === 'NEW') {
    return 'Storyous order was created, but it still requires manual acceptance in Storyous.';
  }
  if (state === 'DECLINED') {
    return 'Storyous order was declined and will not continue without intervention.';
  }
  if (state === 'VERIFICATION_FAILED') {
    return 'Storyous order was created, but confirmation could not be verified.';
  }
  if (storyousOrderId) {
    return `Storyous order exists (${storyousOrderId}), but its acceptance state is unknown.`;
  }
  return 'Storyous API did not return order ID';
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    delivery: true;
  };
}>;

type ProductWithModifiers = Prisma.ProductGetPayload<{
  select: {
    id: true;
    name: true;
    priceCents: true;
    modifiers: true;
  };
}>;

type StoryousSyncOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    tenant: true;
    delivery: true;
  };
}>;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  private getPrismaErrorMetaTarget(error: unknown): string[] {
    const target = (error as any)?.meta?.target;
    if (!Array.isArray(target)) {
      return [];
    }

    return target.map((entry) => String(entry));
  }

  private isPrismaKnownRequestError(error: unknown, code: string): boolean {
    return typeof (error as any)?.code === 'string' && (error as any).code === code;
  }

  private isUniqueConstraintErrorForFields(error: unknown, fields: string[]): boolean {
    if (!this.isPrismaKnownRequestError(error, 'P2002')) {
      return false;
    }

    const targetFields = this.getPrismaErrorMetaTarget(error);
    return fields.every((field) => targetFields.includes(field));
  }

  private async getExistingOrderByClientRequestId(
    tenantId: string,
    clientRequestId?: string | null,
  ): Promise<Order | null> {
    const normalizedClientRequestId = clientRequestId?.trim();
    if (!normalizedClientRequestId) {
      return null;
    }

    const existingOrder = await this.prisma.order.findFirst({
      where: {
        tenantId,
        clientRequestId: normalizedClientRequestId,
      } as any,
      select: {
        id: true,
      },
    });

    if (!existingOrder) {
      return null;
    }

    return this.getOrderById(existingOrder.id);
  }

  private async buildCreateOrderResponse(
    order: any,
    tenantId: string,
    shouldReturnAuthToken: boolean,
    createdUser: UserWithPasswordReset | null,
  ): Promise<Order | { order: Order; authToken?: string; refreshToken?: string; user?: any }> {
    let validatedOrder: Order;
    try {
      validatedOrder = OrderResponseSchema.parse(order) as unknown as Order;
    } catch (error) {
      this.logger.error(`Order response validation failed`, { error, orderId: order?.id, tenantId });
      validatedOrder = order as unknown as Order;
    }

    if (shouldReturnAuthToken && createdUser) {
      const payload = {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      };

      const access_token = this.jwtService.sign(payload);
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.refreshToken.deleteMany({
        where: {
          userId: createdUser.id,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      await this.prisma.refreshToken.create({
        data: {
          userId: createdUser.id,
          token: refreshToken,
          expiresAt,
        },
      });

      return {
        order: validatedOrder,
        authToken: access_token,
        refreshToken,
        user: {
          id: createdUser.id,
          email: createdUser.email || '',
          name: createdUser.name,
          phone: createdUser.phone || undefined,
          role: createdUser.role,
        },
      };
    }

    return validatedOrder;
  }

  private collectUniqueProductIds(rawProductIds: unknown[]): string[] {
    return [
      ...new Set(
        rawProductIds
          .filter((productId): productId is string => typeof productId === 'string')
          .map((productId) => productId.trim())
          .filter((productId) => productId.length > 0),
      ),
    ];
  }
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private storyousService: StoryousService,
    private settingsService: SettingsService,
    private productMappingService: ProductMappingService,
    private deliveryFeeTierService: DeliveryFeeTierService,
    private orderNumberService: OrderNumberService,
    private jwtService: JwtService,
  ) {}

  private isStatusHistoryUnavailable(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('order_status_history') ||
      message.includes('statusHistory') ||
      message.includes('orderStatusHistory')
    );
  }

  private normalizeCoordinates(
    coordinates?: { lat?: number | null; lng?: number | null } | null,
  ): { lat: number; lng: number } | undefined {
    if (coordinates?.lat == null || coordinates?.lng == null) {
      return undefined;
    }

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return undefined;
    }

    return { lat, lng };
  }

  private async persistSavedAddressCoordinates(
    addressId: string,
    coordinates: { lat: number; lng: number },
  ): Promise<void> {
    await (this.prisma as any).address.update({
      where: { id: addressId },
      data: {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      },
    });
  }

  private async resolveOrderAddressForCreation(
    userId: string | undefined,
    data: CreateOrderDto,
  ): Promise<CreateOrderDto['address']> {
    const normalizedInputCoordinates = this.normalizeCoordinates((data.address as any)?.coordinates);
    const resolvedAddress: CreateOrderDto['address'] = {
      ...data.address,
      country: data.address.country || 'SK',
      ...(normalizedInputCoordinates ? { coordinates: normalizedInputCoordinates } : {}),
    };

    const addressId = typeof data.addressId === 'string' ? data.addressId.trim() : '';
    if (!userId || !addressId) {
      return resolvedAddress;
    }

    try {
      const savedAddress = await (this.prisma as any).address.findFirst({
        where: {
          id: addressId,
          userId,
        },
        select: {
          id: true,
          street: true,
          description: true,
          city: true,
          postalCode: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!savedAddress) {
        this.logger.warn('Saved customer address not found during order creation fallback', {
          userId,
          addressId,
        });
        return resolvedAddress;
      }

      const savedCoordinates = this.normalizeCoordinates({
        lat: savedAddress.latitude,
        lng: savedAddress.longitude,
      });

      const canonicalAddress: CreateOrderDto['address'] = {
        ...resolvedAddress,
        street: savedAddress.street || resolvedAddress.street,
        city: savedAddress.city || resolvedAddress.city,
        postalCode: savedAddress.postalCode || resolvedAddress.postalCode,
        country: savedAddress.country || resolvedAddress.country || 'SK',
        instructions: resolvedAddress.instructions || savedAddress.description || undefined,
        ...(savedCoordinates
          ? { coordinates: savedCoordinates }
          : normalizedInputCoordinates
            ? { coordinates: normalizedInputCoordinates }
            : {}),
      };

      if (!savedCoordinates && normalizedInputCoordinates) {
        try {
          await this.persistSavedAddressCoordinates(savedAddress.id, normalizedInputCoordinates);
          this.logger.log('Persisted checkout coordinates to saved customer address', {
            userId,
            addressId: savedAddress.id,
          });
        } catch (persistError) {
          this.logger.warn('Failed to persist checkout coordinates to saved customer address', {
            userId,
            addressId: savedAddress.id,
            error: persistError instanceof Error ? persistError.message : String(persistError),
          });
        }
        return canonicalAddress;
      }

      if (!savedCoordinates && !normalizedInputCoordinates) {
        try {
          const geocoded = await this.deliveryFeeTierService.geocodeAddress({
            street: canonicalAddress.street,
            city: canonicalAddress.city,
            postalCode: canonicalAddress.postalCode,
            country: canonicalAddress.country || 'SK',
          });

          const geocodedCoordinates = {
            lat: geocoded.lat,
            lng: geocoded.lng,
          };

          canonicalAddress.coordinates = geocodedCoordinates;
          await this.persistSavedAddressCoordinates(savedAddress.id, geocodedCoordinates);

          this.logger.log('Backfilled saved customer address coordinates during order creation', {
            userId,
            addressId: savedAddress.id,
          });
        } catch (geocodeError) {
          this.logger.warn('Unable to backfill saved customer address coordinates during order creation', {
            userId,
            addressId: savedAddress.id,
            error: geocodeError instanceof Error ? geocodeError.message : String(geocodeError),
          });
        }
      }

      return canonicalAddress;
    } catch (error) {
      this.logger.warn('Saved address fallback failed during order creation', {
        userId,
        addressId,
        error: error instanceof Error ? error.message : String(error),
      });
      return resolvedAddress;
    }
  }

  async createOrder(tenantId: string, data: CreateOrderDto): Promise<Order | { order: Order; authToken?: string; refreshToken?: string; user?: any }> {
    // Log incoming data to see what we receive
    this.logger.log('createOrder called', {
      tenantId,
      itemsCount: data.items?.length,
      items: data.items?.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        modifiers: item.modifiers,
        modifiersType: typeof item.modifiers,
        modifiersKeys: item.modifiers ? Object.keys(item.modifiers) : [],
        modifiersStringified: JSON.stringify(item.modifiers),
        modifiersIsNull: item.modifiers === null,
        modifiersIsUndefined: item.modifiers === undefined,
        modifiersIsEmpty: item.modifiers ? Object.keys(item.modifiers).length === 0 : true,
      })),
    });
    let userId = data.userId;
    let shouldReturnAuthToken = false;
    let createdUser: UserWithPasswordReset | null = null;

    // Guest checkout logic: Handle user creation/authentication
    // If paymentMethod exists (cash on delivery) → mandatory registration
    // If saveAccount === true (online payment) → optional registration
    if (data.paymentMethod || (data.saveAccount && !userId)) {
      const normalizedEmail = data.customer.email.toLowerCase().trim();
      
      // Find existing user by email scoped to tenant
      let user = await this.prisma.user.findFirst({
        where: { email: normalizedEmail, tenantId, role: UserRole.CUSTOMER },
      });

      if (!user) {
        // Generate password reset token for account setup
        const passwordResetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date();
        passwordResetExpires.setDate(passwordResetExpires.getDate() + 7); // 7 days validity
        
        // Create new user (without password - user will set it later)
        user = await this.prisma.user.create({
          data: {
            tenantId,
            name: data.customer.name,
            email: normalizedEmail,
            phone: data.customer.phone || null,
            phoneVerified: false, // SMS verification disabled
            role: UserRole.CUSTOMER,
            password: null, // User will set password later
            isActive: true,
            passwordResetToken: passwordResetToken,
            passwordResetExpires: passwordResetExpires,
          },
        });
        this.logger.log(`Created new user for guest checkout: ${user.id}`, { userId: user.id, email: data.customer.email, tenantId });
        
        // Store password reset token for email sending later
        createdUser = { ...user, passwordResetToken } as UserWithPasswordReset;
      } else {
        // Email exists → automatically log in
        shouldReturnAuthToken = true;
        this.logger.log(`Auto-login for existing user: ${user.id}`, { userId: user.id, email: data.customer.email, tenantId });
        createdUser = user as UserWithPasswordReset;
      }

      userId = user.id;
    }

    const existingOrder = await this.getExistingOrderByClientRequestId(
      tenantId,
      data.clientRequestId,
    );
    if (existingOrder) {
      this.logger.warn('Duplicate checkout request returned existing order before create', {
        tenantId,
        clientRequestId: data.clientRequestId,
        orderId: existingOrder.id,
      });
      return this.buildCreateOrderResponse(existingOrder, tenantId, shouldReturnAuthToken, createdUser);
    }

    const resolvedAddress = await this.resolveOrderAddressForCreation(userId, data);

    // Resolve products - podporuje productId alebo externalProductIdentifier
    const products = await Promise.all(
      data.items.map(async (item) => {
        let product;
        
        if (item.productId) {
          // Pôvodný spôsob - podľa ID
          product = await this.prisma.product.findFirst({
            where: {
              id: item.productId,
              tenantId,
              isActive: true,
            },
          });
        } else if (item.externalProductIdentifier) {
          // Nový spôsob - konvertujeme externý identifikátor na interný názov
          const internalName = await this.productMappingService.resolveToInternalName(
            tenantId,
            item.externalProductIdentifier,
            item.source
          );
          
          // Nájdeme produkt podľa interného názvu
          product = await this.prisma.product.findFirst({
            where: {
              tenantId,
              name: internalName,
              isActive: true,
            },
          });
        } else {
          throw new BadRequestException(
            'Item must have productId or externalProductIdentifier'
          );
        }

        if (!product) {
          throw new BadRequestException(
            `Product not found for item: ${JSON.stringify(item)}`
          );
        }

        return { product, item };
      })
    );

    // Validate all products found
    if (products.length !== data.items.length) {
      throw new BadRequestException('Some products not found or inactive');
    }

    // Type definitions for modifiers
    interface ModifierOption {
      id: string;
      name: string;
      priceCents: number;
    }
    
    interface ProductModifier {
      id: string;
      name: string;
      type: 'single' | 'multiple';
      required: boolean;
      options: ModifierOption[];
    }
    
    type ModifiersRecord = Record<string, string[]>;

    // Validate modifiers for all items before calculating prices
    products.forEach(({ product, item }, index) => {
      if (item.modifiers && product.modifiers) {
        const productModifiers = product.modifiers as ProductModifier[];
        const selectedModifiers = item.modifiers as ModifiersRecord;
        
        // Validate modifier structure
        if (!Array.isArray(productModifiers)) {
          throw new BadRequestException(
            `Invalid product modifiers structure for item ${index + 1} (product: ${product.name})`
          );
        }
        
        if (typeof selectedModifiers !== 'object' || Array.isArray(selectedModifiers)) {
          throw new BadRequestException(
            `Invalid modifiers format for item ${index + 1}. Expected object with modifier IDs as keys.`
          );
        }
        
        // Create a map of valid modifier IDs and their options
        const validModifiers = new Map<string, { modifier: ProductModifier; options: Map<string, ModifierOption> }>();
        for (const modifier of productModifiers as ProductModifier[]) {
          if (!modifier.id || !modifier.options || !Array.isArray(modifier.options)) {
            throw new BadRequestException(
              `Invalid modifier structure in product ${product.name}`
            );
          }
          
          const optionsMap = new Map<string, ModifierOption>();
          for (const option of modifier.options) {
            if (!option.id) {
              throw new BadRequestException(
                `Invalid option structure in modifier ${modifier.id} of product ${product.name}`
              );
            }
            optionsMap.set(option.id, option);
          }
          
          validModifiers.set(modifier.id, { modifier, options: optionsMap });
        }
        
        // Validate all modifier IDs in request exist in product
        for (const modifierId of Object.keys(selectedModifiers)) {
          if (!validModifiers.has(modifierId)) {
            throw new BadRequestException(
              `Invalid modifier ID "${modifierId}" for item ${index + 1} (product: ${product.name}). This modifier does not exist for this product.`
            );
          }
        }
        
        // Validate all option IDs exist within their modifiers
        for (const [modifierId, selectedOptionIds] of Object.entries(selectedModifiers)) {
          const modifierData = validModifiers.get(modifierId);
          if (!modifierData) continue; // Already validated above
          
          if (!Array.isArray(selectedOptionIds)) {
            throw new BadRequestException(
              `Invalid format for modifier "${modifierId}" in item ${index + 1}. Expected array of option IDs.`
            );
          }
          
          // Check if modifier is single-select but multiple options provided
          if (modifierData.modifier.type === 'single' && selectedOptionIds.length > 1) {
            throw new BadRequestException(
              `Modifier "${modifierData.modifier.name}" is single-select but multiple options provided for item ${index + 1}`
            );
          }
          
          // Validate each option ID exists
          for (const optionId of selectedOptionIds) {
            if (typeof optionId !== 'string') {
              throw new BadRequestException(
                `Invalid option ID type for modifier "${modifierId}" in item ${index + 1}. Expected string.`
              );
            }
            
            if (!modifierData.options.has(optionId)) {
              throw new BadRequestException(
                `Invalid option ID "${optionId}" for modifier "${modifierId}" in item ${index + 1} (product: ${product.name}). This option does not exist.`
              );
            }
          }
        }
        
        // Validate required modifiers are present
        for (const modifier of productModifiers) {
          if (modifier.required && !selectedModifiers[modifier.id]) {
            throw new BadRequestException(
              `Required modifier "${modifier.name}" is missing for item ${index + 1} (product: ${product.name})`
            );
          }
          
          // For single-select required modifiers, ensure at least one option is selected
          if (modifier.required && modifier.type === 'single') {
            const selectedOptions = selectedModifiers[modifier.id];
            if (!selectedOptions || !Array.isArray(selectedOptions) || selectedOptions.length === 0) {
              throw new BadRequestException(
                `Required modifier "${modifier.name}" must have one option selected for item ${index + 1} (product: ${product.name})`
              );
            }
          }
        }
      } else if (product.modifiers) {
        // Product has modifiers but item doesn't - check if any are required
        const productModifiers = product.modifiers as ProductModifier[];
        if (Array.isArray(productModifiers)) {
          const hasRequiredModifiers = productModifiers.some((m) => m.required);
          if (hasRequiredModifiers) {
            throw new BadRequestException(
              `Item ${index + 1} (product: ${product.name}) is missing required modifiers`
            );
          }
        }
      }
    });

    // Calculate totals
    let subtotalCents = 0;
    const orderItems = products.map(({ product, item }) => {
      const basePrice = product.priceCents;
      
      // Calculate modifier prices using shared customization options
      // Products don't store modifiers in DB - they use frontend customization options
      let modifierPrice = 0;
      
      if (item.modifiers) {
        // Use shared customization options based on product category
        modifierPrice = calculateModifierPriceShared(item.modifiers, product.category);
        
        this.logger.log('Calculated modifier price from shared options', {
          productName: product.name,
          productCategory: product.category,
          selectedModifiers: item.modifiers,
          modifierPrice,
        });
      }
      
      const itemPrice = (basePrice + modifierPrice) * item.quantity;
      subtotalCents += itemPrice;
      
      // Log price calculation for debugging
      this.logger.log('Calculating order item price', {
        productName: product.name,
        basePrice,
        modifierPrice,
        itemPricePerUnit: basePrice + modifierPrice,
        quantity: item.quantity,
        totalItemPrice: itemPrice,
        modifiers: item.modifiers,
      });
      
      // Log modifiers before saving
      this.logger.debug('Creating order item with modifiers', {
        productName: product.name,
        modifiers: item.modifiers,
        modifiersType: typeof item.modifiers,
        modifiersStringified: JSON.stringify(item.modifiers),
        modifiersKeys: item.modifiers ? Object.keys(item.modifiers) : [],
      });
      
      // Ensure modifiers are properly serialized for Prisma JSON field
      // Prisma JSON fields need to be serialized - convert to plain object/array
      let modifiersValue: Prisma.InputJsonValue | null = null;
      if (item.modifiers && Object.keys(item.modifiers).length > 0) {
        // Deep clone and ensure it's a plain object (not a class instance)
        // This ensures Prisma can properly serialize it to JSONB
        try {
          const serialized = JSON.parse(JSON.stringify(item.modifiers));
          modifiersValue = serialized as Prisma.InputJsonValue;
          
          this.logger.debug('Serialized modifiers for Prisma', {
            productName: product.name,
            original: item.modifiers,
            serialized: modifiersValue,
            type: typeof modifiersValue,
            keys: Object.keys(serialized),
            stringified: JSON.stringify(serialized),
          });
        } catch (error) {
          this.logger.error('Error serializing modifiers', {
            error,
            modifiers: item.modifiers,
          });
          modifiersValue = null;
        }
      } else {
        this.logger.debug('No modifiers or empty modifiers', {
          productName: product.name,
          modifiers: item.modifiers,
          hasModifiers: !!item.modifiers,
          keys: item.modifiers ? Object.keys(item.modifiers) : [],
        });
      }
      
      const finalPriceCents = basePrice + modifierPrice;
      
      // Log final price being saved
      this.logger.log('Saving order item with final price', {
        productName: product.name,
        basePrice,
        modifierPrice,
        finalPriceCents,
        quantity: item.quantity,
        totalPrice: finalPriceCents * item.quantity,
      });
      
      return {
        productId: product.id,
        productName: product.name, // Vždy INTERNÝ názov (napr. "Hawaii")
        quantity: item.quantity,
        priceCents: finalPriceCents,
        modifiers: modifiersValue,
      };
    });

    // Prices already include VAT, so taxCents = 0
    // (Ceny na webe sú už vrátane DPH, takže nepridávame DPH navyše)
    const taxCents = 0;
    
    // SECURITY FIX: Calculate delivery fee server-side based on distance
    // Ignore client-provided deliveryFeeCents to prevent manipulation
    let deliveryFeeCents = 0;
    try {
      // Distance-based calculation only
      const distanceResult = await this.deliveryFeeTierService.getDeliveryFeeByDistance(
        tenantId,
        {
          street: resolvedAddress.street,
          city: resolvedAddress.city,
          postalCode: resolvedAddress.postalCode,
          country: resolvedAddress.country || 'SK',
          coordinates: (resolvedAddress as any).coordinates,
        }
      );

      if (!distanceResult) {
        // BUG FIX: Check for default fee before throwing error
        const tenantForDelivery = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { deliveryConfig: true },
        });
        const deliveryConfig = (tenantForDelivery?.deliveryConfig || {}) as { defaultFeeCents?: number };
        const defaultDeliveryFee = deliveryConfig?.defaultFeeCents;
        
        if (defaultDeliveryFee !== undefined && typeof defaultDeliveryFee === 'number') {
          deliveryFeeCents = defaultDeliveryFee;
          this.logger.warn('No tier matched, using default fee', {
            tenantId,
            defaultDeliveryFee,
          });
        } else {
          this.logger.warn('No delivery tier found for distance', {
            tenantId,
            address: resolvedAddress,
          });
          throw new BadRequestException(
            'Delivery is not available to this address. Please check the delivery distance.'
          );
        }
      } else if (distanceResult.isOutOfRange) {
        // Address is outside delivery range
        this.logger.warn('Address is outside delivery range', {
          tenantId,
          distanceMeters: distanceResult.distanceMeters,
          address: resolvedAddress,
        });
        throw new BadRequestException(
          'Adresa je mimo dosahu doručovania. Delivery is not available to this address.'
        );
      } else {
        deliveryFeeCents = distanceResult.deliveryFeeCents;
        this.logger.log('Delivery fee calculated by distance', {
          tenantId,
          distanceMeters: distanceResult.distanceMeters,
          deliveryFeeCents,
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error calculating delivery fee', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        address: resolvedAddress,
      });
      throw new BadRequestException('Failed to calculate delivery fee. Please try again.');
    }
    // Total = subtotal + delivery fee (prices already include VAT)
    const totalCents = subtotalCents + deliveryFeeCents;

    // Log orderItems before saving to see what we're sending to Prisma
    this.logger.log('Order items before Prisma create', {
      itemsCount: orderItems.length,
      items: orderItems.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        modifiers: item.modifiers,
        modifiersType: typeof item.modifiers,
        modifiersStringified: JSON.stringify(item.modifiers),
        modifiersKeys: item.modifiers ? Object.keys(item.modifiers as any) : [],
        modifiersIsNull: item.modifiers === null,
        modifiersIsUndefined: item.modifiers === undefined,
        modifiersIsEmpty: item.modifiers ? Object.keys(item.modifiers as any).length === 0 : true,
      })),
    });

    // Generate order number for this tenant
    const orderNumber = await this.orderNumberService.generateOrderNumber(tenantId);

    // Create order (userId can be null for guest orders)
    this.logger.log('Creating order in Prisma with items', {
      itemsCount: orderItems.length,
      orderNumber,
      firstItemModifiers: orderItems[0]?.modifiers,
      firstItemModifiersStringified: JSON.stringify(orderItems[0]?.modifiers),
    });
    
    let order: any;
    try {
      order = await this.prisma.order.create({
        data: {
          tenantId,
          orderNumber,
          clientRequestId: data.clientRequestId?.trim() || null,
          userId: userId || null, // Can be null for guest orders
          status: OrderStatus.PENDING,
          paymentStatus: data.paymentMethod ? 'pending' : null, // For cash on delivery
          paymentRef: data.paymentMethod === 'card'
            ? 'cod:card'
            : data.paymentMethod === 'cash'
              ? 'cod:cash'
              : null,
          customer: data.customer as unknown as Prisma.InputJsonValue,
          address: {
            ...resolvedAddress,
            houseNumber: resolvedAddress.houseNumber, // Include houseNumber
          } as unknown as Prisma.InputJsonValue,
          subtotalCents,
          taxCents,
          deliveryFeeCents,
          totalCents,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: [{ status: OrderStatus.PENDING }],
          },
        } as any, // Type assertion needed until Prisma types are fully regenerated
        include: {
          items: true,
          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true, // Currency field added to schema
              theme: true, // Include theme for email colors and logo
              emailConfig: true, // Include tenant-specific SMTP settings
            } as any, // Type assertion needed until Prisma types are fully regenerated
          },
        },
      } as any);
    } catch (error) {
      if (this.isUniqueConstraintErrorForFields(error, ['tenantId', 'clientRequestId'])) {
        const duplicateOrder = await this.getExistingOrderByClientRequestId(
          tenantId,
          data.clientRequestId,
        );

        if (duplicateOrder) {
          this.logger.warn('Duplicate checkout request deduplicated after unique conflict', {
            tenantId,
            clientRequestId: data.clientRequestId,
            orderId: duplicateOrder.id,
          });
          return this.buildCreateOrderResponse(duplicateOrder, tenantId, shouldReturnAuthToken, createdUser);
        }
      }

      if (this.isUniqueConstraintErrorForFields(error, ['tenantId', 'orderNumber'])) {
        this.logger.error('Invariant violation: duplicate tenant order number generated', {
          tenantId,
          orderNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }

    // Log what was actually saved to database
    this.logger.log('Order created in Prisma, checking saved items', {
      orderId: order.id,
      itemsCount: order.items.length,
      items: order.items.map(item => ({
        id: item.id,
        productName: item.productName,
        modifiers: item.modifiers,
        modifiersType: typeof item.modifiers,
        modifiersStringified: JSON.stringify(item.modifiers),
        modifiersKeys: item.modifiers ? Object.keys(item.modifiers as any) : [],
      })),
    });

    // Send order confirmation email
    const tenant = order.tenant as any; // Type assertion for tenant with currency
    const tenantDomain = tenant.domain || `${tenant.subdomain}.localhost:3001`;
    // Get currency from tenant (field exists in DB, TypeScript types may need refresh)
    const currency = tenant.currency || 'EUR';
    // Get tenant theme for Storyous sync
    const tenantTheme = (tenant.theme || {}) as TenantTheme;
    // Get tenant email config for tenant-specific email settings
    const emailConfig = tenant.emailConfig || {};
    
    // Clean tenant.name before sending email - remove extra spaces and invalid characters
    let tenantName = String(tenant.name || '');
    // Remove non-printable characters
    tenantName = tenantName.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    // Normalize multiple spaces to single space
    tenantName = tenantName.replace(/\s+/g, ' ').trim();
    // Remove quotes and angle brackets that could break email format
    tenantName = tenantName.replace(/["<>]/g, '');
    // Fallback if empty
    if (!tenantName) {
      tenantName = 'Pizza System';
    }
    
    // DEBUG: Log tenant.name before and after cleaning
    this.logger.log(`📧 About to send order confirmation email`, {
      tenantId: tenant.id,
      originalTenantName: tenant.name,
      cleanedTenantName: tenantName,
      tenantNameLength: tenantName.length,
      tenantDomain,
      hasEmailConfig: !!emailConfig?.fromEmail,
    });
    
    // Email service expects Prisma Order type
    await this.emailService.sendOrderConfirmation(
      order as unknown as PrismaOrder & { items?: any[] },
      tenantName, // Use cleaned tenantName
      tenantDomain,
      currency,
      tenantTheme, // Pass tenant theme for colors and logo
      emailConfig, // Pass tenant-specific email config
    );

    // Send password setup email if new account was created without password
    if (createdUser && !createdUser.password && createdUser.passwordResetToken) {
      try {
        await this.emailService.sendPasswordSetupEmail(
          {
            email: createdUser.email || '',
            name: createdUser.name,
          },
          createdUser.passwordResetToken,
          tenantName, // Use cleaned tenantName
          tenantDomain,
          tenant.slug,
          tenantTheme, // Pass tenant theme for colors and logo
          emailConfig, // Pass tenant-specific email config
        );
        this.logger.log(`✅ Password setup email sent to ${createdUser.email}`, { userId: createdUser.id, email: createdUser.email, tenantId });
      } catch (error: any) {
        this.logger.error(`⚠️ Failed to send password setup email:`, { userId: createdUser.id, email: createdUser.email, tenantId, error: error.message, stack: error.stack });
        // Don't throw - email failure shouldn't break order creation
      }
    }

    // Storyous sync removed - now happens only when order is confirmed (PREPARING status)
    // or manually via button in admin dashboard

    return this.buildCreateOrderResponse(order, tenantId, shouldReturnAuthToken, createdUser);
  }

  async getOrderById(id: string): Promise<Order> {
    let order: any;
    try {
      order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          delivery: true,
          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    } catch (error) {
      if (!this.isStatusHistoryUnavailable(error)) {
        throw error;
      }
      this.logger.warn(
        '[getOrderById] statusHistory relation not available, falling back to legacy query',
      );
      order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          delivery: true,
        },
      });
    }

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Load products to get displayName
    const productIds = this.collectUniqueProductIds(order.items.map(item => item.productId));
    const products = await Promise.all(
      productIds.map((productId: string) =>
        this.prisma.product.findUnique({
          where: { id: productId },
          select: { id: true, name: true, displayName: true } as any,
        })
      )
    );
    const productMap = new Map<string, any>(
      (products.filter(p => p) as any[]).map((p: any) => [p.id, p])
    );

      // Explicitly map items to ensure productName and displayName are included
      const orderWithItems = {
        ...order,
        statusHistory: order.statusHistory || [],
        items: order.items.map(item => {
        const product = productMap.get(item.productId) as any;
        const productNameForMapping = (product?.name || item.productName || '') as string;
        const displayName = product?.displayName 
          || getProductDisplayName(productNameForMapping, 'sk')
          || item.productName;
        
        // Log modifiers when retrieving from database
        this.logger.debug('Retrieving order item with modifiers', {
          itemId: item.id,
          productName: item.productName,
          displayName,
          modifiers: item.modifiers,
          modifiersType: typeof item.modifiers,
          modifiersStringified: JSON.stringify(item.modifiers),
          modifiersKeys: item.modifiers ? Object.keys(item.modifiers) : [],
        });
        
        return {
          id: item.id,
          productId: item.productId,
          productName: item.productName, // Ensure productName is included
          displayName, // Add displayName from DB
          quantity: item.quantity,
          priceCents: item.priceCents,
          modifiers: item.modifiers,
        };
      }),
    };

    // Validate order response with Zod
    try {
      return OrderResponseSchema.parse(orderWithItems) as unknown as Order;
    } catch (error) {
      this.logger.error(`Order response validation failed`, { error, orderId: order.id });
      return orderWithItems as unknown as Order; // Fallback
    }
  }

  async getOrders(tenantId: string, filters?: {
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Order[]> {
    // Build createdAt filter properly - combine both bounds if both are provided
    const createdAtFilter: { gte?: Date; lte?: Date } = {};
    if (filters?.startDate) {
      createdAtFilter.gte = filters.startDate;
    }
    if (filters?.endDate) {
      createdAtFilter.lte = filters.endDate;
    }

    let orders: any[];
    try {
      orders = await this.prisma.order.findMany({
        where: {
          tenantId,
          ...(filters?.status && { status: filters.status }),
          ...(Object.keys(createdAtFilter).length > 0 && { createdAt: createdAtFilter }),
        },
        include: {
          items: true,
          delivery: true,
          statusHistory: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      if (!this.isStatusHistoryUnavailable(error)) {
        throw error;
      }
      this.logger.warn(
        '[getOrders] statusHistory relation not available, falling back to legacy query',
      );
      orders = await this.prisma.order.findMany({
        where: {
          tenantId,
          ...(filters?.status && { status: filters.status }),
          ...(Object.keys(createdAtFilter).length > 0 && { createdAt: createdAtFilter }),
        },
        include: {
          items: true,
          delivery: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Load all products for all orders to get displayName
    const allProductIds = this.collectUniqueProductIds(
      orders.flatMap(order => order.items.map(item => item.productId))
    );
    const products = await Promise.all(
      allProductIds.map((productId: string) =>
        this.prisma.product.findUnique({
          where: { id: productId },
          select: { id: true, name: true, displayName: true } as any,
        })
      )
    );
    const productMap = new Map<string, any>(
      (products.filter(p => p) as any[]).map((p: any) => [p.id, p])
    );

    // Validate each order response with Zod
    return orders.map(order => {
      // Explicitly map items to ensure productName and displayName are included
      const orderWithItems = {
        ...order,
        statusHistory: order.statusHistory || [],
        items: order.items.map(item => {
          const product = productMap.get(item.productId) as any;
          const productNameForMapping = (product?.name || item.productName || '') as string;
          const displayName = product?.displayName 
            || getProductDisplayName(productNameForMapping, 'sk')
            || item.productName;
          
          return {
            id: item.id,
            productId: item.productId,
            productName: item.productName, // Ensure productName is included
            displayName, // Add displayName from DB
            quantity: item.quantity,
            priceCents: item.priceCents,
            modifiers: item.modifiers,
          };
        }),
      };
      
      try {
        return OrderResponseSchema.parse(orderWithItems) as unknown as Order;
      } catch (error) {
        this.logger.error(`Order response validation failed`, { error, orderId: order.id });
        return orderWithItems as unknown as Order; // Fallback
      }
    });
  }

  async syncOrderToStoryous(orderId: string): Promise<StoryousSyncResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: true,
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Check if already synced
    type OrderWithStoryous = Prisma.OrderGetPayload<{
      include: {
        items: true;
        tenant: true;
      };
    }>;
    
    const orderWithStoryous = order as OrderWithStoryous;
    if (orderWithStoryous.storyousOrderId) {
      const existingState = String((orderWithStoryous as any).storyousOrderState || '').trim().toUpperCase() || null;
      return {
        success: isStoryousAcceptedState(existingState),
        storyousOrderId: orderWithStoryous.storyousOrderId,
        storyousState: existingState,
        message: buildStoryousSyncMessage(existingState, orderWithStoryous.storyousOrderId),
      };
    }

    try {
      // Get global Storyous settings
      const storyousSettings = await this.settingsService.getStoryousSettings();
      this.logger.log('[Storyous sync] Starting manual sync', { orderId, tenantId: orderWithStoryous.tenantId, settingsEnabled: storyousSettings?.enabled, merchantId: storyousSettings?.merchantId, placeId: storyousSettings?.placeId });
      
      if (!storyousSettings?.enabled || !storyousSettings?.merchantId || !storyousSettings?.placeId) {
        this.logger.warn('[Storyous sync] Missing Storyous settings', { orderId, tenantId: orderWithStoryous.tenantId, settings: storyousSettings });
        return {
          success: false,
          message: 'Storyous is not configured. Please configure it in admin settings.',
        };
      }

      const orderForStoryous = await this.buildStoryousOrderPayload(orderWithStoryous as StoryousSyncOrder);
      const autoPrintReadiness = await this.settingsService.getStoryousAutoPrintReadiness();

      this.logger.debug('[Storyous sync] Payload ready', { orderId, merchantId: storyousSettings.merchantId, placeId: storyousSettings.placeId, totalCents: orderForStoryous.totalCents, items: orderForStoryous.items?.length });
      const storyousResult = await this.storyousService.createOrder(
        orderForStoryous,
        storyousSettings.merchantId,
        storyousSettings.placeId
      );
      
      if (storyousResult?.id) {
        const storyousState = storyousResult.storyousState || null;
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            storyousOrderId: storyousResult.id,
            storyousOrderState: storyousState,
          },
        });
        const syncSuccess = isStoryousAcceptedState(storyousState);
        const readinessSuffix =
          autoPrintReadiness.ready && autoPrintReadiness.warnings.length === 0
            ? ''
            : ` (Auto-confirm readiness: ${autoPrintReadiness.ready ? 'warning' : 'not ready'})`;
        const message = `${buildStoryousSyncMessage(storyousState, storyousResult.id)}${readinessSuffix}`;

        if (syncSuccess) {
          this.logger.log('[Storyous sync] Success', {
            orderId,
            storyousOrderId: storyousResult.id,
            storyousState,
            tenantId: orderWithStoryous.tenantId,
          });
          this.logger.log(`✅ Order ${orderId} manually synced to Storyous: ${storyousResult.id}`, {
            orderId,
            storyousOrderId: storyousResult.id,
            storyousState,
            tenantId: orderWithStoryous.tenantId,
          });
        } else {
          this.logger.warn('[Storyous sync] Order created but auto-confirm goal was not achieved', {
            orderId,
            storyousOrderId: storyousResult.id,
            storyousState,
            tenantId: orderWithStoryous.tenantId,
          });
        }

        return {
          success: syncSuccess,
          storyousOrderId: storyousResult.id,
          storyousState,
          message,
          warnings: storyousResult.warnings,
        };
      }

      this.logger.error('[Storyous sync] Missing Storyous order ID', { orderId, tenantId: orderWithStoryous.tenantId });
      return {
        success: false,
        storyousState: storyousResult?.storyousState || null,
        message: 'Storyous API did not return order ID',
        warnings: storyousResult?.warnings,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to sync order ${orderId} to Storyous:`, { orderId, error: error.message, stack: error.stack });
      return {
        success: false,
        message: error.message || 'Failed to sync order to Storyous',
      };
    }
  }

  async getStoryousReceiptPreview(orderId: string): Promise<StoryousReceiptPreview> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: true,
        delivery: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const orderForStoryous = await this.buildStoryousOrderPayload(order as StoryousSyncOrder);
    return this.storyousService.getReceiptPreview(orderForStoryous);
  }

  async updatePaymentRef(orderId: string, paymentRef: string, paymentStatus: string): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentRef,
        paymentStatus,
      },
      include: {
        items: true,
      },
    });
    // Validate order response with Zod
    try {
      return OrderResponseSchema.parse(order) as unknown as Order;
    } catch (error) {
      this.logger.error(`Order response validation failed`, { error, orderId: order.id });
      return order as unknown as Order; // Fallback
    }
  }

  async updateDeliveryRef(orderId: string, deliveryId: string): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryId },
      include: {
        items: true,
      },
    });
    // Validate order response with Zod
    try {
      return OrderResponseSchema.parse(order) as unknown as Order;
    } catch (error) {
      this.logger.error(`Order response validation failed`, { error, orderId: order.id });
      return order as unknown as Order; // Fallback
    }
  }

  async getOrderByPaymentRef(paymentRef: string): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: { paymentRef },
      include: {
        items: true,
      },
    });

    return order ? (order as unknown as Order) : null;
  }

  /**
   * Sync order to Storyous with retry logic
   * Attempts sync up to 3 times with exponential backoff
   */
  private async syncOrderToStoryousWithRetry(
    order: OrderWithRelations,
    tenantTheme: TenantTheme,
    tenantId: string,
  ): Promise<void> {
    const storyousConfig = tenantTheme.storyousConfig;
    
    if (!storyousConfig?.enabled || !storyousConfig?.merchantId || !storyousConfig?.placeId) {
      return; // Storyous not configured, skip
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const orderForStoryous = await this.buildStoryousOrderPayload(order as unknown as StoryousSyncOrder, {
          tenantTheme,
        });
        
        const storyousResult = await this.storyousService.createOrder(
          orderForStoryous,
          storyousConfig.merchantId,
          storyousConfig.placeId
        );
        
        // Save Storyous order ID
        if (storyousResult?.id) {
          const storyousState = storyousResult.storyousState || null;
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              storyousOrderId: storyousResult.id,
              storyousOrderState: storyousState,
            },
          });
          if (isStoryousAcceptedState(storyousState)) {
            this.logger.log(`✅ Order ${order.id} synchronized to Storyous: ${storyousResult.id}`, {
              orderId: order.id,
              storyousOrderId: storyousResult.id,
              storyousState,
              tenantId,
            });
          } else {
            this.logger.warn(`⚠️ Order ${order.id} created in Storyous without automatic confirmation`, {
              orderId: order.id,
              storyousOrderId: storyousResult.id,
              storyousState,
              tenantId,
            });
          }
          return; // Success, exit
        } else {
          // API didn't return order ID - treat as error
          throw new Error('Storyous API did not return order ID');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isLastAttempt = attempt === maxRetries;
        
        if (isLastAttempt) {
          // Final attempt failed - log critical error
          this.logger.error(`❌ CRITICAL: Failed to sync order ${order.id} to Storyous after ${maxRetries} attempts:`, {
            error: lastError.message,
            stack: lastError.stack,
            orderId: order.id,
            tenantId: tenantId,
          });
          
          // Mark order as needing manual sync (could store sync failure info if needed)
          // For now, just log the error - admin can use manual sync endpoint
          
          // TODO: Send alert to admin (email, Slack, etc.) - kitchen won't know about order!
          // For now, the error is logged and can be monitored
        } else {
          // Retry with exponential backoff
          const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          this.logger.warn(
            `⚠️ Storyous sync attempt ${attempt}/${maxRetries} failed for order ${order.id}, retrying in ${delayMs}ms:`,
            { orderId: order.id, tenantId, attempt, maxRetries, delayMs, error: lastError.message, stack: lastError.stack }
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  private resolveModifierLines(
    modifiers: Record<string, any> | null | undefined,
    productCategory: string = 'PIZZA',
    tenantTheme?: TenantTheme,
  ): string[] {
    return buildStoryousModifierSelections(modifiers, productCategory, tenantTheme).map(
      (selection) => selection.receiptLabel,
    );
  }

  private async buildStoryousOrderPayload(
    order: StoryousSyncOrder,
    options?: { tenantTheme?: TenantTheme },
  ): Promise<Order> {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new BadRequestException(`Order ${order.id} has no items for Storyous sync`);
    }

    if (!order.address || !(order.address as any)?.street || !(order.address as any)?.city || !(order.address as any)?.postalCode) {
      throw new BadRequestException(`Order ${order.id} has no valid delivery address for Storyous sync`);
    }

    const productIds = Array.from(new Set(order.items.map((item: any) => item.productId).filter(Boolean)));
    const products = productIds.length > 0
      ? await this.prisma.product.findMany({
          where: {
            tenantId: order.tenantId,
            id: { in: productIds },
          },
          select: {
            id: true,
            name: true,
            category: true,
          },
        })
      : [];

    const productById = new Map(products.map((product) => [product.id, product]));
    const internalNames = Array.from(
      new Set(
        order.items
          .map((item: any) => productById.get(item.productId)?.name || item.productName)
          .filter((name): name is string => !!name),
      ),
    );

    const mappings = internalNames.length > 0
      ? await this.prisma.productMapping.findMany({
          where: {
            tenantId: order.tenantId,
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

    const tenantTheme = options?.tenantTheme || (order.tenant?.theme as TenantTheme | undefined);
    const enrichedItems = order.items.map((item: any) => {
      const product = productById.get(item.productId);
      const internalProductName = product?.name || item.productName;
      const mapping = internalProductName ? mappingByInternalName.get(internalProductName) : undefined;

      if (!mapping?.externalIdentifier) {
        throw new BadRequestException(
          `Storyous mapping missing for product "${internalProductName || item.productName}" (${item.productId}) in tenant ${order.tenantId} (order ${order.id}). Please add product_mappings.externalIdentifier for source='storyous'.`,
        );
      }

      return {
        ...item,
        productName: item.productName || internalProductName,
        storyousItemId: mapping.externalIdentifier,
        resolvedModifierLines: this.resolveModifierLines(
          item.modifiers as any,
          product?.category || 'PIZZA',
          tenantTheme,
        ),
        storyousModifierSelections: buildStoryousModifierSelections(
          item.modifiers as any,
          product?.category || 'PIZZA',
          tenantTheme,
        ),
      };
    });

    if (!enrichedItems.some((item) => !!item.storyousItemId)) {
      throw new BadRequestException(`Order ${order.id} has no valid Storyous item mappings`);
    }

    return {
      ...order,
      status: order.status as OrderStatus,
      customer: order.customer as unknown as CustomerInfo,
      address: order.address as unknown as Address,
      items: enrichedItems,
    } as unknown as Order;
  }

  async getStoryousSampleReceiptPreview(tenantSlug?: string): Promise<StoryousReceiptPreview> {
    const normalizedTenantSlug = String(tenantSlug || '').trim().toLowerCase();
    const tenant = normalizedTenantSlug
      ? await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { slug: normalizedTenantSlug },
              { subdomain: normalizedTenantSlug },
            ],
          },
        })
      : await this.prisma.tenant.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantSlug || '(default)'} not found`);
    }

    const tenantTheme = tenant.theme as TenantTheme | undefined;
    const sampleModifiers = {
      dough: ['classic-32'],
      sauce: ['tomato'],
      cheese: ['mozzarella'],
      edge: ['olive-oil'],
    };
    const storyousModifierSelections = buildStoryousModifierSelections(
      sampleModifiers,
      'PIZZA',
      tenantTheme,
    );

    const sampleOrder = {
      id: 'storyous-preview-sample',
      tenantId: tenant.id,
      orderNumber: 119,
      status: OrderStatus.PREPARING,
      customer: {
        name: 'Jaro',
        email: 'jardo.bir@gmail.com',
        phone: '+421100200400',
      },
      address: {
        street: 'Námestie F. X. Messerschmidta',
        city: 'Bratislava I',
        postalCode: '811 02',
        country: 'SK',
      },
      subtotalCents: 1849,
      taxCents: 0,
      deliveryFeeCents: 0,
      totalCents: 1849,
      paymentRef: null,
      paymentStatus: 'pending',
      deliveryId: null,
      storyousOrderId: null,
      storyousOrderState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenant,
      items: [
        {
          id: 'preview-item-1',
          orderId: 'storyous-preview-sample',
          productId: 'preview-product-1',
          productName: 'Pizza Bon Salami',
          quantity: 1,
          priceCents: 1849,
          modifiers: sampleModifiers,
          storyousItemId: 'preview-storyous-item-1',
          resolvedModifierLines: storyousModifierSelections.map((selection) => selection.receiptLabel),
          storyousModifierSelections,
        },
      ],
    } as unknown as Order;

    return this.storyousService.getReceiptPreview(sampleOrder);
  }
}
