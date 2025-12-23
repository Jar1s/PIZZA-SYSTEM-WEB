'use client';

import { useEffect, useState } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getAllTenants, updateTenant, syncFromMaster } from '@/lib/api';
import { EditBrandModal } from '@/components/admin/EditBrandModal';
import { CloneBrandModal } from '@/components/admin/CloneBrandModal';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import DeliveryFeeTiersSettings from '@/components/admin/DeliveryFeeTiersSettings';
import { StoryousSettings } from '@/components/admin/StoryousSettings';

export default function BrandsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cloningTenant, setCloningTenant] = useState<Tenant | null>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      // ALWAYS include inactive tenants so admin can see and reactivate them
      console.log('Fetching tenants with includeInactive=true...');
      const tenantsData = await getAllTenants(true);
      console.log(`Fetched ${tenantsData.length} tenants:`, tenantsData.map(t => ({ slug: t.slug, name: t.name, isActive: t.isActive })));
      setTenants(tenantsData);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      // Fallback to empty array if API fails
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    fetchTenants(); // Refresh list after update
  };

  const handleClone = (tenant: Tenant) => {
    setCloningTenant(tenant);
    setIsCloneModalOpen(true);
  };

  const handleCloneSuccess = () => {
    fetchTenants(); // Refresh list after cloning
  };

  const handleSyncFromMaster = async () => {
    setSyncing(true);
    try {
      const result = await syncFromMaster('pornopizza');
      alert(`Sync complete!\nSynced: ${result.synced.join(', ')}\nErrors: ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}`);
      fetchTenants();
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
      setShowSyncConfirm(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const newStatus = !tenant.isActive;
      console.log(`Toggling tenant ${tenant.slug} to ${newStatus ? 'active' : 'inactive'}`);
      
      // IMPORTANT: This only toggles isActive status, it does NOT delete the tenant
      // The tenant will remain in the database, just with isActive = false
      // This makes the website inaccessible but keeps all data intact
      await updateTenant(tenant.slug, {
        isActive: newStatus,
      });
      
      console.log('Tenant updated, refreshing list...');
      // Refresh list to show updated status - always include inactive tenants
      // Inactive tenants are still visible in admin panel, just marked as inactive
      await fetchTenants();
      console.log('List refreshed');
    } catch (error) {
      console.error('Failed to update tenant status:', error);
      alert('Nepodarilo sa aktualizovať status brandu: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    // <ProtectedRoute requiredRole="ADMIN"> // Disabled for development
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all pizza brands in your ecosystem. Total: {tenants.length} brands
          </p>
        </div>
        <button
          onClick={() => setShowSyncConfirm(true)}
          disabled={syncing}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Syncing...' : 'Sync All from Master'}
        </button>
      </div>

      {/* Delivery fee tiers management (based on selected brand from header) */}
      <div className="mb-6">
        <DeliveryFeeTiersSettings />
      </div>

      {/* Storyous settings (global) */}
      <div className="mb-6">
        <StoryousSettings />
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading brands...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenants.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No brands found</h3>
              <p className="text-gray-500 mb-4">No brands were returned from the API.</p>
              <button
                onClick={fetchTenants}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            tenants.map((tenant) => (
              <div key={tenant.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header with brand color */}
              <div 
                className="h-24 flex items-center justify-center"
                style={{ 
                  backgroundColor: (tenant.theme && typeof tenant.theme === 'object' && 'primaryColor' in tenant.theme
                    ? (tenant.theme as any).primaryColor 
                    : (typeof tenant.theme === 'object' && tenant.theme !== null && 'primaryColor' in tenant.theme
                      ? (tenant.theme as any).primaryColor
                      : null)) || '#FF6B00' 
                }}
              >
                <h2 className="text-3xl font-bold text-white">{tenant.name}</h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Subdomain</div>
                    <div className="font-semibold">{tenant.subdomain}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Custom Domain</div>
                    <div className="font-semibold">
                      {tenant.domain || <span className="text-gray-400">Not configured</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">Theme Colors</div>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded border-2 border-gray-200"
                          style={{ 
                            backgroundColor: (tenant.theme && typeof tenant.theme === 'object' && 'primaryColor' in tenant.theme
                              ? (tenant.theme as any).primaryColor 
                              : '#FF6B00')
                          }}
                        />
                        <span className="text-xs text-gray-600">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded border-2 border-gray-200"
                          style={{ 
                            backgroundColor: (tenant.theme && typeof tenant.theme === 'object' && 'secondaryColor' in tenant.theme
                              ? (tenant.theme as any).secondaryColor 
                              : '#000000')
                          }}
                        />
                        <span className="text-xs text-gray-600">Secondary</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">Status</div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                        tenant.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tenant.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${tenant.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {tenant.isActive ? 'Zapnuté' : 'Vypnuté'}
                        </span>
                        <button
                          onClick={() => handleToggleActive(tenant)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleEdit(tenant)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    Edit Brand
                  </button>
                  <button
                    onClick={() => handleClone(tenant)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                  >
                    Clone Brand
                  </button>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      )}

      {tenants.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No brands found</h3>
          <p className="text-gray-500">Create your first brand to get started</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <EditBrandModal
          tenant={editingTenant}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTenant(null);
          }}
          onUpdate={handleUpdate}
        />
      )}

      {/* Clone Modal */}
      {cloningTenant && (
        <CloneBrandModal
          sourceTenant={cloningTenant}
          isOpen={isCloneModalOpen}
          onClose={() => {
            setIsCloneModalOpen(false);
            setCloningTenant(null);
          }}
          onSuccess={handleCloneSuccess}
        />
      )}

      {/* Sync Confirmation Modal */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => !syncing && setShowSyncConfirm(false)}
            />
            <div className="relative bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Confirm Sync from Master</h3>
              <p className="text-gray-600 mb-6">
                This will synchronize products, delivery zones, and product mappings from PornoPizza 
                to all other active tenants. Individual branding, email, and Wolt settings will be preserved.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSyncConfirm(false)}
                  disabled={syncing}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSyncFromMaster}
                  disabled={syncing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Confirm Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    // </ProtectedRoute> // Disabled for development
  );
}
