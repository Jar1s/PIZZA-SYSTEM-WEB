'use client';

import dynamic from 'next/dynamic';
import { Suspense, Component, ReactNode } from 'react';
import { useAdminContext } from '@/app/admin/admin-context';

// Simple Error Boundary
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error loading component</h3>
          <p className="text-sm text-red-600 mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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

const PaymentSettings = dynamic(() => import('@/components/admin/PaymentSettings').then(mod => ({ default: mod.PaymentSettings })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6" />,
  ssr: false,
});

const SoundNotificationSettings = dynamic(() => import('@/components/admin/SoundNotificationSettings').then(mod => ({ default: mod.SoundNotificationSettings })), {
  loading: () => null,
  ssr: false,
});

const OpeningHoursSettings = dynamic(() => import('@/components/admin/OpeningHoursSettings').then(mod => ({ default: mod.OpeningHoursSettings })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6" />,
  ssr: false,
});

export default function AdminDashboard() {
  const { selectedTenant } = useAdminContext();
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Maintenance Banner with Toggle */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <MaintenanceBanner />
        </Suspense>
      </ErrorBoundary>

      {/* Sound Notification Settings */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <SoundNotificationSettings />
        </Suspense>
      </ErrorBoundary>

      {/* Opening Hours Settings */}
      <ErrorBoundary>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6" />}>
          <OpeningHoursSettings />
        </Suspense>
      </ErrorBoundary>

      {/* Payment Settings - Central for all websites */}
      <ErrorBoundary>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg mb-6" />}>
          <PaymentSettings />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg mb-6" />}>
          <KPICards selectedTenant={selectedTenant} />
        </Suspense>
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
          <OrderList todayOnly={true} selectedTenant={selectedTenant} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

