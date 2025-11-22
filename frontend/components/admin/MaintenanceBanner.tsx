'use client';

import { useState, useEffect } from 'react';
import { getTenant, updateTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { isCurrentlyOpen, getNextOpeningTime } from '@/lib/opening-hours';

export function MaintenanceBanner() {
  const { t } = useLanguage();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoMaintenanceMode, setAutoMaintenanceMode] = useState(false);
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
        
        // Check automatic maintenance mode based on opening hours
        if (theme.openingHours) {
          const isOpen = isCurrentlyOpen(theme.openingHours);
          setAutoMaintenanceMode(!isOpen);
        }
      } catch (error) {
        console.error('Failed to load tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, []);

  // Check opening hours every minute
  useEffect(() => {
    if (!tenant) return;

    const checkOpeningHours = () => {
      const theme = typeof tenant.theme === 'object' && tenant.theme !== null 
        ? tenant.theme as any
        : {};
      if (theme.openingHours) {
        const isOpen = isCurrentlyOpen(theme.openingHours);
        setAutoMaintenanceMode(!isOpen);
      }
    };

    // Check immediately
    checkOpeningHours();

    // Then check every minute
    const interval = setInterval(checkOpeningHours, 60000);

    return () => clearInterval(interval);
  }, [tenant]);

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

  const theme = typeof tenant?.theme === 'object' && tenant?.theme !== null 
    ? tenant.theme as any
    : {};
  const openingHours = theme.openingHours;
  const effectiveMaintenanceMode = maintenanceMode || autoMaintenanceMode;
  const nextOpening = getNextOpeningTime(openingHours);

  return (
    <div className="bg-[#fefaf5] rounded-lg p-6 mb-6 border border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#f97316] mb-2">
            {t.maintenanceModeTitle} (Manuálne)
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
            <span className="text-sm">{t.maintenanceModeSubtitle}</span>
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

      {openingHours?.enabled && (
        <div className="pt-4 border-t border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Automatický režim (podľa otváracích hodín)
              </h3>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <span className={`px-2 py-1 rounded ${autoMaintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {autoMaintenanceMode ? 'Zatvorené' : 'Otvorené'}
                </span>
                {autoMaintenanceMode && nextOpening && (
                  <span className="text-gray-500">• {nextOpening}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Aktuálny stav: <strong>{effectiveMaintenanceMode ? 'Neprijímame objednávky' : 'Prijímame objednávky'}</strong>
            {maintenanceMode && autoMaintenanceMode && ' (Manuálne + Automaticky)'}
            {maintenanceMode && !autoMaintenanceMode && ' (Len manuálne)'}
            {!maintenanceMode && autoMaintenanceMode && ' (Len automaticky)'}
          </div>
        </div>
      )}
    </div>
  );
}

