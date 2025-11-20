'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTenantSlug } from '@/lib/tenant-utils';

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
      // Determine which tenant(s) to fetch
      const currentTenant = selectedTenant || getTenantSlug();
      const tenants = currentTenant === 'all' 
        ? ['pornopizza', 'pizzavnudzi']
        : [currentTenant];
      
      let totalRevenue = 0;
      let totalOrders = 0;
      let activeOrders = 0;
      
      for (const tenant of tenants) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/orders?tenantSlug=${tenant}`
        );
        
        if (res.ok) {
          const orders = await res.json();
          totalOrders += orders.length;
          
          // Calculate revenue from delivered/paid orders
          const revenueOrders = orders.filter((o: any) => 
            o.status === 'DELIVERED' || o.status === 'PAID' || o.status === 'PREPARING' || 
            o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY'
          );
          totalRevenue += revenueOrders.reduce((sum: number, o: any) => sum + (o.totalCents || 0), 0);
          
          // Count active orders (not delivered or canceled)
          activeOrders += orders.filter((o: any) => 
            o.status !== 'DELIVERED' && o.status !== 'CANCELED'
          ).length;
        }
      }
      
      const averageTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
        <div className="text-3xl font-bold">€{(kpis.totalRevenue / 100).toFixed(2)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Total Orders</div>
        <div className="text-3xl font-bold">{kpis.totalOrders}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Average Ticket</div>
        <div className="text-3xl font-bold">€{(kpis.averageTicket / 100).toFixed(2)}</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Active Orders</div>
        <div className="text-3xl font-bold text-orange-600">{kpis.activeOrders}</div>
      </div>
    </div>
  );
}

