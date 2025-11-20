'use client';

import { useEffect, useState } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getAllTenants } from '@/lib/api';
import { EditBrandModal } from '@/components/admin/EditBrandModal';
import { BrandSettingsModal } from '@/components/admin/BrandSettingsModal';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';

export default function BrandsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [settingsTenant, setSettingsTenant] = useState<Tenant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const tenantsData = await getAllTenants();
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

  const handleSettings = (tenant: Tenant) => {
    setSettingsTenant(tenant);
    setIsSettingsModalOpen(true);
  };

  const handleUpdate = () => {
    fetchTenants(); // Refresh list after update
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
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Brand
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading brands...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenants.map((tenant) => (
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
                    <div className="text-sm text-gray-500">Status</div>
                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleEdit(tenant)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    Edit Brand
                  </button>
                  <button
                    onClick={() => handleSettings(tenant)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          ))}
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

      {/* Settings Modal */}
      {settingsTenant && (
        <BrandSettingsModal
          tenant={settingsTenant}
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            setSettingsTenant(null);
          }}
        />
      )}
      </div>
    // </ProtectedRoute> // Disabled for development
  );
}
