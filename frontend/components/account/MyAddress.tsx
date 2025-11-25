'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import AddressAutocomplete from './AddressAutocomplete';

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
  isDark?: boolean;
}

export default function MyAddress({ tenant, isDark = false }: MyAddressProps) {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useCustomerAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    description: '',
    city: '',
    postalCode: '',
    country: 'SK',
    isPrimary: false,
  });

  const fetchAddresses = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${API_URL}/api/customer/account/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      } else if (res.status === 401) {
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_refresh_token');
        localStorage.removeItem('customer_auth_user');
        setAddresses([]);
      } else {
        console.error('Failed to fetch addresses:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const handleAddressSelect = (address: string, details?: any) => {
    if (details) {
      setFormData({
        ...formData,
        street: details.street || address,
        city: details.city || '',
        postalCode: details.postalCode || '',
        country: details.country || 'SK',
      });
    } else {
      setFormData({
        ...formData,
        street: address,
      });
    }
  };

  const handleSave = async (addressId?: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token) {
        alert('Nie ste prihlásený');
        return;
      }

      if (!formData.street || !formData.city || !formData.postalCode) {
        alert('Prosím, vyplňte všetky povinné polia');
        return;
      }

      const url = addressId 
        ? `${API_URL}/api/customer/account/addresses/${addressId}`
        : `${API_URL}/api/customer/account/addresses`;
      
      const method = addressId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchAddresses();
        setEditingId(null);
        setShowAddForm(false);
        setFormData({
          street: '',
          description: '',
          city: '',
          postalCode: '',
          country: 'SK',
          isPrimary: false,
        });
      } else {
        const error = await res.json().catch(() => ({ message: 'Nepodarilo sa uložiť adresu' }));
        alert(error.message || 'Nepodarilo sa uložiť adresu');
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Nepodarilo sa uložiť adresu');
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Naozaj chcete odstrániť túto adresu?')) {
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('customer_auth_token');
      
      if (!token) {
        alert('Nie ste prihlásený');
        return;
      }

      const res = await fetch(`${API_URL}/api/customer/account/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        await fetchAddresses();
      } else {
        const error = await res.json().catch(() => ({ message: 'Nepodarilo sa odstrániť adresu' }));
        alert(error.message || 'Nepodarilo sa odstrániť adresu');
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Nepodarilo sa odstrániť adresu');
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      street: address.street,
      description: address.description || '',
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
      isPrimary: address.isPrimary,
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      street: '',
      description: '',
      city: '',
      postalCode: '',
      country: 'SK',
      isPrimary: false,
    });
  };

  const mutedText = isDark ? 'text-gray-300' : 'text-gray-600';
  const cardBaseClass = isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border-gray-200';
  const inputClass = isDark
    ? 'w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-gray-400 focus:border-white/40 focus:outline-none'
    : 'w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-orange-500';

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">{t.myAddress}</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
          <p className={`mt-4 ${mutedText}`}>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.myAddress}</h2>
        {!showAddForm && !editingId && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${isDark ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55]' : 'text-white'}`}
            style={!isDark ? { backgroundColor: 'var(--color-primary)' } : undefined}
          >
            + {t.addAddress}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div
          className={`rounded-2xl p-6 mb-6 border-2 ${
            isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-gray-50'
          }`}
          style={!isDark ? { borderColor: 'var(--color-primary)' } : undefined}
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? t.editAddress : t.addAddress}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${mutedText}`}>
                {t.address} *
              </label>
              <AddressAutocomplete
                value={formData.street}
                onChange={handleAddressSelect}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${mutedText}`}>
                {t.description} ({t.optional})
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.apartmentNumber}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${mutedText}`}>
                  {t.city} *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${mutedText}`}>
                  {t.postalCode} *
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <label htmlFor="isPrimary" className={`text-sm ${mutedText}`}>
                {t.setAsPrimary}
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSave(editingId || undefined)}
                className={`px-6 py-2 rounded-full font-semibold ${isDark ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55]' : 'text-white'}`}
                style={!isDark ? { backgroundColor: 'var(--color-primary)' } : undefined}
              >
                {t.save}
              </button>
              <button
                onClick={handleCancel}
                className={`px-6 py-2 rounded-full font-semibold ${
                  isDark ? 'border border-white/20 text-white hover:bg-white/10' : 'border-2 border-gray-300 text-gray-700'
                }`}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addresses List */}
      <div className="space-y-4">
        {addresses.length === 0 && !showAddForm && !editingId ? (
          <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50'}`}>
            <div className="text-4xl mb-4">📍</div>
            <p className={`${mutedText} mb-4`}>{t.noAddresses}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className={`px-6 py-3 rounded-full font-semibold ${isDark ? 'bg-gradient-to-r from-[#ff5e00] via-[#ff0066] to-[#ff2d55]' : 'text-white'}`}
              style={!isDark ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              + {t.addAddress}
            </button>
          </div>
        ) : (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`rounded-2xl p-4 border transition-shadow ${
                address.isPrimary
                  ? isDark
                    ? 'bg-white/10 border-white/30 shadow-[0_15px_50px_rgba(0,0,0,0.5)]'
                    : 'border-orange-500 bg-orange-50'
                  : cardBaseClass
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {address.isPrimary && (
                    <span
                      className="inline-block px-2 py-1 mb-2 text-xs font-semibold rounded text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {t.primary}
                    </span>
                  )}
                  <div className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{address.street}</div>
                  {address.description && (
                    <div className={`text-sm mb-1 ${mutedText}`}>{address.description}</div>
                  )}
                  <div className={`text-sm ${mutedText}`}>
                    {address.postalCode} {address.city}
                  </div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{address.country}</div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(address)}
                    className={`px-3 py-2 rounded-full text-sm font-semibold ${
                      isDark ? 'border border-white/20 text-white hover:bg-white/10' : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className={`px-3 py-2 rounded-full text-sm font-semibold ${
                      isDark ? 'border border-red-500/40 text-red-300 hover:bg-red-500/10' : 'border-2 border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
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
