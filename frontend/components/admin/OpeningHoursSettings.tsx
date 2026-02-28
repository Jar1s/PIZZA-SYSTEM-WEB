'use client';

import { useEffect, useState } from 'react';
import { Tenant } from '@pizza-ecosystem/shared';
import { getTenant, updateTenant } from '@/lib/api';
import { getTenantSlug } from '@/lib/tenant-utils';
import { OpeningHours, getDefaultOpeningHours } from '@/lib/opening-hours';

const DAYS: Array<{ key: keyof OpeningHours['days']; label: string }> = [
  { key: 'monday', label: 'Pondelok' },
  { key: 'tuesday', label: 'Utorok' },
  { key: 'wednesday', label: 'Streda' },
  { key: 'thursday', label: 'Štvrtok' },
  { key: 'friday', label: 'Piatok' },
  { key: 'saturday', label: 'Sobota' },
  { key: 'sunday', label: 'Nedeľa' },
];

function normalizeSlug(slug: string | null): string {
  if (!slug) return 'pornopizza';
  if (slug === 'p0rnopizza') return 'pornopizza';
  if (slug === 'pizzaparty') return 'partypizza';
  return slug;
}

function mergeWithDefaults(openingHours?: OpeningHours): OpeningHours {
  const defaults = getDefaultOpeningHours();
  if (!openingHours) return defaults;
  return {
    ...defaults,
    ...openingHours,
    enabled: openingHours.enabled ?? defaults.enabled,
    timezone: openingHours.timezone || defaults.timezone,
    days: {
      ...defaults.days,
      ...(openingHours.days || {}),
    },
  };
}

export function OpeningHoursSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>('pornopizza');
  const [openingHours, setOpeningHours] = useState<OpeningHours>(getDefaultOpeningHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const slug = normalizeSlug(getTenantSlug());
        setTenantSlug(slug);
        const tenantData = await getTenant(slug);
        setTenant(tenantData);
        const theme = (tenantData.theme as any) || {};
        setOpeningHours(mergeWithDefaults(theme.openingHours));
      } catch (error) {
        console.error('Failed to load opening hours:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persist = async (next: OpeningHours) => {
    if (!tenant) return;
    const theme = (tenant.theme as any) || {};
    await updateTenant(tenantSlug || tenant.slug, {
      theme: {
        ...theme,
        openingHours: next,
      },
    });
    localStorage.setItem('tenant_refresh_ts', Date.now().toString());
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('tenant-updated'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist(openingHours);
      alert('Otváracie hodiny uložené.');
    } catch (error: any) {
      console.error('Failed to save opening hours:', error);
      alert(`Nepodarilo sa uložiť otváracie hodiny: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    const next = { ...openingHours, enabled: !openingHours.enabled };
    setOpeningHours(next);
    try {
      await persist(next);
    } catch (error: any) {
      console.error('Failed to toggle opening hours:', error);
      setOpeningHours(openingHours);
      alert(`Nepodarilo sa prepnúť otváracie hodiny: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDayChange = (dayKey: keyof OpeningHours['days'], field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          ...prev.days[dayKey],
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>
    );
  }

  const theme = (tenant?.theme as any) || {};
  const primaryColor = theme.primaryColor || 'var(--color-primary)';
  const secondaryColor = theme.secondaryColor || '#fefaf5';

  return (
    <div className="rounded-lg p-3 border" style={{ backgroundColor: secondaryColor, borderColor: primaryColor }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold mb-1" style={{ color: primaryColor }}>Otváracie hodiny</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${openingHours.enabled ? 'text-green-600' : 'text-gray-500'}`}>
              {openingHours.enabled ? 'Zap.' : 'Vyp.'}
            </span>
            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                openingHours.enabled ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  openingHours.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="text-xs px-2 py-1 rounded"
          style={{ backgroundColor: primaryColor, color: 'white' }}
        >
          {isExpanded ? 'Zbaliť' : 'Rozbaliť'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Časové pásmo</label>
            <select
              value={openingHours.timezone || 'Europe/Bratislava'}
              onChange={(e) => setOpeningHours((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full text-xs p-2 border rounded"
            >
              <option value="Europe/Bratislava">Europe/Bratislava</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="space-y-2">
            {DAYS.map((day) => {
              const schedule = openingHours.days[day.key];
              return (
                <div key={day.key} className="flex items-center gap-2 text-xs">
                  <div className="w-20">{day.label}</div>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!schedule?.closed}
                      onChange={(e) => handleDayChange(day.key, 'closed', !e.target.checked)}
                    />
                    <span>Otvorené</span>
                  </label>
                  {!schedule?.closed && (
                    <>
                      <input
                        type="time"
                        value={schedule?.open || '10:00'}
                        onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                        className="w-20 p-1 border rounded text-xs"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={schedule?.close || '22:00'}
                        onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                        className="w-20 p-1 border rounded text-xs"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 rounded text-xs font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {saving ? 'Ukladám...' : 'Uložiť'}
          </button>
        </div>
      )}
    </div>
  );
}
