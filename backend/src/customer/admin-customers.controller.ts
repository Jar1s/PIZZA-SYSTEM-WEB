import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@pizza-ecosystem/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard)
export class AdminCustomersController {
  constructor(private prisma: PrismaService) {}

  private normalizeTenantSlug(slug: string): string {
    const raw = (slug || '').toLowerCase();
    if (raw === 'pizzaparty') return 'partypizza';
    if (raw === 'p0rnopizza') return 'pornopizza';
    return raw;
  }

  /**
   * Get all customers (admin only)
   */
  @Get()
  async getAllCustomers(
    @Request() req: any,
    @Query('tenantSlug') tenantSlug?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user;
    
    // Only ADMIN can access this endpoint
    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can access customer list');
    }

    const normalizedTenantSlug = tenantSlug ? this.normalizeTenantSlug(tenantSlug) : null;
    let tenantIdFilter: string | null = null;

    if (normalizedTenantSlug && normalizedTenantSlug !== 'all') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: normalizedTenantSlug },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant ${normalizedTenantSlug} not found`);
      }

      tenantIdFilter = tenant.id;
    }

    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '50', 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      role: 'CUSTOMER',
      ...(tenantIdFilter ? { tenantId: tenantIdFilter } : {}),
    };

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        ...(searchLower ? [{ email: { contains: searchLower, mode: 'insensitive' } }] : []),
        ...(searchLower ? [{ name: { contains: searchLower, mode: 'insensitive' } }] : []),
        ...(search ? [{ phone: { contains: search } }] : []),
      ];
    }

    // Get customers with order count
    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          tenantId: true,
          name: true,
          email: true,
          phone: true,
          phoneVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Get total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await this.prisma.order.findMany({
          where: {
            userId: customer.id,
            tenantId: customer.tenantId,
            status: { not: OrderStatus.CANCELED },
          },
          select: {
            totalCents: true,
          },
        });

        const totalSpent = orders.reduce((sum, order) => sum + (order.totalCents || 0), 0);

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          phoneVerified: customer.phoneVerified,
          isActive: customer.isActive,
          tenantSlug: customer.tenant?.slug || null,
          tenantName: customer.tenant?.name || null,
          orderCount: orders.length,
          totalSpentCents: totalSpent,
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString(),
        };
      })
    );

    return {
      customers: customersWithStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Delete a customer (admin only)
   */
  @Delete(':id')
  async deleteCustomer(
    @Request() req: any,
    @Param('id') customerId: string,
  ) {
    const user = req.user;
    
    // Only ADMIN can delete customers
    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can delete customers');
    }

    // Check if customer exists
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Only allow deleting CUSTOMER role users
    if (customer.role !== 'CUSTOMER') {
      throw new UnauthorizedException('Can only delete customers');
    }

    // Delete user (cascade will delete related records: refreshTokens, smsVerificationCodes, addresses)
    // Note: Orders are not deleted (they remain for historical records)
    await this.prisma.user.delete({
      where: { id: customerId },
    });

    return {
      message: 'Customer deleted successfully',
      deletedCustomer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    };
  }
}

