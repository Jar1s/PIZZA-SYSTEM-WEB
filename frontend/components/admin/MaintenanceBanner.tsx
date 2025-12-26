'use client';

import { useState, useEffect } from 'react';
import { getTenant, updateTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { isCurrentlyOpen, getNextOpeningTime } from '@/lib/opening-hours';
import { getTenantSlug } from '@/lib/tenant-utils';

export function MaintenanceBanner() {
  const { t } = useLanguage();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoMaintenanceMode, setAutoMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const normalizeSlug = (slug: string) => {
    if (slug === 'p0rnopizza') return 'pornopizza';
    if (slug === 'pizzaparty') return 'partypizza';
    return slug;
  };
  const tenantSlugsToUpdate = ['pornopizza', 'partypizza', 'pizzavnudzi'];

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantSlug = normalizeSlug(getTenantSlug());
        const tenantData = await getTenant(tenantSlug);
        setTenant(tenantData);
        
        // Get maintenance mode from theme
        const theme = typeof tenantData.theme === 'object' && tenantData.theme !== null 
          ? tenantData.theme as any
          : {};
        
        setMaintenanceMode(theme.maintenanceMode === true);
        
        // Check automatic maintenance mode based on opening hours
        // Only apply if opening hours are enabled
        if (theme.openingHours?.enabled === true) {
          const isOpen = isCurrentlyOpen(theme.openingHours);
          setAutoMaintenanceMode(!isOpen);
        } else {
          setAutoMaintenanceMode(false);
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
      // Only apply automatic maintenance mode if opening hours are enabled
      if (theme.openingHours?.enabled === true) {
        const isOpen = isCurrentlyOpen(theme.openingHours);
        setAutoMaintenanceMode(!isOpen);
      } else {
        setAutoMaintenanceMode(false);
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
      
      // Update all tenants to keep maintenance in sync across brands
      await Promise.allSettled(
        tenantSlugsToUpdate.map(slug => 
          updateTenant(normalizeSlug(slug), {
            theme: {
              ...theme,
              maintenanceMode: newMaintenanceMode,
            },
          })
        )
      );
      
      setMaintenanceMode(newMaintenanceMode);
      
      // Reload tenant to get updated data
      const updatedTenant = await getTenant(tenant.subdomain || tenant.slug || normalizeSlug(getTenantSlug()));
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
  const primaryColor = theme.primaryColor || 'var(--color-primary)';
  const secondaryColor = theme.secondaryColor || '#fefaf5';
  const isSecondaryDark = (() => {
    const hex = secondaryColor.replace('#', '');
    if (hex.length !== 6 && hex.length !== 3) return false;
    const normalized = hex.length === 3 ? hex.split('').map((c: string) => c + c).join('') : hex;
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  })();
  const textColor = isSecondaryDark ? '#f8fafc' : '#111827';
  const mutedText = isSecondaryDark ? '#e5e7eb' : '#4b5563';

  return (
    <div
      className="rounded-lg p-3 border"
      style={{ backgroundColor: secondaryColor, borderColor: primaryColor }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold mb-1 truncate" style={{ color: primaryColor }}>
            {t.maintenanceModeTitle}
          </h2>
          <div className="flex items-center gap-1.5" style={{ color: mutedText }}>
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
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
            <span className="text-xs truncate" style={{ color: mutedText }}>{t.maintenanceModeSubtitle}</span>
          </div>
          {openingHours?.enabled && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`text-xs px-1.5 py-0.5 rounded ${autoMaintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} style={autoMaintenanceMode ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : { backgroundColor: '#dcfce7', color: '#15803d' }}>
                {autoMaintenanceMode ? 'Zatvorené' : 'Otvorené'}
              </span>
              {autoMaintenanceMode && nextOpening && (
                <span className="text-xs truncate" style={{ color: mutedText }}>{nextOpening}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="ml-3 flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: maintenanceMode ? primaryColor : mutedText }}>
            {maintenanceMode ? 'Zap.' : 'Vyp.'}
          </span>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              backgroundColor: maintenanceMode ? primaryColor : '#d1d5db',
              boxShadow: maintenanceMode ? `0 0 0 1px ${primaryColor}` : undefined,
              color: textColor,
            }}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                maintenanceMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
