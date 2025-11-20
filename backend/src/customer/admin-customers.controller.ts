import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard)
export class AdminCustomersController {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all customers (admin only)
   */
  @Get()
  async getAllCustomers(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user;
    
    // ADMIN and OPERATOR can access this endpoint
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
      throw new UnauthorizedException('Only admins and operators can access customer list');
    }

    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '50', 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      role: 'CUSTOMER',
    };

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        ...(searchLower ? [{ email: { contains: searchLower } }] : []),
        ...(searchLower ? [{ name: { contains: searchLower } }] : []),
        ...(search ? [{ phone: { contains: search } }] : []),
      ];
    }

    // Get customers with order count
    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          phoneVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
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
            status: { not: 'CANCELED' },
          },
          select: {
            totalCents: true,
          },
        });

        const totalSpent = orders.reduce((sum, order) => sum + order.totalCents, 0);

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          phoneVerified: customer.phoneVerified,
          isActive: customer.isActive,
          orderCount: customer._count.orders,
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
}

