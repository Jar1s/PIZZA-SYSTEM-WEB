export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber?: number | null;
  status: OrderStatus;
  
  // Customer
  customer: CustomerInfo;
  address: Address;
  
  // Pricing
  subtotalCents: number;
  taxCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  
  // Payment
  paymentRef: string | null;
  paymentStatus: string | null;

  // Refund tracking (GoPay): refund_pending -> refunded | refund_failed
  refundStatus?: string | null;
  refundedAt?: Date | string | null;
  refundError?: string | null;

  // Delivery
  deliveryId: string | null;
  delivery?: {
    id: string;
    provider: string;
    jobId: string | null;
    status: string;
    trackingUrl: string | null;
    quote: any;
  } | null;
  
  // External integrations
  storyousOrderId?: string | null;
  storyousOrderState?: string | null;
  
  // Items
  items: OrderItem[];

  // Status history timeline (oldest -> newest)
  statusHistory?: OrderStatusHistoryEntry[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;       // Snapshot
  displayName?: string | null; // Display name from DB (if available)
  quantity: number;
  priceCents: number;
  modifiers: Record<string, any> | null;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Address {
  street: string;
  houseNumber?: string; // Číslo domu / Poschodie
  city: string;
  postalCode: string;
  country: string;
  instructions?: string; // Poznámky k doručeniu
  coordinates?: {
    lat: number;
    lng: number;
  };
}
