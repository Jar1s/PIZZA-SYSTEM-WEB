'use client';

import { useState, useEffect } from 'react';
import { getTenant, updateTenant } from '@/lib/api';
import { Tenant } from '@/shared';

export function MaintenanceBanner() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        // Load pornopizza tenant
        const tenantData = await getTenant('pornopizza');
        setTenant(tenantData);
        
        // Get maintenance mode from theme
        const theme = typeof tenantData.theme === 'object' && tenantData.theme !== null 
          ? tenantData.theme as any
          : {};
        
        setMaintenanceMode(theme.maintenanceMode === true);
      } catch (error) {
        console.error('Failed to load tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  const handleToggle = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
        ? tenant.theme as any
        : {};
      
      const newMaintenanceMode = !maintenanceMode;
      
      await updateTenant(tenant.subdomain || tenant.slug, {
        theme: {
          ...theme,
          maintenanceMode: newMaintenanceMode,
        },
      });
      
      setMaintenanceMode(newMaintenanceMode);
      
      // Reload tenant to get updated data
      const updatedTenant = await getTenant('pornopizza');
      setTenant(updatedTenant);
    } catch (error: any) {
      console.error('Failed to update maintenance mode:', error);
      alert('Nepodarilo sa aktualizovať maintenance mode: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#fefaf5] rounded-lg p-6 mb-6 border border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#f97316] mb-2">
            Momentálne neprijímame nové objednávky!
          </h2>
          <div className="flex items-center gap-2 text-gray-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">Príprava na začatie práce</span>
          </div>
        </div>
        
        <div className="ml-6 flex items-center gap-3">
          <span className={`text-sm font-medium ${maintenanceMode ? 'text-orange-600' : 'text-gray-500'}`}>
            {maintenanceMode ? 'Zapnuté' : 'Vypnuté'}
          </span>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
              maintenanceMode ? 'bg-orange-600' : 'bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                maintenanceMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

