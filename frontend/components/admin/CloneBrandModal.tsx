'use client';

import { useState, useEffect } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { cloneTenant } from '@/lib/api';

interface CloneBrandModalProps {
  sourceTenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloneBrandModal({
  sourceTenant,
  isOpen,
  onClose,
  onSuccess,
}: CloneBrandModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [domain, setDomain] = useState('');
  
  // Theme/Design
  const [primaryColor, setPrimaryColor] = useState('#E91E63');
  const [secondaryColor, setSecondaryColor] = useState('#0F141A');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Email Config
  const [fromEmail, setFromEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  
  // Wolt Config
  const [woltApiKey, setWoltApiKey] = useState('');
  const [pickupStreet, setPickupStreet] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupCountry, setPickupCountry] = useState('SK');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // Multi-step form: 1=Basic, 2=Design, 3=Email, 4=Wolt

  useEffect(() => {
    if (sourceTenant && isOpen) {
      // Auto-generate slug from name
      const baseName = `${sourceTenant.name} Clone`;
      setName(baseName);
      generateSlug(baseName);
      
      // Copy theme colors from source
      const theme = sourceTenant.theme as any;
      if (theme) {
        setPrimaryColor(theme.primaryColor || '#E91E63');
        setSecondaryColor(theme.secondaryColor || '#0F141A');
        setLogoUrl(theme.logo || '');
      }
    }
  }, [sourceTenant, isOpen]);

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(slug);
    setSubdomain(slug);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    generateSlug(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTenant) return;

    setLoading(true);
    setError(null);

    try {
      const cloneData = {
        name,
        slug,
        subdomain,
        domain: domain || undefined,
        theme: {
          primaryColor,
          secondaryColor,
          logo: logoUrl || undefined,
        },
        emailConfig: fromEmail ? {
          fromEmail,
          smtpHost: smtpHost || undefined,
          smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
          smtpUser: smtpUser || undefined,
          smtpPassword: smtpPassword || undefined,
          smtpSecure,
        } : undefined,
        deliveryConfig: woltApiKey ? {
          woltConfig: {
            apiKey: woltApiKey,
          },
          pickupAddress: (pickupStreet || pickupCity) ? {
            street: pickupStreet,
            city: pickupCity,
            postalCode: pickupPostalCode,
            country: pickupCountry,
            phone: pickupPhone || undefined,
            coordinates: (pickupLat && pickupLng) ? {
              lat: parseFloat(pickupLat),
              lng: parseFloat(pickupLng),
            } : undefined,
            instructions: pickupInstructions || undefined,
          } : undefined,
        } : undefined,
      };

      await cloneTenant(sourceTenant.slug, cloneData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to clone tenant');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setSubdomain('');
    setDomain('');
    setPrimaryColor('#E91E63');
    setSecondaryColor('#0F141A');
    setLogoUrl('');
    setFromEmail('');
    setSmtpHost('');
    setSmtpPort('587');
    setSmtpUser('');
    setSmtpPassword('');
    setSmtpSecure(false);
    setWoltApiKey('');
    setPickupStreet('');
    setPickupCity('');
    setPickupPostalCode('');
    setPickupCountry('SK');
    setPickupPhone('');
    setPickupLat('');
    setPickupLng('');
    setPickupInstructions('');
    setStep(1);
    setError(null);
  };

  if (!isOpen || !sourceTenant) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Clone Brand: {sourceTenant.name}
                </h3>
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

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex justify-between">
                  {[1, 2, 3, 4].map((s) => (
                    <div 
                      key={s}
                      className={`flex-1 h-2 ${s === 1 ? '' : 'ml-2'} rounded ${
                        step >= s ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Basic</span>
                  <span>Design</span>
                  <span>Email</span>
                  <span>Delivery</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Lowercase letters, numbers, and hyphens only
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subdomain <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Will be: {subdomain}.yourdomain.com
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Domain (Optional)
                      </label>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Step 2: Design */}
                {step === 2 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Color
                        </label>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-full h-10 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secondary Color
                        </label>
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-full h-10 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Step 3: Email Config */}
                {step === 3 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        required
                        placeholder="noreply@yourdomain.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">
                        SMTP Settings (Optional)
                      </h5>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SMTP Host
                            </label>
                            <input
                              type="text"
                              value={smtpHost}
                              onChange={(e) => setSmtpHost(e.target.value)}
                              placeholder="smtp.gmail.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              SMTP Port
                            </label>
                            <input
                              type="number"
                              value={smtpPort}
                              onChange={(e) => setSmtpPort(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP User
                          </label>
                          <input
                            type="text"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Password
                          </label>
                          <input
                            type="password"
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="smtpSecure"
                            checked={smtpSecure}
                            onChange={(e) => setSmtpSecure(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="smtpSecure" className="ml-2 block text-sm text-gray-900">
                            Use SSL/TLS (port 465)
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 4: Wolt/Delivery Config */}
                {step === 4 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Merchant Key (Bearer token)
                      </label>
                      <input
                        type="password"
                        value={woltApiKey}
                        onChange={(e) => setWoltApiKey(e.target.value)}
                        placeholder="Bearer token z Wolt Drive dashboardu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">
                        Pickup Address (Kitchen Location)
                      </h5>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street
                          </label>
                          <input
                            type="text"
                            value={pickupStreet}
                            onChange={(e) => setPickupStreet(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={pickupCity}
                              onChange={(e) => setPickupCity(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={pickupPostalCode}
                              onChange={(e) => setPickupPostalCode(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kitchen Phone
                          </label>
                          <input
                            type="tel"
                            value={pickupPhone}
                            onChange={(e) => setPickupPhone(e.target.value)}
                            placeholder="+421900000000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Latitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={pickupLat}
                              onChange={(e) => setPickupLat(e.target.value)}
                              placeholder="48.1486"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Longitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={pickupLng}
                              onChange={(e) => setPickupLng(e.target.value)}
                              placeholder="17.1077"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <input
                            type="text"
                            value={pickupInstructions}
                            onChange={(e) => setPickupInstructions(e.target.value)}
                            placeholder="Kitchen entrance - call on arrival"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer with navigation */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cloning...' : 'Clone Brand'}
                </button>
              )}
              
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
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
