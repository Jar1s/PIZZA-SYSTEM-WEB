'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getTenant } from '@/lib/api';
import { withTenantThemeDefaults } from '@/lib/tenant-utils';

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

      const hostname = window.location.hostname;
      let tenantSlug = 'pornopizza'; // default
      
      if (hostname.includes('pornopizza')) {
        tenantSlug = 'pornopizza';
      } else if (hostname.includes('pizzavnudzi')) {
        tenantSlug = 'pizzavnudzi';
      } else if (hostname.includes('localhost')) {
        const params = new URLSearchParams(window.location.search);
        tenantSlug = params.get('tenant') || 'pornopizza';
      }
      
      const tenantData = await getTenant(tenantSlug);
      setTenant(withTenantThemeDefaults(tenantData));
    } catch (err: any) {
      console.error('Failed to load tenant:', err);
      setError(err.message || 'Failed to load tenant');
      // Set fallback tenant
      setTenant(withTenantThemeDefaults({
        theme: {
          primaryColor: '#FF6B00',
          secondaryColor: '#000000',
          favicon: '/favicon.ico',
        }
      } as Tenant));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

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
