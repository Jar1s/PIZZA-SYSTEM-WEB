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

    // Check if email is already taken by another user
    if (data.email && data.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email } as any,
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email is already taken');
      }
    }

    // Check if phone is already taken by another user
    const phoneChanged = data.phone && data.phone !== user.phone;
    let shouldVerify = false;
    let phoneAlreadyVerified = false;
    
    if (phoneChanged) {
      const existingUser = (await this.prisma.user.findUnique({
        where: { phone: data.phone } as any,
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
          phone: data.phone,
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
            phone: data.phone,
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
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        // If phone changed, mark as verified only if it was already verified before
        ...(phoneChanged && { phoneVerified: phoneAlreadyVerified } as any),
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
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

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
        street: data.street,
        description: data.description,
        city: data.city || '',
        postalCode: data.postalCode || '',
        country: data.country || 'SK',
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

