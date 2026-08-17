export type PaymentMethod = 'online' | 'cod_card' | 'cod_cash';

export interface TimingMetrics {
  avgConfirmSeconds: number;
  avgPreparingSeconds: number;
  avgDeliveredSeconds: number;
  avgLastMileSeconds: number;
  medianConfirmSeconds: number;
  medianPreparingSeconds: number;
  medianDeliveredSeconds: number;
  medianLastMileSeconds: number;
  confirmSamples: number;
  preparingSamples: number;
  deliveredSamples: number;
  lastMileSamples: number;
}

export interface DeliveryEconomics {
  feesCollectedCents: number;
  woltCostCents: number;
  marginCents: number;
  woltOrders: number;
  ownOrders: number;
  freeDeliveryOrders: number;
  avgDistanceMeters: number;
  distanceSamples: number;
  avgWoltCostCents: number;
}

export interface TenantSummary {
  tenantId: string;
  slug: string;
  name: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  canceledCount: number;
  unpaidCount: number;
}

export interface AnalyticsData {
  period: { start: string; end: string; days: number; timezone: string };
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueChange: number | null;
  ordersChange: number | null;
  avgOrderValueChange: number | null;
  previous: { totalRevenue: number; totalOrders: number; averageOrderValue: number };
  canceled: { count: number; rate: number; amountCents: number };
  refunds: { count: number; amountCents: number; pendingCount: number; failedCount: number };
  unpaid: { count: number; amountCents: number };
  ordersByDay: Array<{ date: string; orders: number; revenue: number }>;
  ordersByHour: Array<{ hour: number; orders: number; revenue: number }>;
  heatmap: number[][];
  delivery: DeliveryEconomics;
  payments: Record<PaymentMethod, { count: number; revenue: number }>;
  customers: { unique: number; newCount: number; returningCount: number; repeatRate: number };
  topZips: Array<{ zip: string; city: string; orders: number }>;
  topProducts: Array<{ productId: string; productName: string; sales: number; revenue: number }>;
  topModifiers: Array<{ id: string; name: string; count: number }>;
  ordersByStatus: Record<string, number>;
  timingMetrics: TimingMetrics;
  tenants?: TenantSummary[];
}

export type QuickPreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth';

export type PeriodSelection =
  | { mode: 'days'; days: 7 | 30 | 90 }
  | { mode: 'preset'; preset: QuickPreset; from: string; to: string }
  | { mode: 'custom'; from: string; to: string };

export const QUICK_PRESET_LABELS: Record<QuickPreset, string> = {
  today: 'Dnes',
  yesterday: 'Včera',
  thisWeek: 'Tento týždeň',
  thisMonth: 'Tento mesiac',
};

export const EMPTY_TIMING: TimingMetrics = {
  avgConfirmSeconds: 0,
  avgPreparingSeconds: 0,
  avgDeliveredSeconds: 0,
  avgLastMileSeconds: 0,
  medianConfirmSeconds: 0,
  medianPreparingSeconds: 0,
  medianDeliveredSeconds: 0,
  medianLastMileSeconds: 0,
  confirmSamples: 0,
  preparingSamples: 0,
  deliveredSamples: 0,
  lastMileSamples: 0,
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Čaká',
  PAID: 'Zaplatená',
  PREPARING: 'Pripravuje sa',
  READY: 'Pripravená',
  OUT_FOR_DELIVERY: 'Na ceste',
  DELIVERED: 'Doručená',
  CANCELED: 'Zrušená',
};

export const STATUS_ORDER = ['PENDING', 'PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  online: 'Online',
  cod_card: 'Kartou pri doručení',
  cod_cash: 'Hotovosť pri doručení',
};

export const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  online: '#2563EB',
  cod_card: '#059669',
  cod_cash: '#D97706',
};
