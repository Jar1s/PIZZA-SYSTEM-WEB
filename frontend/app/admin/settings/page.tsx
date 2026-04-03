'use client';

import dynamic from 'next/dynamic';
import { Suspense, Component, ReactNode } from 'react';

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
    console.error('Admin settings component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-base font-semibold text-red-800">Error loading settings</h3>
          <p className="mt-2 text-sm text-red-600">{this.state.error?.message || 'Unknown error'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const MaintenanceBanner = dynamic(() => import('@/components/admin/MaintenanceBanner').then(mod => ({ default: mod.MaintenanceBanner })), {
  loading: () => <div className="animate-pulse rounded-xl bg-gray-200 h-24" />,
  ssr: false,
});

const SoundNotificationSettings = dynamic(() => import('@/components/admin/SoundNotificationSettings').then(mod => ({ default: mod.SoundNotificationSettings })), {
  loading: () => <div className="animate-pulse rounded-xl bg-gray-200 h-24" />,
  ssr: false,
});

const OpeningHoursSettings = dynamic(() => import('@/components/admin/OpeningHoursSettings').then(mod => ({ default: mod.OpeningHoursSettings })), {
  loading: () => <div className="animate-pulse rounded-xl bg-gray-200 h-24" />,
  ssr: false,
});

const PaymentSettings = dynamic(() => import('@/components/admin/PaymentSettings').then(mod => ({ default: mod.PaymentSettings })), {
  loading: () => <div className="animate-pulse rounded-xl bg-gray-200 h-24" />,
  ssr: false,
});

const StoryousSettings = dynamic(() => import('@/components/admin/StoryousSettings').then(mod => ({ default: mod.StoryousSettings })), {
  loading: () => <div className="animate-pulse rounded-xl bg-gray-200 h-24" />,
  ssr: false,
});

const DeliveryFeeTiersSettings = dynamic(() => import('@/components/admin/DeliveryFeeTiersSettings').then(mod => ({ default: mod.default })), {
  loading: () => <div className="animate-pulse rounded-xl bg-gray-200 h-72" />,
  ssr: false,
});

export default function AdminSettingsPage() {
  return (
    <div className="space-y-5 text-gray-900">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-600">Operations</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dashboard ostava zamerany na objednavky. Prevadzkove a integracne nastavenia su tu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-24" />}>
            <MaintenanceBanner />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-24" />}>
            <SoundNotificationSettings />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-24" />}>
            <OpeningHoursSettings />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-24" />}>
            <PaymentSettings />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-24" />}>
            <StoryousSettings />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <ErrorBoundary>
          <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-72" />}>
            <DeliveryFeeTiersSettings />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
