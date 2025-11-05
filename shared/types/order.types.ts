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
  
  // Delivery
  deliveryId: string | null;
  
  // Items
  items: OrderItem[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;       // Snapshot
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
  city: string;
  postalCode: string;
  country: string;
  instructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

