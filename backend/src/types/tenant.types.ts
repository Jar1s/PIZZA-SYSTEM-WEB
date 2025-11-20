/**
 * Type definitions for tenant-related JSON fields
 * Replaces 'as any' with proper types
 */

export interface TenantTheme {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  maintenanceMode?: boolean;
  taxRate?: number; // Tax rate in percentage (e.g., 20.0 for 20%)
  layout?: {
    headerStyle?: 'dark' | 'light';
    backgroundStyle?: 'black' | 'white' | 'gradient';
    showPizzaSlices?: boolean;
    useCustomLogo?: boolean; // Use custom logo component instead of image
    customLogoComponent?: string; // Name of custom logo component (e.g., 'PornoPizzaLogo')
    useCustomBackground?: boolean; // Use custom background styling
    customBackgroundClass?: string; // Custom CSS class for background
  };
  storyousConfig?: {
    enabled: boolean;
    merchantId: string;
    placeId: string;
  };
}

export interface PaymentConfig {
  cashOnDeliveryEnabled?: boolean;
  cardOnDeliveryEnabled?: boolean;
  provider?: string;
  adyenConfig?: {
    merchantAccount?: string;
    apiKey?: string;
  };
  gopayConfig?: {
    goId?: string;
    clientId?: string;
    clientSecret?: string;
  };
  wepayConfig?: {
    merchantId?: string;
    apiKey?: string;
    hmacKey?: string;
  };
}

export interface DeliveryConfig {
  provider?: string;
  apiKey?: string;
  woltConfig?: {
    merchantId?: string;
    apiKey?: string;
    webhookSecret?: string;
  };
  // Multi-tenant pickup address (kitchen location)
  pickupAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    instructions?: string; // Optional instructions for courier
    phone?: string; // Kitchen phone number for courier contact
  };
  defaultFeeCents?: number; // Default delivery fee if no zone matches
}

