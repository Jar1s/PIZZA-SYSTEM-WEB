'use client';

import { useState, useEffect } from 'react';
import { getTenant, updateTenant } from '@/lib/api';
import { Tenant } from '@pizza-ecosystem/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { isCurrentlyOpen, getNextOpeningTime } from '@/lib/opening-hours';
import { getTenantSlug } from '@/lib/tenant-utils';
import { SettingsBadge, SettingsCard, SettingsCardHeader, SettingsToggle } from '@/components/admin/SettingsCard';

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
  const tenantSlugsToUpdate = Array.from(
    new Set(['pornopizza', 'p0rnopizza', 'partypizza', 'pizzaparty', 'pizzavnudzi'].map(normalizeSlug)),
  );

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
        if (theme.openingHours) {
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
      if (theme.openingHours) {
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
      const maintenancePayload = { theme: { maintenanceMode: newMaintenanceMode } as any };
      
      // Update all tenants to keep maintenance in sync across brands
      await Promise.allSettled(
        tenantSlugsToUpdate.map(slug => 
          updateTenant(normalizeSlug(slug), maintenancePayload)
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

  return (
    <SettingsCard className="min-h-[214px]">
      <SettingsCardHeader
        eyebrow="Operations"
        title={t.maintenanceModeTitle}
        subtitle={t.maintenanceModeSubtitle}
        action={<SettingsToggle checked={maintenanceMode} onClick={handleToggle} disabled={saving} />}
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <SettingsBadge tone={maintenanceMode ? 'danger' : 'success'}>
            {maintenanceMode ? 'Manuálne vypnuté' : 'Manuálne zapnuté'}
          </SettingsBadge>
          {openingHours ? (
            <SettingsBadge tone={autoMaintenanceMode ? 'warning' : 'success'}>
              {autoMaintenanceMode ? 'Prevádzka zatvorená' : 'Prevádzka otvorená'}
            </SettingsBadge>
          ) : null}
        </div>

        {openingHours ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Live režim</div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {effectiveMaintenanceMode ? 'Objednávky sú pozastavené alebo mimo otváracích hodín.' : 'Objednávky prijímaš bez blokácie.'}
            </div>
            {autoMaintenanceMode && nextOpening ? (
              <div className="mt-2 text-sm text-zinc-500">Najbližšie otvorenie: {nextOpening}</div>
            ) : (
              <div className="mt-2 text-sm text-zinc-500">Prepínač sa synchronizuje naprieč brandmi a rešpektuje otváracie hodiny.</div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
            Otváracie hodiny nie sú nastavené, takže maintenance mód riadi len manuálny prepínač.
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl bg-zinc-950 px-4 py-3 text-white">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Stav prijímania</div>
            <div className="mt-1 text-base font-black" style={{ color: primaryColor }}>
              {maintenanceMode ? 'Vyp.' : 'Zap.'}
            </div>
          </div>
          <div className="text-right text-sm text-zinc-400">
            {saving ? 'Ukladám...' : 'Okamžitý prepínač'}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
