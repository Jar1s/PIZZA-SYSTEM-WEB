import type { PaymentProvider } from './payment.types';

export interface Tenant {
  id: string;
  slug: string;              // 'pornopizza'
  name: string;              // 'PornoPizza'
  domain: string | null;     // 'pornopizza.sk' or null
  subdomain: string;         // 'pornopizza'
  description?: string;      // Optional description
  logo?: string;             // Optional logo URL (can also be in theme.logo)
  phone?: string;            // Optional phone number
  email?: string;            // Optional email
  currency: string;          // Currency code (e.g., 'EUR', 'CZK')
  theme: TenantTheme;
  paymentProvider: PaymentProvider;
  paymentConfig: Record<string, any>;  // Encrypted API keys
  deliveryConfig: Record<string, any>; // Wolt API keys
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpeningHours {
  enabled: boolean; // Whether automatic maintenance mode is enabled
  timezone?: string; // Timezone (e.g., 'Europe/Bratislava'), defaults to local
  days: {
    [key: string]: { // 'monday', 'tuesday', etc.
      open: string; // HH:mm format (e.g., '09:00')
      close: string; // HH:mm format (e.g., '22:00')
      closed?: boolean; // If true, closed all day
    };
  };
}

export interface TenantTheme {
  primaryColor: string;      // '#FF6B00'
  secondaryColor: string;
  logo: string;              // URL
  favicon: string;
  fontFamily: string;
  heroImage?: string;
  maintenanceMode?: boolean; // Manual maintenance mode (overrides automatic)
  openingHours?: OpeningHours; // Automatic maintenance mode based on opening hours
  taxRate?: number; // Tax rate in percentage (e.g., 20.0 for 20%)
  layout?: {
    headerStyle?: 'dark' | 'light';
    backgroundStyle?: 'black' | 'white' | 'gradient';
    showPizzaSlices?: boolean;
    useCustomLogo?: boolean; // Use custom logo component instead of image
    customLogoComponent?: string; // Name of custom logo component (e.g., 'PornoPizzaLogo')
    useCustomBackground?: boolean; // Use custom background styling
    customBackgroundClass?: string; // Custom CSS class for background containers
    bodyBackgroundClass?: string; // Custom CSS class applied to body element
  };
  storyousConfig?: {
    enabled: boolean;
    merchantId: string;
    placeId: string;
  };
}
