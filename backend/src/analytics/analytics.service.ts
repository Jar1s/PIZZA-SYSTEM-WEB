import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@pizza-ecosystem/shared';

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  avgOrderValueChange: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
    revenue: number;
  }>;
  ordersByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Record<OrderStatus, number>;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsData> {
    // Get orders in date range
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true, // OrderItem already has productName snapshot, no need to include product relation
      },
    });

    // Get previous period for comparison
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    const prevEndDate = new Date(startDate);

    const prevOrders = await this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: prevStartDate,
          lt: startDate,
        },
      },
      include: {
        items: true,
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalCents || 0),
      0,
    );
    const totalOrders = orders.length;
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Previous period metrics
    const prevRevenue = prevOrders.reduce(
      (sum, order) => sum + (order.totalCents || 0),
      0,
    );
    const prevOrdersCount = prevOrders.length;
    const prevAvgOrderValue =
      prevOrdersCount > 0 ? Math.round(prevRevenue / prevOrdersCount) : 0;

    // Calculate changes
    const revenueChange =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
        : 0;
    const ordersChange =
      prevOrdersCount > 0
        ? Math.round(
            ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100,
          )
        : 0;
    const avgOrderValueChange =
      prevAvgOrderValue > 0
        ? Math.round(
            ((averageOrderValue - prevAvgOrderValue) / prevAvgOrderValue) *
              100,
          )
        : 0;

    // Top products
    const productStats = new Map<
      string,
      { name: string; sales: number; revenue: number }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        const productName = item.productName || 'Unknown';
        const current = productStats.get(productId) || {
          name: productName,
          sales: 0,
          revenue: 0,
        };
        current.sales += item.quantity;
        current.revenue += (item.priceCents || 0) * item.quantity;
        productStats.set(productId, current);
      });
    });

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        sales: stats.sales,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Orders by day
    const ordersByDayMap = new Map<string, { orders: number; revenue: number }>();

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const current = ordersByDayMap.get(date) || { orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += order.totalCents || 0;
      ordersByDayMap.set(date, current);
    });

    // Fill in missing days
    const ordersByDay: Array<{ date: string; orders: number; revenue: number }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = ordersByDayMap.get(dateStr) || { orders: 0, revenue: 0 };
      ordersByDay.push({
        date: dateStr,
        orders: dayData.orders,
        revenue: dayData.revenue,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Orders by status
    const ordersByStatus: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PREPARING: 0,
      READY: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELED: 0,
    };

    orders.forEach((order) => {
      ordersByStatus[order.status as OrderStatus] =
        (ordersByStatus[order.status as OrderStatus] || 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueChange,
      ordersChange,
      avgOrderValueChange,
      topProducts,
      ordersByDay,
      ordersByStatus,
    };
  }

  async getAllTenantsAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsData> {
    // Get all tenants
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
    });

    // Aggregate analytics from all tenants
    let totalRevenue = 0;
    let totalOrders = 0;
    let prevTotalRevenue = 0;
    let prevTotalOrders = 0;
    const productStats = new Map<
      string,
      { name: string; sales: number; revenue: number }
    >();
    const ordersByDayMap = new Map<string, { orders: number; revenue: number }>();
    const ordersByStatus: Record<OrderStatus, number> = {
      PENDING: 0,
      PAID: 0,
      PREPARING: 0,
      READY: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELED: 0,
    };

    for (const tenant of tenants) {
      const tenantAnalytics = await this.getAnalytics(
        tenant.id,
        startDate,
        endDate,
      );

      totalRevenue += tenantAnalytics.totalRevenue;
      totalOrders += tenantAnalytics.totalOrders;

      // Aggregate top products
      tenantAnalytics.topProducts.forEach((product) => {
        const current = productStats.get(product.productId) || {
          name: product.productName,
          sales: 0,
          revenue: 0,
        };
        current.sales += product.sales;
        current.revenue += product.revenue;
        productStats.set(product.productId, current);
      });

      // Aggregate orders by day
      tenantAnalytics.ordersByDay.forEach((day) => {
        const current = ordersByDayMap.get(day.date) || {
          orders: 0,
          revenue: 0,
        };
        current.orders += day.orders;
        current.revenue += day.revenue;
        ordersByDayMap.set(day.date, current);
      });

      // Aggregate orders by status
      Object.keys(tenantAnalytics.ordersByStatus).forEach((status) => {
        ordersByStatus[status as OrderStatus] +=
          tenantAnalytics.ordersByStatus[status as OrderStatus] || 0;
      });
    }

    // Calculate previous period for comparison
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    const prevEndDate = new Date(startDate);

    for (const tenant of tenants) {
      const prevOrders = await this.prisma.order.findMany({
        where: {
          tenantId: tenant.id,
          createdAt: {
            gte: prevStartDate,
            lt: startDate,
          },
        },
      });

      prevTotalRevenue += prevOrders.reduce(
        (sum, order) => sum + (order.totalCents || 0),
        0,
      );
      prevTotalOrders += prevOrders.length;
    }

    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const prevAvgOrderValue =
      prevTotalOrders > 0
        ? Math.round(prevTotalRevenue / prevTotalOrders)
        : 0;

    const revenueChange =
      prevTotalRevenue > 0
        ? Math.round(
            ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100,
          )
        : 0;
    const ordersChange =
      prevTotalOrders > 0
        ? Math.round(((totalOrders - prevTotalOrders) / prevTotalOrders) * 100)
        : 0;
    const avgOrderValueChange =
      prevAvgOrderValue > 0
        ? Math.round(
            ((averageOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100,
          )
        : 0;

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        sales: stats.sales,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Orders by day
    const ordersByDay: Array<{ date: string; orders: number; revenue: number }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = ordersByDayMap.get(dateStr) || { orders: 0, revenue: 0 };
      ordersByDay.push({
        date: dateStr,
        orders: dayData.orders,
        revenue: dayData.revenue,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueChange,
      ordersChange,
      avgOrderValueChange,
      topProducts,
      ordersByDay,
      ordersByStatus,
    };
  }
}

