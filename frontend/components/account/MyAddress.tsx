'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { authenticatedFetch, handle401Response } from '@/lib/api-helpers';
import AddressAutocomplete from './AddressAutocomplete';
import MapPicker from './MapPicker';

interface Address {
  id: string;
  street: string;
  description?: string;
  city: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

interface MyAddressProps {
  tenant: string;
}

export default function MyAddress({ tenant }: MyAddressProps) {
  const { t } = useLanguage();
  const { user, loading: authLoading, logout } = useCustomerAuth();
  const toast = useToastContext();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    description: '',
    city: '',
    postalCode: '',
    country: 'SK',
    isPrimary: false,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      const res = await authenticatedFetch('/api/customer/account/addresses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, tenant);

      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      } else {
        console.error('[MyAddress] Failed to fetch addresses:', res.status, res.statusText);
      }
    } catch (error: any) {
      if (error.message?.includes('Session expired')) {
        // Already handled by authenticatedFetch - redirecting to login
        return;
      }
      console.error('[MyAddress] Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [user, tenant]);

  useEffect(() => {
    // Wait for auth to load and user to be available before fetching addresses
    if (authLoading) {
      return;
    }
    
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchAddresses();
  }, [authLoading, user, fetchAddresses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure user is available before submitting
    if (!user) {
      // Redirect to login instead of showing alert
      if (typeof window !== 'undefined') {
        window.location.href = `/auth/login?tenant=${tenant}`;
      }
      return;
    }
    
    try {
      const res = await authenticatedFetch('/api/customer/account/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }, tenant);

      if (res.ok) {
        await fetchAddresses();
        setShowAddForm(false);
        setFormData({
          street: '',
          description: '',
          city: '',
          postalCode: '',
          country: 'SK',
          isPrimary: false,
        });
        toast.success('Adresa úspešne pridaná!');
      } else {
        const error = await res.json().catch(() => ({ message: 'Nepodarilo sa pridať adresu' }));
        toast.error(error.message || 'Nepodarilo sa pridať adresu');
      }
    } catch (error: any) {
      if (error.message?.includes('Session expired')) {
        // Already handled by authenticatedFetch - redirecting to login
        return;
      }
      console.error('Failed to add address:', error);
      toast.error('Nepodarilo sa pridať adresu. Skúste to znova.');
    }
  };

  // Show loading if auth is loading, user is not available, or addresses are being fetched
  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t.myAddress}</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t.addAddress}
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.streetAndBuilding}
            </label>
            <AddressAutocomplete
              value={formData.street}
              onChange={(address, details) => {
                setFormData({
                  ...formData,
                  street: address,
                  city: details?.city || formData.city,
                  postalCode: details?.postalCode || formData.postalCode,
                  country: details?.country || formData.country,
                });
              }}
              onSelectFromMap={() => setShowMapPicker(true)}
            />
            {!formData.street && (
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t.youCanSelectOnMap}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.addressDescription}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.addressDescriptionPlaceholder}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300"
            />
            <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
              {t.setAsPrimary}
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
              disabled={!formData.street}
            >
              {t.add}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({
                  street: '',
                  description: '',
                  city: '',
                  postalCode: '',
                  country: 'SK',
                  isPrimary: false,
                });
              }}
              className="px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelect={(address, details) => {
          setFormData({
            ...formData,
            street: address,
            city: details?.city || formData.city,
            postalCode: details?.postalCode || formData.postalCode,
            country: details?.country || formData.country,
          });
          setShowMapPicker(false);
        }}
      />

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t.emptyList}</p>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {address.isPrimary && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded mb-2" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                      {t.primaryAddress}
                    </span>
                  )}
                  <div className="font-semibold text-gray-900 mb-1">{address.street}</div>
                  {address.description && (
                    <div className="text-sm text-gray-600 mb-2">{address.description}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    {address.postalCode} {address.city}, {address.country}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    {t.edit}
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-800">
                    {t.delete}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

