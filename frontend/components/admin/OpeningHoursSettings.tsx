'use client';

import { useEffect, useState } from 'react';
import { useAdminContext } from '@/app/admin/admin-context';
import { getTenantSlug } from '@/lib/tenant-utils';
import {
  getTenantOperationsSettings,
  updateTenantOperationsSettings,
  TenantOperationsSettings,
} from '@/lib/api';
import { OpeningHours, getDefaultOpeningHours } from '@/lib/opening-hours';
import { SettingsBadge, SettingsCard, SettingsCardHeader, SettingsIconButton, SettingsToggle } from '@/components/admin/SettingsCard';

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

function mergeWithDefaults(openingHours?: OpeningHours | null): OpeningHours {
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
  const { selectedTenant } = useAdminContext();
  const [tenantSettings, setTenantSettings] = useState<TenantOperationsSettings | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>('pornopizza');
  const [openingHours, setOpeningHours] = useState<OpeningHours>(getDefaultOpeningHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const activeSlug = normalizeSlug(
          selectedTenant && selectedTenant !== 'all' ? selectedTenant : getTenantSlug(),
        );
        setTenantSlug(activeSlug);
        const data = await getTenantOperationsSettings(activeSlug);
        setTenantSettings(data);
        setOpeningHours(mergeWithDefaults(data.openingHours as OpeningHours | null));
      } catch (error) {
        console.error('Failed to load opening hours:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedTenant]);

  const persist = async (next: OpeningHours) => {
    const updated = await updateTenantOperationsSettings(tenantSlug, {
      openingHours: next,
    });
    setTenantSettings(updated);
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
    const previous = openingHours;
    const next = { ...openingHours, enabled: !openingHours.enabled };
    setOpeningHours(next);
    try {
      await persist(next);
    } catch (error: any) {
      console.error('Failed to toggle opening hours:', error);
      setOpeningHours(previous);
      alert(`Nepodarilo sa prepnúť otváracie hodiny: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDayChange = (
    dayKey: keyof OpeningHours['days'],
    field: 'open' | 'close' | 'closed',
    value: string | boolean,
  ) => {
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

  return (
    <SettingsCard tone="soft-dark" className="min-h-[214px]">
      <SettingsCardHeader
        eyebrow="Operations"
        title="Otváracie hodiny"
        subtitle={`Brand: ${tenantSettings?.tenantSubdomain || tenantSlug}`}
        action={
          <div className="flex items-center gap-3">
            <SettingsToggle checked={openingHours.enabled} onClick={handleToggleEnabled} />
            <SettingsIconButton onClick={() => setIsExpanded((v) => !v)}>
              {isExpanded ? 'Zbaliť' : 'Rozbaliť'}
            </SettingsIconButton>
          </div>
        }
      />

      <div className="mt-5 flex flex-wrap gap-2">
        <SettingsBadge tone={openingHours.enabled ? 'success' : 'neutral'}>
          {openingHours.enabled ? 'Prevádzkové hodiny aktívne' : 'Časy sú vypnuté'}
        </SettingsBadge>
        <SettingsBadge tone="neutral" className="border-white/10 bg-white/5 text-zinc-300">
          {openingHours.timezone || 'Europe/Bratislava'}
        </SettingsBadge>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-100">Časové pásmo</label>
            <select
              value={openingHours.timezone || 'Europe/Bratislava'}
              onChange={(e) => setOpeningHours((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full rounded-2xl border border-white/15 bg-white/95 px-3 py-2.5 text-sm text-gray-900"
            >
              <option value="Europe/Bratislava">Europe/Bratislava</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="hidden md:grid md:grid-cols-[130px_140px_1fr_1fr] md:items-center gap-2 text-sm font-semibold text-gray-100 px-2">
            <span>Deň</span>
            <span>Stav</span>
            <span>Otvorené od</span>
            <span>Do</span>
          </div>

          <div className="space-y-2">
            {DAYS.map((day) => {
              const schedule = openingHours.days[day.key];
              return (
                <div
                  key={day.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 md:grid md:grid-cols-[130px_140px_1fr_1fr] md:items-center md:gap-3"
                >
                  <div className="text-sm font-semibold text-white mb-2 md:mb-0">{day.label}</div>
                  <label className="flex items-center gap-2 text-sm text-gray-100 mb-2 md:mb-0">
                    <input
                      type="checkbox"
                      checked={!schedule?.closed}
                      onChange={(e) => handleDayChange(day.key, 'closed', !e.target.checked)}
                    />
                    <span>Otvorené</span>
                  </label>

                  {!schedule?.closed ? (
                    <>
                      <div className="mb-2 md:mb-0">
                        <div className="text-xs text-gray-200 mb-1 md:hidden">Otvorené od</div>
                        <input
                          type="time"
                          value={schedule?.open || '10:00'}
                          onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-200 mb-1 md:hidden">Do</div>
                        <input
                          type="time"
                          value={schedule?.close || '22:00'}
                          onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-200 mb-1 md:mb-0">Zatvorené</div>
                      <div className="text-sm text-gray-200">Zatvorené</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Ukladám...' : 'Uložiť'}
          </button>
        </div>
      )}

      {!isExpanded && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          Rozbalením upravíš týždenný režim, časové pásmo a zavretia po dňoch. Toggle hore ostáva okamžitý.
        </div>
      )}
    </SettingsCard>
  );
}
