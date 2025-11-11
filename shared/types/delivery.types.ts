export interface Delivery {
  id: string;
  tenantId: string;
  provider: 'wolt';
  jobId: string | null;      // Wolt job ID
  status: DeliveryStatus;
  trackingUrl: string | null;
  quote: DeliveryQuote | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum DeliveryStatus {
  PENDING = 'pending',
  COURIER_ASSIGNED = 'courier_assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export interface DeliveryQuote {
  feeCents: number;
  etaMinutes: number;
  distance: number;          // km
  currency: string;
}

export interface WoltWebhook {
  job_id: string;
  status: string;
  courier?: {
    name: string;
    phone: string;
  };
  eta?: string;
}








