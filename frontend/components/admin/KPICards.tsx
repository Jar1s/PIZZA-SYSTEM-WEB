'use client';

import { useEffect, useState } from 'react';

interface KPIs {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  activeOrders: number;
}

export function KPICards() {
  const [kpis, setKpis] = useState<KPIs>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    activeOrders: 0,
  });

  useEffect(() => {
    // TODO: Fetch real KPIs from API
    // For now, mock data
    setKpis({
      totalRevenue: 45678,
      totalOrders: 234,
      averageTicket: 1950,
      activeOrders: 12,
    });
  }, []);

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

