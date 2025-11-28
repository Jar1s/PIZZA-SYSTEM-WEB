import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order } from '@pizza-ecosystem/shared';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get customer orders by email
   */
  async getCustomerOrders(customerEmail: string): Promise<Order[]> {
    if (!customerEmail) {
      return [];
    }

    // Normalize email for comparison (lowercase, trim)
    const normalizedEmail = customerEmail.toLowerCase().trim();

    // Prisma doesn't support JSON field queries directly, so we fetch all and filter
    // In production, consider adding a customerId field to Order model
    const allOrders = await this.prisma.order.findMany({
      include: {
        items: true, // OrderItem already has productName snapshot, no need to include product relation
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter orders by customer email in JSON field
    // Normalize email comparison to handle case sensitivity and whitespace
    console.log('[CustomerService] Total orders in DB:', allOrders.length);
    console.log('[CustomerService] Looking for email:', normalizedEmail);
    const orders = allOrders.filter((order) => {
      const customer = order.customer as any;
      if (!customer || !customer.email) {
        return false;
      }
      const orderEmail = String(customer.email).toLowerCase().trim();
      const matches = orderEmail === normalizedEmail;
      if (matches) {
        console.log('[CustomerService] Found matching order:', order.id, 'with email:', orderEmail);
      }
      return matches;
    });
    console.log('[CustomerService] Filtered orders:', orders.length);

    return orders.map((order) => ({
      id: order.id,
      tenantId: order.tenantId,
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
    };
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(userId: string, data: { name?: string; email?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    // Email cannot be changed - ignore email updates
    if (data.email && data.email !== user.email) {
      // Silently ignore email changes - email is locked
      delete data.email;
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
      const existingUser = (await this.prisma.user.findUnique({
          where: { phone: normalizedPhone } as any,
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
        console.error('[CustomerService] Error checking phone uniqueness:', error.message);
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
        console.error('[CustomerService] getCustomerAddresses - userId is missing');
        return {
          addresses: [],
        };
      }

      console.log('[CustomerService] getCustomerAddresses - Fetching addresses for userId:', userId);
      
      const addresses = await this.prisma.address.findMany({
        where: { userId },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      console.log('[CustomerService] getCustomerAddresses - Found addresses:', addresses.length);

      return {
        addresses: addresses.map((addr) => ({
          id: addr.id,
          street: addr.street,
          description: addr.description,
          city: addr.city,
          postalCode: addr.postalCode,
          country: addr.country,
          isPrimary: addr.isPrimary,
          createdAt: addr.createdAt.toISOString(),
          updatedAt: addr.updatedAt.toISOString(),
        })),
      };
    } catch (error) {
      console.error('[CustomerService] getCustomerAddresses - Error:', error);
      console.error('[CustomerService] getCustomerAddresses - Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
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
    isPrimary?: boolean;
  }) {
    try {
      // Validate userId
      if (!userId || !userId.trim()) {
        console.error('[CustomerService] createCustomerAddress - userId is missing');
        throw new BadRequestException('User ID is required');
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        console.error('[CustomerService] createCustomerAddress - User not found:', userId);
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

      const address = await this.prisma.address.create({
        data: {
          userId,
          street: data.street.trim(),
          description: data.description?.trim() || null,
          city: data.city.trim(),
          postalCode: data.postalCode.trim(),
          country: data.country?.trim() || 'SK',
          isPrimary: data.isPrimary || false,
        },
      });

      return {
        id: address.id,
        street: address.street,
        description: address.description,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
        isPrimary: address.isPrimary,
        createdAt: address.createdAt.toISOString(),
        updatedAt: address.updatedAt.toISOString(),
      };
    } catch (error: any) {
      console.error('[CustomerService] createCustomerAddress - Error:', error);
      console.error('[CustomerService] createCustomerAddress - Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
        userId,
        data,
      });
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

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(data.street && { street: data.street }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.city && { city: data.city }),
        ...(data.postalCode && { postalCode: data.postalCode }),
        ...(data.country && { country: data.country }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
      },
    });

    return {
      id: updated.id,
      street: updated.street,
      description: updated.description,
      city: updated.city,
      postalCode: updated.postalCode,
      country: updated.country,
      isPrimary: updated.isPrimary,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
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

