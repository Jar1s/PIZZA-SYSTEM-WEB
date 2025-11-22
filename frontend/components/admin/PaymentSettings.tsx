'use client';

import { useState, useEffect } from 'react';
import { getTenant, updateTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';

export function PaymentSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [cashEnabled, setCashEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        // Load pornopizza tenant as master for payment config
        const tenantData = await getTenant('pornopizza');
        setTenant(tenantData);
        
        // Get payment config
        const paymentConfig = (tenantData.paymentConfig as any) || {};
        setCashEnabled(paymentConfig.cashOnDeliveryEnabled === true);
        setCardEnabled(paymentConfig.cardOnDeliveryEnabled === true);
      } catch (error) {
        console.error('Failed to load tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  const handleSave = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const paymentConfig = {
        ...((tenant.paymentConfig as any) || {}),
        cashOnDeliveryEnabled: cashEnabled,
        cardOnDeliveryEnabled: cardEnabled,
      };
      
      await updateTenant(tenant.subdomain || tenant.slug, {
        paymentConfig: paymentConfig as any,
      });
      
      // Reload tenant to get updated data
      const updatedTenant = await getTenant('pornopizza');
      setTenant(updatedTenant);
      
      alert('Nastavenia platieb boli uložené! Zmeny sa aplikujú na všetky weby.');
    } catch (error: any) {
      console.error('Failed to update payment settings:', error);
      alert('Nepodarilo sa uložiť nastavenia: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">
            Platby pri dodaní
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Aplikuje sa na všetky weby
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-3 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-shrink-0"
        >
          {saving ? '...' : 'Uložiť'}
        </button>
      </div>
      
      <div className="space-y-1.5">
        {/* Cash Payment Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-900">
            Hotovosť
          </label>
          <button
            onClick={() => setCashEnabled(!cashEnabled)}
            disabled={saving}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              cashEnabled ? 'bg-green-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                cashEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        
        {/* Card Payment Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-900">
            Platba kartou
          </label>
          <button
            onClick={() => setCardEnabled(!cardEnabled)}
            disabled={saving}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              cardEnabled ? 'bg-green-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                cardEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

