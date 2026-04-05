'use client';

import dynamic from 'next/dynamic';
import { Suspense, Component, ReactNode, useEffect, useMemo, useState } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getAllTenants, syncFromMaster, updateTenant } from '@/lib/api';
import { EditBrandModal } from '@/components/admin/EditBrandModal';
import { CloneBrandModal } from '@/components/admin/CloneBrandModal';
import { StoryousSampleReceiptPanel } from '@/components/admin/StoryousSampleReceiptPanel';
import { useAdminContext } from '@/app/admin/admin-context';

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
  const { selectedTenant } = useAdminContext();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cloningTenant, setCloningTenant] = useState<Tenant | null>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const previewTenant = useMemo(() => {
    if (tenants.length === 0) return null;

    if (selectedTenant && selectedTenant !== 'all') {
      const exact = tenants.find((tenant) => tenant.slug === selectedTenant || tenant.subdomain === selectedTenant);
      if (exact) return exact;
    }

    return tenants.find((tenant) => tenant.isActive) || tenants[0];
  }, [selectedTenant, tenants]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoadingBrands(true);
        const tenantsData = await getAllTenants(true);
        setTenants(tenantsData);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        setTenants([]);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchTenants();
  }, []);

  const refreshTenants = async () => {
    try {
      setLoadingBrands(true);
      const tenantsData = await getAllTenants(true);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Failed to refresh tenants:', error);
      setTenants([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleClone = (tenant: Tenant) => {
    setCloningTenant(tenant);
    setIsCloneModalOpen(true);
  };

  const handleSyncFromMaster = async () => {
    setSyncing(true);
    try {
      const result = await syncFromMaster('pornopizza');
      alert(`Sync complete!\nSynced: ${result.synced.join(', ')}\nErrors: ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}`);
      await refreshTenants();
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
      setShowSyncConfirm(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await updateTenant(tenant.slug, {
        isActive: !tenant.isActive,
      });
      await refreshTenants();
    } catch (error) {
      console.error('Failed to update tenant status:', error);
      alert('Nepodarilo sa aktualizovať status brandu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-5 text-gray-900">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-600">Operations</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dashboard ostava zamerany na objednavky. Prevadzkove, integracne a brand nastavenia su tu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
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
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-5">
          <ErrorBoundary>
            <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-24" />}>
              <StoryousSettings />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary>
            <Suspense fallback={<div className="animate-pulse rounded-xl bg-gray-200 h-72" />}>
              <DeliveryFeeTiersSettings />
            </Suspense>
          </ErrorBoundary>
        </div>

        <StoryousSampleReceiptPanel
          tenantSlug={previewTenant?.slug || previewTenant?.subdomain || null}
          tenantName={previewTenant?.name || null}
          className="h-full"
        />
      </div>

      <section className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600">Brands</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">Brand management</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Aktivácia, úpravy a klonovanie brandov sú presunuté sem.
            </p>
          </div>
          <button
            onClick={() => setShowSyncConfirm(true)}
            disabled={syncing}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync all from master'}
          </button>
        </div>

        {loadingBrands ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-gray-600">Loading brands...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🏢</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">No brands found</h3>
            <p className="mb-4 text-gray-500">No brands were returned from the API.</p>
            <button
              onClick={refreshTenants}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="overflow-hidden rounded-[20px] border border-zinc-200 bg-white shadow-sm">
                <div
                  className="flex h-20 items-center justify-center"
                  style={{
                    backgroundColor:
                      (tenant.theme && typeof tenant.theme === 'object' && 'primaryColor' in tenant.theme
                        ? (tenant.theme as any).primaryColor
                        : '#FF6B00') || '#FF6B00',
                  }}
                >
                  <h3 className="px-4 text-center text-2xl font-black text-white">{tenant.name}</h3>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Subdomain</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">{tenant.subdomain}</div>
                  </div>

                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Custom domain</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {tenant.domain || <span className="text-zinc-400">Not configured</span>}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Theme colors</div>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded border border-gray-200"
                          style={{
                            backgroundColor:
                              (tenant.theme && typeof tenant.theme === 'object' && 'primaryColor' in tenant.theme
                                ? (tenant.theme as any).primaryColor
                                : '#FF6B00'),
                          }}
                        />
                        <span className="text-xs text-zinc-600">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded border border-gray-200"
                          style={{
                            backgroundColor:
                              (tenant.theme && typeof tenant.theme === 'object' && 'secondaryColor' in tenant.theme
                                ? (tenant.theme as any).secondaryColor
                                : '#000000'),
                          }}
                        />
                        <span className="text-xs text-zinc-600">Secondary</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Status</div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${tenant.isActive ? 'text-green-600' : 'text-zinc-500'}`}>
                          {tenant.isActive ? 'Zapnuté' : 'Vypnuté'}
                        </span>
                        <button
                          onClick={() => handleToggleActive(tenant)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            tenant.isActive ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              tenant.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Edit brand
                    </button>
                    <button
                      onClick={() => handleClone(tenant)}
                      className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      Clone brand
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingTenant && (
        <EditBrandModal
          tenant={editingTenant}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTenant(null);
          }}
          onUpdate={refreshTenants}
        />
      )}

      {cloningTenant && (
        <CloneBrandModal
          sourceTenant={cloningTenant}
          isOpen={isCloneModalOpen}
          onClose={() => {
            setIsCloneModalOpen(false);
            setCloningTenant(null);
          }}
          onSuccess={refreshTenants}
        />
      )}

      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => !syncing && setShowSyncConfirm(false)}
            />
            <div className="relative max-w-md rounded-lg bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Confirm Sync from Master</h3>
              <p className="mb-6 text-gray-600">
                This will synchronize products, delivery zones, and product mappings from PornoPizza
                to all other active tenants. Individual branding, email, and Wolt settings will be preserved.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSyncConfirm(false)}
                  disabled={syncing}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSyncFromMaster}
                  disabled={syncing}
                  className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Confirm Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
