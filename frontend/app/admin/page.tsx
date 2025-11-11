'use client';

import { OrderList } from '@/components/admin/OrderList';
import { KPICards } from '@/components/admin/KPICards';
import { MaintenanceBanner } from '@/components/admin/MaintenanceBanner';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Maintenance Banner with Toggle */}
      <MaintenanceBanner />

      <KPICards />
      <OrderList />
    </div>
  );
}

