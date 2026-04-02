'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getTenant } from '@/lib/api';
import { withTenantThemeDefaults, getTenantSlug } from '@/lib/tenant-utils';
import { applyTheme } from '@/lib/theme';

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tenant slug from hostname or URL
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const tenantSlug = getTenantSlug();
      
      const tenantData = await getTenant(tenantSlug);
      const normalizedTenant = withTenantThemeDefaults(tenantData);
      setTenant(normalizedTenant);
      
      // Apply theme CSS variables
      if (normalizedTenant?.theme) {
        applyTheme(normalizedTenant.theme);
      }
    } catch (err: any) {
      console.error('Failed to load tenant:', err);
      setError(err.message || 'Failed to load tenant');
      // Set fallback tenant
      const fallbackTenant = withTenantThemeDefaults({
        theme: {
          primaryColor: '#FF6B00',
          secondaryColor: '#000000',
          favicon: '/favicon.ico',
        }
      } as Tenant);
      setTenant(fallbackTenant);
      
      // Apply fallback theme
      if (fallbackTenant?.theme) {
        applyTheme(fallbackTenant.theme);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

  // Apply theme whenever tenant changes
  useEffect(() => {
    if (tenant?.theme) {
      applyTheme(tenant.theme);
    }
  }, [tenant?.theme?.primaryColor, tenant?.theme?.secondaryColor, tenant?.theme?.fontFamily]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refresh: loadTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
