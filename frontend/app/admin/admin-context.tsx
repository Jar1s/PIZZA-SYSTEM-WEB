'use client';

import { createContext, useContext, ReactNode } from 'react';
import { getTenantSlug } from '@/lib/tenant-utils';

// Context provider to pass selectedTenant to child pages
const AdminContext = createContext<{ selectedTenant: 'all' | string } | null>(null);

export function AdminContextProvider({ 
  children, 
  selectedTenant 
}: { 
  children: ReactNode; 
  selectedTenant: 'all' | string;
}) {
  return (
    <AdminContext.Provider value={{ selectedTenant }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    // Fallback to current tenant if context not available
    return { selectedTenant: getTenantSlug() };
  }
  return context;
}





