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
  timingMetrics: TimingMetrics;
}

export interface TimingMetrics {
  avgConfirmSeconds: number;
  avgPreparingSeconds: number;
  avgDeliveredSeconds: number;
  avgLastMileSeconds: number;
  confirmSamples: number;
  preparingSamples: number;
  deliveredSamples: number;
  lastMileSamples: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private isStatusHistoryUnavailable(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('order_status_history') ||
      message.includes('statusHistory') ||
      message.includes('orderStatusHistory')
    );
  }

  private getEmptyTimingMetrics(): TimingMetrics {
    return {
      avgConfirmSeconds: 0,
      avgPreparingSeconds: 0,
      avgDeliveredSeconds: 0,
      avgLastMileSeconds: 0,
      confirmSamples: 0,
      preparingSamples: 0,
      deliveredSamples: 0,
      lastMileSamples: 0,
    };
  }

  private getAverage(totalSeconds: number, samples: number): number {
    if (samples <= 0) return 0;
    return Math.round(totalSeconds / samples);
  }

  private getPositiveDiffSeconds(start: Date, end: Date): number | null {
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return null;
    }
    return Math.round((endMs - startMs) / 1000);
  }

  private getStatusTimestamp(
    history: Array<{ status: OrderStatus; createdAt: Date }>,
    targetStatus: OrderStatus,
    fallback: Date | null = null,
  ): Date | null {
    const match = history.find((entry) => entry.status === targetStatus);
    if (match) {
      return new Date(match.createdAt);
    }
    return fallback ? new Date(fallback) : null;
  }

  private calculateTimingMetrics(
    orders: Array<{
      status: OrderStatus;
      createdAt: Date;
      updatedAt: Date;
      statusHistory?: Array<{ status: OrderStatus; createdAt: Date }>;
    }>,
  ): TimingMetrics {
    let confirmTotalSeconds = 0;
    let preparingTotalSeconds = 0;
    let deliveredTotalSeconds = 0;
    let lastMileTotalSeconds = 0;

    let confirmSamples = 0;
    let preparingSamples = 0;
    let deliveredSamples = 0;
    let lastMileSamples = 0;

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELED) {
        continue;
      }

      const history = [...(order.statusHistory || [])]
        .map((entry) => ({
          status: entry.status as OrderStatus,
          createdAt: new Date(entry.createdAt),
        }))
        .filter((entry) => !Number.isNaN(entry.createdAt.getTime()))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const paidAt = this.getStatusTimestamp(
        history,
        OrderStatus.PAID,
        order.status === OrderStatus.PAID ? order.updatedAt : null,
      );
      const preparingAt = this.getStatusTimestamp(
        history,
        OrderStatus.PREPARING,
        order.status === OrderStatus.PREPARING ? order.updatedAt : null,
      );
      const outForDeliveryAt =
        this.getStatusTimestamp(
          history,
          OrderStatus.OUT_FOR_DELIVERY,
          order.status === OrderStatus.OUT_FOR_DELIVERY ? order.updatedAt : null,
        ) ||
        this.getStatusTimestamp(
          history,
          OrderStatus.READY,
          order.status === OrderStatus.READY ? order.updatedAt : null,
        );
      const deliveredAt = this.getStatusTimestamp(
        history,
        OrderStatus.DELIVERED,
        order.status === OrderStatus.DELIVERED ? order.updatedAt : null,
      );

      if (paidAt) {
        const seconds = this.getPositiveDiffSeconds(order.createdAt, paidAt);
        if (seconds != null) {
          confirmTotalSeconds += seconds;
          confirmSamples += 1;
        }
      }

      if (preparingAt) {
        const seconds = this.getPositiveDiffSeconds(order.createdAt, preparingAt);
        if (seconds != null) {
          preparingTotalSeconds += seconds;
          preparingSamples += 1;
        }
      }

      if (deliveredAt) {
        const seconds = this.getPositiveDiffSeconds(order.createdAt, deliveredAt);
        if (seconds != null) {
          deliveredTotalSeconds += seconds;
          deliveredSamples += 1;
        }
      }

      if (outForDeliveryAt && deliveredAt) {
        const seconds = this.getPositiveDiffSeconds(outForDeliveryAt, deliveredAt);
        if (seconds != null) {
          lastMileTotalSeconds += seconds;
          lastMileSamples += 1;
        }
      }
    }

    return {
      avgConfirmSeconds: this.getAverage(confirmTotalSeconds, confirmSamples),
      avgPreparingSeconds: this.getAverage(preparingTotalSeconds, preparingSamples),
      avgDeliveredSeconds: this.getAverage(deliveredTotalSeconds, deliveredSamples),
      avgLastMileSeconds: this.getAverage(lastMileTotalSeconds, lastMileSamples),
      confirmSamples,
      preparingSamples,
      deliveredSamples,
      lastMileSamples,
    };
  }

  private async fetchOrdersWithAnalyticsRelations(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      status: OrderStatus;
      totalCents: number;
      createdAt: Date;
      updatedAt: Date;
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        priceCents: number;
      }>;
      statusHistory: Array<{ status: OrderStatus; createdAt: Date }>;
    }>
  > {
    try {
      const orders = await this.prisma.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: true,
          statusHistory: {
            select: {
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      return orders.map((order) => ({
        ...order,
        status: order.status as OrderStatus,
        statusHistory: (order.statusHistory || []).map((entry) => ({
          status: entry.status as OrderStatus,
          createdAt: entry.createdAt,
        })),
      }));
    } catch (error) {
      if (!this.isStatusHistoryUnavailable(error)) {
        throw error;
      }

      const ordersWithoutHistory = await this.prisma.order.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: true,
        },
      });

      return ordersWithoutHistory.map((order) => ({
        ...order,
        status: order.status as OrderStatus,
        statusHistory: [],
      }));
    }
  }

  async getAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsData> {
    // Get orders in date range
    const orders = await this.fetchOrdersWithAnalyticsRelations(
      tenantId,
      startDate,
      endDate,
    );

    const revenueOrders = orders.filter(
      (order) => order.status !== OrderStatus.CANCELED,
    );

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

    const prevRevenueOrders = prevOrders.filter(
      (order) => order.status !== OrderStatus.CANCELED,
    );

    // Calculate metrics
    const totalRevenue = revenueOrders.reduce(
      (sum, order) => sum + (order.totalCents || 0),
      0,
    );
    const totalOrders = revenueOrders.length;
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Previous period metrics
    const prevRevenue = prevRevenueOrders.reduce(
      (sum, order) => sum + (order.totalCents || 0),
      0,
    );
    const prevOrdersCount = prevRevenueOrders.length;
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

    revenueOrders.forEach((order) => {
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

    revenueOrders.forEach((order) => {
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
      timingMetrics: this.calculateTimingMetrics(orders),
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
    let confirmTotalSeconds = 0;
    let preparingTotalSeconds = 0;
    let deliveredTotalSeconds = 0;
    let lastMileTotalSeconds = 0;
    let confirmSamples = 0;
    let preparingSamples = 0;
    let deliveredSamples = 0;
    let lastMileSamples = 0;

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

      const timing = tenantAnalytics.timingMetrics || this.getEmptyTimingMetrics();
      confirmTotalSeconds += timing.avgConfirmSeconds * timing.confirmSamples;
      preparingTotalSeconds += timing.avgPreparingSeconds * timing.preparingSamples;
      deliveredTotalSeconds += timing.avgDeliveredSeconds * timing.deliveredSamples;
      lastMileTotalSeconds += timing.avgLastMileSeconds * timing.lastMileSamples;
      confirmSamples += timing.confirmSamples;
      preparingSamples += timing.preparingSamples;
      deliveredSamples += timing.deliveredSamples;
      lastMileSamples += timing.lastMileSamples;
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
          status: { not: OrderStatus.CANCELED },
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
      timingMetrics: {
        avgConfirmSeconds: this.getAverage(confirmTotalSeconds, confirmSamples),
        avgPreparingSeconds: this.getAverage(preparingTotalSeconds, preparingSamples),
        avgDeliveredSeconds: this.getAverage(deliveredTotalSeconds, deliveredSamples),
        avgLastMileSeconds: this.getAverage(lastMileTotalSeconds, lastMileSamples),
        confirmSamples,
        preparingSamples,
        deliveredSamples,
        lastMileSamples,
      },
    };
  }
}
