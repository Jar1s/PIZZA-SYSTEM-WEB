'use client';

import { useState, useEffect } from 'react';
import { getTenantSlug } from '@/lib/tenant-utils';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTenants } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';

interface TenantSelectorProps {
  selectedTenant: 'all' | string;
  onTenantChange: (tenant: 'all' | string) => void;
}

export function TenantSelector({ selectedTenant, onTenantChange }: TenantSelectorProps) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const currentTenant = getTenantSlug();

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const allTenants = await getAllTenants();
        setTenants(allTenants);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  // Only show selector for ADMIN role
  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-sm text-gray-600">
        <span className="font-medium">Brand:</span>{' '}
        <span className="capitalize">{currentTenant}</span>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">Brand:</span>
      <select
        value={selectedTenant}
        onChange={(e) => onTenantChange(e.target.value as 'all' | string)}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value={currentTenant}>
          {tenants.find(t => t.slug === currentTenant)?.name || currentTenant} (Current)
        </option>
        <option value="all">All Brands</option>
        {tenants
          .filter(t => t.slug !== currentTenant)
          .map(tenant => (
            <option key={tenant.id} value={tenant.slug}>
              {tenant.name}
            </option>
          ))}
      </select>
    </div>
  );
}





