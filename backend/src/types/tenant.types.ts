/**
 * Type definitions for tenant-related JSON fields
 */

export interface TenantTheme {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  favicon?: string;
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
    bodyBackgroundClass?: string; // Custom CSS class applied to body element
  };
  storyousConfig?: {
    enabled: boolean;
    merchantId: string;
    placeId: string;
  };
  googleOAuthConfig?: {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
    enabled: boolean;
  };
  analyticsConfig?: Record<string, any>;
  customizationLabels?: CustomizationLabels;
  subCategoryLabels?: SubCategoryLabels;
}

export interface CustomizationLabels {
  categories?: {
    dough?: { sk?: string; en?: string };
    cheese?: { sk?: string; en?: string };
    sauce?: { sk?: string; en?: string };
    edge?: { sk?: string; en?: string };
    toppings?: { sk?: string; en?: string };
  };
  options?: {
    [optionId: string]: { sk?: string; en?: string };
  };
}

export interface SubCategoryLabels {
  foreplay?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  mainAction?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  deluxeFetish?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  premiumSins?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  stangle?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  soups?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  drinks?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
  desserts?: { titleSk?: string; titleEn?: string; descSk?: string; descEn?: string; showDescription?: boolean };
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

export interface EmailConfig {
  fromEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
}
