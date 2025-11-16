'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load admin components for code splitting
const OrderList = dynamic(() => import('@/components/admin/OrderList').then(mod => ({ default: mod.OrderList })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false,
});

const KPICards = dynamic(() => import('@/components/admin/KPICards').then(mod => ({ default: mod.KPICards })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg mb-6" />,
  ssr: false,
});

const MaintenanceBanner = dynamic(() => import('@/components/admin/MaintenanceBanner').then(mod => ({ default: mod.MaintenanceBanner })), {
  loading: () => null,
  ssr: false,
});

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Maintenance Banner with Toggle */}
      <Suspense fallback={null}>
        <MaintenanceBanner />
      </Suspense>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg mb-6" />}>
        <KPICards />
      </Suspense>
      
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <OrderList todayOnly={true} />
      </Suspense>
    </div>
  );
}

