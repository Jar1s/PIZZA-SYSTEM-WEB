'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getTenant, updateTenant } from '@/lib/api';

interface BrandSettingsModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BrandSettingsModal({ 
  tenant, 
  isOpen, 
  onClose 
}: BrandSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'domain' | 'theme' | 'advanced'>('general');
  const [cashEnabled, setCashEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      const paymentConfig = (tenant.paymentConfig as any) || {};
      setCashEnabled(paymentConfig.cashOnDeliveryEnabled === true);
      setCardEnabled(paymentConfig.cardOnDeliveryEnabled === true);
    }
  }, [tenant]);

  const handleSavePaymentConfig = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const paymentConfig = {
        ...((tenant.paymentConfig as any) || {}),
        cashOnDeliveryEnabled: cashEnabled,
        cardOnDeliveryEnabled: cardEnabled,
      };
      
      await updateTenant(tenant.slug, {
        paymentConfig: paymentConfig as any,
      });
      
      // Reload tenant to get updated data
      const updatedTenant = await getTenant(tenant.slug);
      // Note: We can't update tenant prop directly, but the parent should refetch
      alert('Payment settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save payment config:', error);
      alert('Failed to save payment settings: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-medium text-gray-900">
                Settings: {tenant.name}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <nav className="flex -mb-px px-6">
                {[
                  { id: 'general', label: 'General', icon: '⚙️' },
                  { id: 'domain', label: 'Domain', icon: '🌐' },
                  { id: 'theme', label: 'Theme', icon: '🎨' },
                  { id: 'advanced', label: 'Advanced', icon: '🔧' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={tenant.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Edit brand name in Edit Brand modal</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subdomain
                    </label>
                    <input
                      type="text"
                      value={tenant.subdomain}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Subdomain cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'domain' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Domain
                    </label>
                    <input
                      type="text"
                      value={tenant.domain || ''}
                      placeholder="pornopizza.sk"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Configure your custom domain here. Update DNS settings to point to your server.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">DNS Configuration</h4>
                    <p className="text-xs text-blue-700">
                      Add a CNAME record pointing to your server:
                    </p>
                    <code className="block mt-2 text-xs bg-blue-100 p-2 rounded">
                      {tenant.domain || tenant.subdomain + '.sk'} → your-server.com
                    </code>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <div 
                        className="w-16 h-16 rounded border-2 border-gray-300"
                        style={{ 
                          backgroundColor: (tenant.theme && typeof tenant.theme === 'object' && 'primaryColor' in tenant.theme
                            ? (tenant.theme as any).primaryColor 
                            : '#FF6B00')
                        }}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={(tenant.theme && typeof tenant.theme === 'object' && 'primaryColor' in tenant.theme
                            ? (tenant.theme as any).primaryColor 
                            : '#FF6B00')}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">Edit colors in Edit Brand modal</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <div 
                        className="w-16 h-16 rounded border-2 border-gray-300"
                        style={{ 
                          backgroundColor: (tenant.theme && typeof tenant.theme === 'object' && 'secondaryColor' in tenant.theme
                            ? (tenant.theme as any).secondaryColor 
                            : '#000000')
                        }}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={(tenant.theme && typeof tenant.theme === 'object' && 'secondaryColor' in tenant.theme
                            ? (tenant.theme as any).secondaryColor 
                            : '#000000')}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  {/* Payment on Delivery Settings */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-4">
                      Payment on Delivery Settings
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Control payment methods available for cash on delivery orders.
                      Changes apply to all websites using this tenant.
                    </p>
                    
                    <div className="space-y-4">
                      {/* Cash Payment Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Cash Payment
                          </label>
                          <p className="text-xs text-gray-500">
                            Allow customers to pay with cash on delivery
                          </p>
                        </div>
                        <button
                          onClick={() => setCashEnabled(!cashEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            cashEnabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              cashEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {/* Card Payment Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Card Payment (via Courier Terminal)
                          </label>
                          <p className="text-xs text-gray-500">
                            Allow customers to pay with card via courier&apos;s terminal
                          </p>
                        </div>
                        <button
                          onClick={() => setCardEnabled(!cardEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            cardEnabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              cardEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSavePaymentConfig}
                      disabled={saving}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Payment Settings'}
                    </button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Brand Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Brand ID: <code className="bg-gray-100 px-2 py-1 rounded">{tenant.id}</code></div>
                      <div>Created: {new Date(tenant.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(tenant.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

