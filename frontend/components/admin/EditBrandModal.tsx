'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { updateTenant } from '@/lib/api';

interface EditBrandModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditBrandModal({ 
  tenant, 
  isOpen, 
  onClose, 
  onUpdate 
}: EditBrandModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    domain: '',
    isActive: true,
  });
  const [themeColors, setThemeColors] = useState({
    primaryColor: '#E91E63',
    secondaryColor: '#0F141A',
  });
  const [cashEnabled, setCashEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // GoPay settings
  const [gopayClientId, setGopayClientId] = useState(');
  const [gopayClientSecret, setGopayClientSecret] = useState(');
  const [gopayGoId, setGopayGoId] = useState(');
  const [gopayEnvironment, setGopayEnvironment] = useState('sandbox');

  // Wolt/Delivery settings
  const [woltApiKey, setWoltApiKey] = useState('');
  const [pickupStreet, setPickupStreet] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupCountry, setPickupCountry] = useState('SK');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');

  useEffect(() => {
    if (tenant) {
      // Handle theme as JSON object
      const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
        ? tenant.theme as any
        : {};
      
      const paymentConfig = (tenant.paymentConfig as any) || {};
      const deliveryConfig = (tenant.deliveryConfig as any) || {};
      const woltConfig = deliveryConfig.woltConfig || {};
      const pickupAddress = deliveryConfig.pickupAddress || {};
      
      setFormData({
        name: tenant.name || '',
        subdomain: tenant.subdomain || tenant.slug || '',
        domain: tenant.domain || '',
        isActive: tenant.isActive !== undefined ? tenant.isActive : true,
      });
      // Load GoPay settings
      setGopayClientId(paymentConfig.clientId || ');
      setGopayClientSecret(paymentConfig.clientSecret || ');
      setGopayGoId(paymentConfig.goId || ');
      setGopayEnvironment(paymentConfig.environment || 'sandbox');

      setThemeColors({
        primaryColor: theme.primaryColor || '#E91E63',
        secondaryColor: theme.secondaryColor || '#0F141A',
      });
      setCashEnabled(paymentConfig.cashOnDeliveryEnabled === true);
      setCardEnabled(paymentConfig.cardOnDeliveryEnabled === true);
      
      // Load Wolt/Delivery settings
      setWoltApiKey(woltConfig.apiKey || '');
      setPickupStreet(pickupAddress.street || '');
      setPickupCity(pickupAddress.city || '');
      setPickupPostalCode(pickupAddress.postalCode || '');
      setPickupCountry(pickupAddress.country || 'SK');
      setPickupLat(pickupAddress.coordinates?.lat?.toString() || '');
      setPickupLng(pickupAddress.coordinates?.lng?.toString() || '');
      setPickupPhone(pickupAddress.phone || '');
      setPickupInstructions(pickupAddress.instructions || '');
      setError(null);
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get existing paymentConfig to preserve other properties
      const existingPaymentConfig = (tenant.paymentConfig as any) || {};
      const existingDeliveryConfig = (tenant.deliveryConfig as any) || {};
      
      // Build deliveryConfig with Wolt settings
      const deliveryConfig: any = {
        ...existingDeliveryConfig,
      };
      
      // Add Wolt config if API key is provided
      if (woltApiKey.trim()) {
        deliveryConfig.woltConfig = {
          ...(existingDeliveryConfig.woltConfig || {}),
          apiKey: woltApiKey.trim(),
        };
      }
      
      // Validate and add pickup address if required fields are present (even without API key)
      if (pickupStreet.trim() && pickupCity.trim() && pickupPostalCode.trim() && pickupCountry.trim() && pickupLat.trim() && pickupLng.trim()) {
        const lat = parseFloat(pickupLat);
        const lng = parseFloat(pickupLng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          deliveryConfig.pickupAddress = {
            street: pickupStreet.trim(),
            city: pickupCity.trim(),
            postalCode: pickupPostalCode.trim(),
            country: pickupCountry.trim(),
            coordinates: {
              lat: lat,
              lng: lng,
            },
            phone: pickupPhone.trim() || undefined,
            instructions: pickupInstructions.trim() || undefined,
          };
        } else {
          throw new Error('GPS súradnice musia byť platné čísla');
        }
      }
      
      const updateData: any = {
        isActive: formData.isActive,
        paymentConfig: {
          ...existingPaymentConfig,
          cashOnDeliveryEnabled: cashEnabled,
          cardOnDeliveryEnabled: cardEnabled,
        },
      };
      
      // Only include deliveryConfig if it has content
      if (Object.keys(deliveryConfig).length > 0 || Object.keys(existingDeliveryConfig).length > 0) {
        updateData.deliveryConfig = deliveryConfig;
      }
      
      console.log('[EditBrandModal] Saving tenant data:', {
        slug: tenant.subdomain || tenant.slug,
        deliveryConfig: updateData.deliveryConfig,
      });
      
      const updatedTenant = await updateTenant(tenant.subdomain || tenant.slug, updateData);
      
      console.log('[EditBrandModal] Tenant updated successfully:', {
        deliveryConfig: updatedTenant.deliveryConfig,
      });
      
      alert('Nastavenia boli úspešne uložené!');
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('[EditBrandModal] Failed to update brand:', err);
      setError(err.message || 'Nepodarilo sa uložiť nastavenia. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Brand</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Brand Name (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <div className="text-gray-900 font-medium">
                    {formData.name}
                  </div>
                </div>

                {/* Subdomain (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subdomain
                  </label>
                  <div className="text-gray-900 font-medium">
                    {formData.subdomain}
                  </div>
                </div>

                {/* Custom Domain (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Domain
                  </label>
                  <div className="text-gray-900 font-medium">
                    {formData.domain || <span className="text-gray-400 italic">Not configured</span>}
                  </div>
                </div>

                {/* Theme Colors (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme Colors
                  </label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-gray-200"
                        style={{ backgroundColor: themeColors.primaryColor }}
                      />
                      <div>
                        <div className="text-xs text-gray-500">Primary</div>
                        <div className="text-sm text-gray-900 font-medium">{themeColors.primaryColor}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded border-2 border-gray-200"
                        style={{ backgroundColor: themeColors.secondaryColor }}
                      />
                      <div>
                        <div className="text-xs text-gray-500">Secondary</div>
                        <div className="text-sm text-gray-900 font-medium">{themeColors.secondaryColor}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (brand is visible to customers)
                  </label>
                </div>

                {/* Payment Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    Payment on Delivery Settings
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Control payment methods available for cash on delivery orders.
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
                        type="button"
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
                        type="button"
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
                </div>

                {/* Wolt Delivery Settings */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">
                    🚚 Wolt Delivery Settings
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Konfigurácia Wolt API a adresy kuchyne pre doručovanie.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Wolt API Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wolt API Kľúč <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={woltApiKey}
                        onChange={(e) => setWoltApiKey(e.target.value)}
                        placeholder="wolt_api_key_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        API kľúč z Wolt Drive dashboardu
                      </p>
                    </div>

                    {/* Pickup Address Section */}
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">
                        📍 Adresa Kuchyne (Pickup Address)
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ulica <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupStreet}
                            onChange={(e) => setPickupStreet(e.target.value)}
                            placeholder="Hlavná 123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mesto <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupCity}
                            onChange={(e) => setPickupCity(e.target.value)}
                            placeholder="Bratislava"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PSČ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupPostalCode}
                            onChange={(e) => setPickupPostalCode(e.target.value)}
                            placeholder="81101"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Krajina <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={pickupCountry}
                            onChange={(e) => setPickupCountry(e.target.value)}
                            placeholder="SK"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GPS Lat <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={pickupLat}
                            onChange={(e) => setPickupLat(e.target.value)}
                            placeholder="48.1486"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GPS Lng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={pickupLng}
                            onChange={(e) => setPickupLng(e.target.value)}
                            placeholder="17.1077"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefón Kuchyne
                          </label>
                          <input
                            type="text"
                            value={pickupPhone}
                            onChange={(e) => setPickupPhone(e.target.value)}
                            placeholder="+421900000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Telefón pre kontakt s kuchyňou (voliteľné, ale odporúčané)
                          </p>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inštrukcie pre kuriéra
                          </label>
                          <textarea
                            value={pickupInstructions}
                            onChange={(e) => setPickupInstructions(e.target.value)}
                            placeholder="Napríklad: Vchod z ulice, 2. poschodie..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Voliteľné inštrukcie pre kuriéra pri vyzdvihnutí
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

