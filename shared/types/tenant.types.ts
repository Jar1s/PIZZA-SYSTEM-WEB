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
  theme: TenantTheme;
  paymentProvider: PaymentProvider;
  paymentConfig: Record<string, any>;  // Encrypted API keys
  deliveryConfig: Record<string, any>; // Wolt API keys
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantTheme {
  primaryColor: string;      // '#FF6B00'
  secondaryColor: string;
  logo: string;              // URL
  favicon: string;
  fontFamily: string;
  heroImage?: string;
}

