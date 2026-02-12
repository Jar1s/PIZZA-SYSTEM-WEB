import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole, Order as PrismaOrder } from '@prisma/client';
import { Order, OrderStatus, CustomerInfo, Address, getCustomizationOptions, calculateModifierPrice as calculateModifierPriceShared } from '@pizza-ecosystem/shared';
import { CreateOrderDto } from './dto';
import { EmailService } from '../email/email.service';
import { StoryousService } from '../storyous/storyous.service';
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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  
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
          street: data.address.street,
          city: data.address.city,
          postalCode: data.address.postalCode,
          country: data.address.country || 'SK',
          coordinates: (data.address as any).coordinates,
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
            address: data.address,
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
          address: data.address,
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
        address: data.address,
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
          userId: userId || null, // Can be null for guest orders
          status: OrderStatus.PENDING,
          paymentStatus: data.paymentMethod ? 'pending' : null, // For cash on delivery
          customer: data.customer as unknown as Prisma.InputJsonValue,
          address: {
            ...data.address,
            houseNumber: data.address.houseNumber, // Include houseNumber
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
      });
    } catch (error) {
      if (!this.isStatusHistoryUnavailable(error)) {
        throw error;
      }

      this.logger.warn(
        '[createOrder] statusHistory relation not available, falling back to legacy create',
      );

      order = await this.prisma.order.create({
        data: {
          tenantId,
          orderNumber,
          userId: userId || null,
          status: OrderStatus.PENDING,
          paymentStatus: data.paymentMethod ? 'pending' : null,
          customer: data.customer as unknown as Prisma.InputJsonValue,
          address: {
            ...data.address,
            houseNumber: data.address.houseNumber,
          } as unknown as Prisma.InputJsonValue,
          subtotalCents,
          taxCents,
          deliveryFeeCents,
          totalCents,
          items: {
            create: orderItems,
          },
        } as any,
        include: {
          items: true,
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              domain: true,
              subdomain: true,
              currency: true,
              theme: true,
              emailConfig: true,
            } as any,
          },
        },
      });
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

    // If auto-login happened, return auth token
    if (shouldReturnAuthToken && createdUser) {
      const payload = {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      };

      const access_token = this.jwtService.sign(payload);
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Clean up expired refresh tokens for this user
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId: createdUser.id,
          expiresAt: {
            lt: new Date(), // Delete tokens that have already expired
          },
        },
      });

      // Store refresh token
      await this.prisma.refreshToken.create({
        data: {
          userId: createdUser.id,
          token: refreshToken,
          expiresAt,
        },
      });

      // Validate order response with Zod
      let validatedOrder: Order;
      try {
        validatedOrder = OrderResponseSchema.parse(order) as unknown as Order;
      } catch (error) {
        this.logger.error(`Order response validation failed`, { error, orderId: order.id, tenantId });
        validatedOrder = order as unknown as Order; // Fallback
      }

      return {
        order: validatedOrder,
        authToken: access_token,
        refreshToken: refreshToken,
        user: {
          id: createdUser.id,
          email: createdUser.email || '',
          name: createdUser.name,
          phone: createdUser.phone || undefined,
          role: createdUser.role,
        },
      };
    }

    // Validate order response with Zod
    try {
      return OrderResponseSchema.parse(order) as unknown as Order;
    } catch (error) {
      this.logger.error(`Order response validation failed`, { error, orderId: order.id, tenantId });
      // Validate order response with Zod
    try {
      return OrderResponseSchema.parse(order) as unknown as Order;
    } catch (error) {
      this.logger.error(`Order response validation failed`, { error, orderId: order.id });
      return order as unknown as Order; // Fallback
    } // Fallback
    }
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
    const productIds = [...new Set(order.items.map(item => item.productId))];
    const products = await Promise.all(
      productIds.map(id =>
        this.prisma.product.findUnique({
          where: { id },
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
    const allProductIds = [...new Set(orders.flatMap(order => order.items.map(item => item.productId)))];
    const products = await Promise.all(
      allProductIds.map(id =>
        this.prisma.product.findUnique({
          where: { id },
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
          
          this.logger.log('getOrders: Adding displayName to item', {
            itemId: item.id,
            productId: item.productId,
            productName: item.productName,
            productDbName: product?.name,
            productDisplayName: product?.displayName,
            finalDisplayName: displayName,
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
      
      try {
        return OrderResponseSchema.parse(orderWithItems) as unknown as Order;
      } catch (error) {
        this.logger.error(`Order response validation failed`, { error, orderId: order.id });
        return orderWithItems as unknown as Order; // Fallback
      }
    });
  }

  async syncOrderToStoryous(orderId: string): Promise<{ success: boolean; storyousOrderId?: string; message: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: true,
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
      return {
        success: true,
        storyousOrderId: orderWithStoryous.storyousOrderId,
        message: 'Order already synced to Storyous',
      };
    }

    try {
      // Get global Storyous settings
      const storyousSettings = await this.settingsService.getStoryousSettings();
      this.logger.log('[Storyous sync] Starting manual sync', { orderId, tenantId: orderWithStoryous.tenantId, settingsEnabled: storyousSettings?.enabled, merchantId: storyousSettings?.merchantId, placeId: storyousSettings?.placeId });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders.service.ts:894',message:'storyous settings loaded',data:{enabled:storyousSettings?.enabled,merchantId:storyousSettings?.merchantId,placeId:storyousSettings?.placeId,hasMerchantId:!!storyousSettings?.merchantId,hasPlaceId:!!storyousSettings?.placeId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (!storyousSettings?.enabled || !storyousSettings?.merchantId || !storyousSettings?.placeId) {
        this.logger.warn('[Storyous sync] Missing Storyous settings', { orderId, tenantId: orderWithStoryous.tenantId, settings: storyousSettings });
        return {
          success: false,
          message: 'Storyous is not configured. Please configure it in admin settings.',
        };
      }

      // Convert Prisma Order to shared Order type for Storyous
      const orderForStoryous: Order = {
        ...orderWithStoryous,
        status: orderWithStoryous.status as OrderStatus,
        customer: orderWithStoryous.customer as unknown as CustomerInfo,
        address: orderWithStoryous.address as unknown as Address,
      } as unknown as Order;

      this.logger.debug('[Storyous sync] Payload ready', { orderId, merchantId: storyousSettings.merchantId, placeId: storyousSettings.placeId, totalCents: orderForStoryous.totalCents, items: orderForStoryous.items?.length });
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c8c401c8-9b71-4e06-9291-444154701c07',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'orders.service.ts:910',message:'calling createOrder',data:{orderId:orderForStoryous.id,merchantId:storyousSettings.merchantId,placeId:storyousSettings.placeId,merchantIdType:typeof storyousSettings.merchantId,placeIdType:typeof storyousSettings.placeId,merchantIdLength:storyousSettings.merchantId?.length,placeIdLength:storyousSettings.placeId?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const storyousResult = await this.storyousService.createOrder(
        orderForStoryous,
        storyousSettings.merchantId,
        storyousSettings.placeId
      );
      
      if (storyousResult?.id) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { storyousOrderId: storyousResult.id },
        });
        this.logger.log('[Storyous sync] Success', { orderId, storyousOrderId: storyousResult.id, tenantId: orderWithStoryous.tenantId });
        this.logger.log(`✅ Order ${orderId} manually synced to Storyous: ${storyousResult.id}`, { orderId, storyousOrderId: storyousResult.id, tenantId: orderWithStoryous.tenantId });
        return {
          success: true,
          storyousOrderId: storyousResult.id,
          message: 'Order synced to Storyous successfully',
        };
      }

      this.logger.error('[Storyous sync] Missing Storyous order ID', { orderId, tenantId: orderWithStoryous.tenantId });
      return {
        success: false,
        message: 'Storyous API did not return order ID',
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to sync order ${orderId} to Storyous:`, { orderId, error: error.message, stack: error.stack });
      return {
        success: false,
        message: error.message || 'Failed to sync order to Storyous',
      };
    }
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
        // Convert Prisma Order to shared Order type for Storyous
        const orderForStoryous: Order = {
          ...order,
          status: order.status as OrderStatus,
          customer: order.customer as unknown as CustomerInfo,
          address: order.address as unknown as Address,
        } as unknown as Order;
        
        const storyousResult = await this.storyousService.createOrder(
          orderForStoryous,
          storyousConfig.merchantId,
          storyousConfig.placeId
        );
        
        // Save Storyous order ID
        if (storyousResult?.id) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { storyousOrderId: storyousResult.id },
          });
          this.logger.log(`✅ Order ${order.id} synchronized to Storyous: ${storyousResult.id}`, { orderId: order.id, storyousOrderId: storyousResult.id, tenantId });
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
}
