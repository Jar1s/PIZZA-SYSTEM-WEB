/**
 * Utility functions for working with tenant theme configuration
 * Replaces hardcoded isPornopizza checks
 */

import { Tenant } from '@pizza-ecosystem/shared';

export interface LayoutConfig {
  headerStyle: 'dark' | 'light';
  backgroundStyle: 'black' | 'white' | 'gradient';
  useCustomLogo: boolean;
  customLogoComponent?: string;
  useCustomBackground: boolean;
  customBackgroundClass?: string;
  bodyBackgroundClass?: string;
}

export function withTenantThemeDefaults(tenant: Tenant | null): Tenant | null {
  if (!tenant) return tenant;

  const slug = tenant.slug?.toLowerCase();
  if (slug === 'pornopizza') {
    const brandPrimary = '#E91E63'; // vivid pink/red brand tone (no orange)
    const brandSecondary = '#0F141A'; // darker secondary
    const brandLogo = '/PORNO PIZZA PINK GRANDIENT.png';
    const theme = tenant.theme || ({} as Tenant['theme']);
    const layout = theme.layout || {};
    
    // Always override legacy orange colors with brand pink/red
    const currentPrimary = theme.primaryColor?.toLowerCase()?.trim() || '';
    const orangeColors = ['#ff6b00', 'ff6b00', '#ff5e00', 'ff5e00', '#ff6600', 'ff6600', '#dc143c', 'dc143c'];
    const normalizedPrimary = 
      !currentPrimary || orangeColors.includes(currentPrimary)
        ? brandPrimary
        : theme.primaryColor;
    
    return {
      ...tenant,
      theme: {
        ...theme,
        primaryColor: normalizedPrimary,
        secondaryColor: brandSecondary, // Always use brand secondary for PornoPizza
        logo: brandLogo,
        layout: {
          headerStyle: layout.headerStyle || 'dark',
          backgroundStyle: layout.backgroundStyle || 'black',
          useCustomLogo: false,
          customLogoComponent: undefined,
          useCustomBackground: layout.useCustomBackground ?? true,
          customBackgroundClass: layout.customBackgroundClass || 'porno-bg',
          bodyBackgroundClass: layout.bodyBackgroundClass || 'bg-porno-vibe',
        },
      },
    };
  }

  return tenant;
}


/**
 * Get layout configuration from tenant theme
 */
export function getLayoutConfig(tenant: Tenant | null): LayoutConfig {
  const normalized = withTenantThemeDefaults(tenant);
  const layout = normalized?.theme?.layout || {};
  const slug = normalized?.slug?.toLowerCase();
  
  return {
    headerStyle: (layout.headerStyle as 'dark' | 'light') || (slug === 'pornopizza' ? 'dark' : 'light'),
    backgroundStyle: (layout.backgroundStyle as 'black' | 'white' | 'gradient') || (slug === 'pornopizza' ? 'black' : 'white'),
    useCustomLogo: layout.useCustomLogo ?? false, // Always use logo from theme.logo, not custom components
    customLogoComponent: layout.customLogoComponent || undefined, // Always use logo from theme.logo
    useCustomBackground: layout.useCustomBackground ?? (slug === 'pornopizza'),
    customBackgroundClass: layout.customBackgroundClass || (slug === 'pornopizza' ? 'porno-bg' : undefined),
    bodyBackgroundClass: layout.bodyBackgroundClass || (slug === 'pornopizza' ? 'bg-porno-vibe' : undefined),
  };
}

/**
 * Check if tenant uses dark theme
 */
export function isDarkTheme(tenant: Tenant | null): boolean {
  const config = getLayoutConfig(tenant);
  return config.backgroundStyle === 'black' || config.headerStyle === 'dark';
}

/**
 * Get background class for tenant
 */
export function getBackgroundClass(tenant: Tenant | null): string {
  const config = getLayoutConfig(tenant);
  
  if (config.useCustomBackground && config.customBackgroundClass) {
    return config.customBackgroundClass;
  }

  if (config.backgroundStyle === 'black') {
    return 'bg-black porno-bg';
  }
  
  return 'bg-gray-50';
}

export function getBodyBackgroundClass(tenant: Tenant | null): string | null {
  const config = getLayoutConfig(tenant);
  if (config.useCustomBackground) {
    return config.bodyBackgroundClass || config.customBackgroundClass || null;
  }
  if (config.backgroundStyle === 'black') {
    return config.bodyBackgroundClass || 'bg-porno-vibe';
  }
  return null;
}

/**
 * Get section shell class (for cards/panels)
 */
export function getSectionShellClass(tenant: Tenant | null): string {
  const config = getLayoutConfig(tenant);
  
  if (config.backgroundStyle === 'black' || config.headerStyle === 'dark') {
    return 'glass-panel border border-white/10 rounded-3xl px-6 py-10 lg:px-10';
  }
  
  return 'bg-white rounded-3xl px-6 py-10 lg:px-16 shadow-xl';
}

/**
 * Get button gradient class for dark theme
 */
export function getButtonGradientClass(tenant: Tenant | null): string {
  const config = getLayoutConfig(tenant);
  
  if (config.backgroundStyle === 'black' || config.headerStyle === 'dark') {
    return 'bg-gradient-to-r from-[#e91e63] via-[#ff2d7a] to-[#ff006e] text-white';
  }
  
  return 'text-white';
}

/**
 * Get button style object (for inline styles)
 */
export function getButtonStyle(tenant: Tenant | null, isDark: boolean): React.CSSProperties | undefined {
  if (!isDark) {
    const primaryColor = tenant?.theme?.primaryColor || '#E91E63';
    return { backgroundColor: primaryColor };
  }
  return undefined;
}

/**
 * Get current tenant slug from hostname or URL params
 * Used in client components to determine which tenant data to display
 */
export function getTenantSlug(): string {
  if (typeof window === 'undefined') return 'pornopizza';
  
  const hostname = window.location.hostname;
  const params = new URLSearchParams(window.location.search);
  
  // Check for known production domains
  if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk')) return 'pornopizza';
  if (hostname.includes('pizzavnudzi.sk')) return 'pizzavnudzi';
  if (hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) return 'pornopizza';
  if (hostname.includes('pizzavnudzi')) return 'pizzavnudzi';
  
  // For localhost or Vercel URLs, check URL params
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('vercel.app')) {
    return params.get('tenant') || 'pornopizza';
  }
  
  // For other domains, try query param first
  const tenantParam = params.get('tenant');
  if (tenantParam) {
    return tenantParam;
  }
  
  // Default fallback
  return 'pornopizza';
}
