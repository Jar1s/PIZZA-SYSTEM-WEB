'use client';

import { useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  isActive: boolean;
}

export default function BrandsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      // Mock data for now - in production this would fetch from API
      const mockTenants: Tenant[] = [
        {
          id: '1',
          name: 'PornoPizza',
          subdomain: 'pornopizza',
          domain: 'pornopizza.sk',
          theme: {
            primaryColor: '#FF6B00',
            secondaryColor: '#000000',
          },
          isActive: true,
        },
        {
          id: '2',
          name: 'Pizza v Núdzi',
          subdomain: 'pizzavnudzi',
          domain: 'pizzavnudzi.sk',
          theme: {
            primaryColor: '#E53935',
            secondaryColor: '#1E1E1E',
          },
          isActive: true,
        },
      ];
      
      setTenants(mockTenants);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Brands Management</h1>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Brand
        </button>
      </div>

      <p className="text-gray-600 mb-6">
        Manage all pizza brands in your ecosystem. Total: {tenants.length} brands
      </p>

      {loading ? (
        <div className="p-8 text-center">Loading brands...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header with brand color */}
              <div 
                className="h-24 flex items-center justify-center"
                style={{ backgroundColor: tenant.theme.primaryColor }}
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
                          style={{ backgroundColor: tenant.theme.primaryColor }}
                        />
                        <span className="text-xs text-gray-600">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded border-2 border-gray-200"
                          style={{ backgroundColor: tenant.theme.secondaryColor }}
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
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Edit Brand
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Settings
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

