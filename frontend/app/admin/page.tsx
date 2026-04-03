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

export default function AdminDashboard() {
  const { selectedTenant } = useAdminContext();
  
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col text-gray-900 lg:h-[calc(100dvh-8rem)] lg:min-h-0">
      <div className="min-h-0 flex-1">
        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
            <OrderList todayOnly={true} selectedTenant={selectedTenant} variant="dashboard" />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
