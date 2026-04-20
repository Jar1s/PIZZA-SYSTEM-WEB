import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Order } from '@pizza-ecosystem/shared';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private prisma: PrismaService) {}

  private normalizeCoordinates(
    coordinates?: { lat: number; lng: number } | null,
  ): { lat: number; lng: number } | null {
    if (coordinates?.lat == null || coordinates?.lng == null) {
      return null;
    }

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  }

  private mapAddressResponse(address: any) {
    const latitude = Number(address?.latitude);
    const longitude = Number(address?.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    return {
      id: address.id,
      street: address.street,
      description: address.description,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isPrimary: address.isPrimary,
      coordinates: hasCoordinates
        ? {
            lat: latitude,
            lng: longitude,
          }
        : undefined,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    };
  }

  /**
   * Get customer orders by user and tenant
   */
  async getCustomerOrders(userId: string, tenantId: string, customerEmail?: string): Promise<Order[]> {
    if (!userId || !tenantId) {
      return [];
    }

    const normalizedEmail = customerEmail ? customerEmail.toLowerCase().trim() : null;
    let guestOrderIds: string[] = [];
    if (normalizedEmail) {
      const guestOrders = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id"
        FROM "orders"
        WHERE "tenantId" = ${tenantId}
          AND "userId" IS NULL
          AND lower("customer"->>'email') = ${normalizedEmail}
      `);
      guestOrderIds = guestOrders.map((order) => order.id);
    }

    const where: Prisma.OrderWhereInput = guestOrderIds.length > 0
      ? {
          tenantId,
          OR: [
            { userId },
            { id: { in: guestOrderIds } },
          ],
        }
      : {
          tenantId,
          userId,
        };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true, // OrderItem already has productName snapshot, no need to include product relation
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      id: order.id,
      tenantId: order.tenantId,
      orderNumber: order.orderNumber,
      status: order.status,
      customer: order.customer as any,
      address: order.address as any,
      subtotalCents: order.subtotalCents,
      taxCents: order.taxCents,
      deliveryFeeCents: order.deliveryFeeCents,
      totalCents: order.totalCents,
      paymentRef: order.paymentRef,
      paymentStatus: order.paymentStatus,
      deliveryId: order.deliveryId,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceCents: item.priceCents,
        modifiers: item.modifiers as any,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })) as any as Order[];
  }

  /**
   * Get customer profile
   */
  async getCustomerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        googleId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      phoneVerified: user.phoneVerified || false,
      googleId: user.googleId || null,
    };
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(userId: string, tenantId: string, data: { name?: string; email?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    // Email can only be changed if user didn't login via Google (no googleId)
    if (data.email && data.email !== user.email) {
      if (user.googleId) {
        // User logged in via Google - email cannot be changed
        throw new BadRequestException('Email cannot be changed for Google accounts');
      }
      // Check if new email is already taken
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email.toLowerCase().trim(), tenantId },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already taken');
      }
      // Email can be changed - normalize it
      data.email = data.email.toLowerCase().trim();
    }

    // Normalize phone number (remove spaces, keep only digits and +)
    const normalizePhone = (phone: string | undefined | null): string | null => {
      if (!phone || phone.trim() === '') return null;
      // Remove all non-digit characters except +
      const cleaned = phone.replace(/[^\d+]/g, '');
      return cleaned || null;
    };

    const normalizedPhone = normalizePhone(data.phone);
    const normalizedCurrentPhone = normalizePhone(user.phone);

    // Check if phone is already taken by another user
    const phoneChanged = normalizedPhone && normalizedPhone !== normalizedCurrentPhone;
    let shouldVerify = false;
    let phoneAlreadyVerified = false;
    
    if (phoneChanged && normalizedPhone) {
      try {
      const existingUser = (await this.prisma.user.findFirst({
        where: { phone: normalizedPhone, tenantId } as any,
        select: {
          id: true,
          phoneVerified: true,
        } as any,
      })) as unknown as { id: string; phoneVerified: boolean } | null;
      
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Phone number is already taken');
      }
      
      // Check if this phone number was already verified for this specific user
      // First check if this user had this phone verified before (check SMS verification history)
      const userVerifiedCode = await (this.prisma as any).smsVerificationCode.findFirst({
        where: {
            phone: normalizedPhone,
          userId: userId,
          isUsed: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      if (userVerifiedCode) {
        // This user already verified this phone number before
        phoneAlreadyVerified = true;
      } else if (existingUser && existingUser.phoneVerified) {
        // Another user has this phone verified - we can trust it's a valid number
        // But for security, we still require verification for the new user
        shouldVerify = true;
      } else {
        // Check if there's any verified SMS code for this phone (within last 30 days)
        // This handles cases where user verified it but then changed to different number
        const recentVerifiedCode = await (this.prisma as any).smsVerificationCode.findFirst({
          where: {
              phone: normalizedPhone,
            isUsed: true,
            expiresAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Within last 30 days
          },
          orderBy: { createdAt: 'desc' },
        });
        
        if (recentVerifiedCode && recentVerifiedCode.userId === userId) {
          // This user verified this phone recently
          phoneAlreadyVerified = true;
        } else {
          shouldVerify = true;
        }
        }
      } catch (error: any) {
        // If findUnique fails (e.g., phone is null or invalid), log and continue
        this.logger.error(`Error checking phone uniqueness: ${error.message}`);
        // If it's a unique constraint violation, re-throw as BadRequestException
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
          throw new BadRequestException('Phone number is already taken');
        }
        // Otherwise, continue with update (phone might be null/empty)
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(normalizedPhone && { phone: normalizedPhone }),
        // If phone changed, mark as verified only if it was already verified before
        ...(phoneChanged && normalizedPhone && { phoneVerified: phoneAlreadyVerified } as any),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email || '',
      phone: updated.phone || '',
      phoneVerified: updated.phoneVerified,
      needsVerification: shouldVerify, // Indicate that phone needs verification only if not already verified
    };
  }

  /**
   * Get customer addresses
   */
  async getCustomerAddresses(userId: string) {
    try {
      if (!userId) {
        this.logger.error('getCustomerAddresses failed: userId is missing');
        return {
          addresses: [],
        };
      }

      this.logger.log(`getCustomerAddresses fetching addresses for userId=${userId}`);
      
      const addresses = await this.prisma.address.findMany({
        where: { userId },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      this.logger.log(`getCustomerAddresses found addresses: ${addresses.length}`);

      return {
        addresses: addresses.map((addr) => this.mapAddressResponse(addr)),
      };
    } catch (error) {
      this.logger.error(
        `getCustomerAddresses error: ${(error as Error)?.message || 'unknown error'}`,
        (error as Error)?.stack,
      );
      this.logger.error(`getCustomerAddresses error details: ${JSON.stringify({
        message: error?.message,
        name: error?.name,
      })}`);
      // Return empty array instead of throwing to prevent 500 error
      return {
        addresses: [],
      };
    }
  }

  /**
   * Create customer address
   */
  async createCustomerAddress(userId: string, data: {
    street: string;
    description?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    } | null;
    isPrimary?: boolean;
  }) {
    try {
      // Validate userId
      if (!userId || !userId.trim()) {
        this.logger.error('createCustomerAddress failed: userId is missing');
        throw new BadRequestException('User ID is required');
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        this.logger.error(`createCustomerAddress failed: user not found (${userId})`);
        throw new NotFoundException('User not found');
      }

      // Validate required fields
      if (!data.street || !data.street.trim()) {
        throw new BadRequestException('Street address is required');
      }
      if (!data.city || !data.city.trim()) {
        throw new BadRequestException('City is required');
      }
      if (!data.postalCode || !data.postalCode.trim()) {
        throw new BadRequestException('Postal code is required');
      }

      // If setting as primary, unset other primary addresses
      if (data.isPrimary) {
        await this.prisma.address.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const coordinates = this.normalizeCoordinates(data.coordinates);

      const address = await this.prisma.address.create({
        data: {
          userId,
          street: data.street.trim(),
          description: data.description?.trim() || null,
          city: data.city.trim(),
          postalCode: data.postalCode.trim(),
          country: data.country?.trim() || 'SK',
          latitude: coordinates?.lat ?? null,
          longitude: coordinates?.lng ?? null,
          isPrimary: data.isPrimary || false,
        } as any,
      });

      return this.mapAddressResponse(address);
    } catch (error: any) {
      this.logger.error(
        `createCustomerAddress error: ${error?.message || 'unknown error'}`,
        error?.stack,
      );
      this.logger.error(`createCustomerAddress error details: ${JSON.stringify({
        message: error?.message,
        name: error?.name,
        code: error?.code,
        userId,
      })}`);
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      // For Prisma errors, provide better error messages
      if (error?.code === 'P2002') {
        throw new BadRequestException('Address already exists');
      }
      if (error?.code === 'P2003') {
        throw new BadRequestException('Invalid user reference');
      }
      if (error?.code === 'P2011') {
        throw new BadRequestException('Required field is missing');
      }
      if (error?.code === 'P2012') {
        throw new BadRequestException('Required field is null');
      }
      // For unknown errors, throw with original message
      throw new BadRequestException(error.message || 'Failed to create address');
    }
  }

  /**
   * Update customer address
   */
  async updateCustomerAddress(userId: string, addressId: string, data: {
    street?: string;
    description?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    } | null;
    isPrimary?: boolean;
  }) {
    // Verify address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting as primary, unset other primary addresses
    if (data.isPrimary) {
      await this.prisma.address.updateMany({
        where: { userId, isPrimary: true, id: { not: addressId } },
        data: { isPrimary: false },
      });
    }

    const hasCoordinatesField = Object.prototype.hasOwnProperty.call(data, 'coordinates');
    const coordinates = this.normalizeCoordinates(data.coordinates);
    const nextStreet = data.street?.trim();
    const nextCity = data.city?.trim();
    const nextPostalCode = data.postalCode?.trim();
    const nextCountry = data.country?.trim();
    const shouldResetCoordinates =
      !hasCoordinatesField &&
      (
        (nextStreet !== undefined && nextStreet !== address.street) ||
        (nextCity !== undefined && nextCity !== address.city) ||
        (nextPostalCode !== undefined && nextPostalCode !== address.postalCode) ||
        (nextCountry !== undefined && nextCountry !== address.country)
      );

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(nextStreet && { street: nextStreet }),
        ...(data.description !== undefined && { description: data.description }),
        ...(nextCity && { city: nextCity }),
        ...(nextPostalCode && { postalCode: nextPostalCode }),
        ...(nextCountry && { country: nextCountry }),
        ...(hasCoordinatesField
          ? {
              latitude: coordinates?.lat ?? null,
              longitude: coordinates?.lng ?? null,
            }
          : shouldResetCoordinates
            ? {
                latitude: null,
                longitude: null,
              }
            : {}),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
      } as any,
    });

    return this.mapAddressResponse(updated);
  }

  /**
   * Delete customer address
   */
  async deleteCustomerAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted' };
  }
}
