'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTenantSlug } from '@/lib/tenant-utils';
import { getAllTenants } from '@/lib/api';

interface KPIs {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  activeOrders: number;
}

interface KPICardsProps {
  selectedTenant?: 'all' | string;
}

export function KPICards({ selectedTenant }: KPICardsProps = {}) {
  const [kpis, setKpis] = useState<KPIs>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    activeOrders: 0,
  });

  const fetchKPIs = useCallback(async () => {
    try {
      // Get auth token for admin endpoints
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Determine which tenant(s) to fetch. For "all", derive the full brand list
      // from the API (same source as the brand selector) so a newly added brand is
      // included automatically instead of being silently dropped from the totals.
      const currentTenant = selectedTenant || getTenantSlug();
      let tenants: string[];
      if (currentTenant === 'all') {
        const allTenants = await getAllTenants();
        tenants = allTenants.map((t) => t.slug).filter(Boolean);
      } else {
        tenants = [currentTenant];
      }
      
      let totalRevenue = 0;
      let totalOrders = 0;
      let activeOrders = 0;
      let revenueOrdersCount = 0; // Count orders that contribute to revenue
      
      for (const tenant of tenants) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/orders?tenantSlug=${tenant}`,
          { headers }
        );
        
        if (res.ok) {
          const orders = await res.json();
          totalOrders += orders.length;
          
          // Calculate revenue from delivered/paid orders
          const revenueOrders = orders.filter((o: any) => 
            o.status === 'DELIVERED' || o.status === 'PAID' || o.status === 'PREPARING' || 
            o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY'
          );
          revenueOrdersCount += revenueOrders.length; // Count orders with revenue
          totalRevenue += revenueOrders.reduce((sum: number, o: any) => sum + (o.totalCents || 0), 0);
          
          // Count active orders (not delivered or canceled)
          activeOrders += orders.filter((o: any) => 
            o.status !== 'DELIVERED' && o.status !== 'CANCELED'
          ).length;
        } else if (res.status === 401) {
          // Unauthorized - redirect to login
          console.error('Unauthorized - redirecting to login');
          window.location.href = '/login';
          return;
        }
      }
      
      // Calculate average ticket from orders that actually have revenue
      const averageTicket = revenueOrdersCount > 0 ? Math.round(totalRevenue / revenueOrdersCount) : 0;
      
      setKpis({
        totalRevenue,
        totalOrders,
        averageTicket,
        activeOrders,
      });
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchKPIs();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchKPIs, 5000);
    return () => clearInterval(interval);
  }, [fetchKPIs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6 text-gray-900" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
        <div className="text-sm text-gray-600 mb-2" style={{ color: '#4b5563' }}>Total Revenue</div>
        <div className="text-3xl font-bold" style={{ color: '#111827' }}>€{(kpis.totalRevenue / 100).toFixed(2)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 text-gray-900" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
        <div className="text-sm text-gray-600 mb-2" style={{ color: '#4b5563' }}>Total Orders</div>
        <div className="text-3xl font-bold" style={{ color: '#111827' }}>{kpis.totalOrders}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 text-gray-900" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
        <div className="text-sm text-gray-600 mb-2" style={{ color: '#4b5563' }}>Average Ticket</div>
        <div className="text-3xl font-bold" style={{ color: '#111827' }}>€{(kpis.averageTicket / 100).toFixed(2)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 text-gray-900" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
        <div className="text-sm text-gray-600 mb-2" style={{ color: '#4b5563' }}>Active Orders</div>
        <div className="text-3xl font-bold text-orange-600" style={{ color: '#ea580c' }}>{kpis.activeOrders}</div>
      </div>
    </div>
  );
}

