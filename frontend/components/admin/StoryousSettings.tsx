'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getStoryousSettings,
  updateStoryousSettings,
  getStoryousAutoPrintReadiness,
  getStoryousModifierMappings,
  updateStoryousModifierMappings,
  autoFillStoryousModifierMappings,
  StoryousSettings as StoryousSettingsType,
  StoryousAutoPrintReadiness,
  StoryousModifierMappingInput,
} from '@/lib/api';
import { useAdminContext } from '@/app/admin/admin-context';
import { getCustomizationOptions } from '@/shared/types/customization-options';
import { SettingsBadge, SettingsCard, SettingsCardHeader, SettingsIconButton } from '@/components/admin/SettingsCard';

type MappingDraft = {
  optionId: string;
  label: string;
  externalAdditionId: string;
  labelOverride: string;
};

const STORYOUS_MAPPING_OPTIONS = (() => {
  const buckets = [
    ...getCustomizationOptions('PIZZA'),
    ...getCustomizationOptions('STANGLE'),
  ];
  const seen = new Set<string>();
  const result: Array<{ optionId: string; label: string }> = [];

  for (const bucket of buckets) {
    for (const option of bucket.options) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      result.push({
        optionId: option.id,
        label: option.name,
      });
    }
  }

  return result.sort((a, b) => a.label.localeCompare(b.label, 'sk'));
})();

export function StoryousSettings() {
  const { selectedTenant } = useAdminContext();
  const [settings, setSettings] = useState<StoryousSettingsType | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [defaultDeliveryLeadMinutes, setDefaultDeliveryLeadMinutes] = useState(45);
  const [autoAcceptPrintMode, setAutoAcceptPrintMode] = useState(true);
  const [receiptIncludeModifierLines, setReceiptIncludeModifierLines] = useState(true);
  const [receiptIncludeOrderNumber, setReceiptIncludeOrderNumber] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [readiness, setReadiness] = useState<StoryousAutoPrintReadiness | null>(null);
  const [mappingDrafts, setMappingDrafts] = useState<Record<string, MappingDraft>>({});
  const [mappingLoading, setMappingLoading] = useState(false);
  const [autoFillingMappings, setAutoFillingMappings] = useState(false);

  const activeTenantSlug = selectedTenant && selectedTenant !== 'all' ? selectedTenant : null;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [data, readinessData] = await Promise.all([
          getStoryousSettings(),
          getStoryousAutoPrintReadiness(),
        ]);
        setReadiness(readinessData);
        if (data) {
          setSettings(data);
          setClientId(data.clientId || '');
          setClientSecret(data.clientSecret || '');
          setMerchantId(data.merchantId || '');
          setPlaceId(data.placeId || '');
          setEnabled(data.enabled || false);
          setAutoSync(data.autoSync || false);
          setDefaultDeliveryLeadMinutes(data.defaultDeliveryLeadMinutes ?? 45);
          setAutoAcceptPrintMode(data.autoAcceptPrintMode ?? true);
          setReceiptIncludeModifierLines(data.receiptIncludeModifierLines ?? true);
          setReceiptIncludeOrderNumber(data.receiptIncludeOrderNumber ?? true);
        }
      } catch (error) {
        console.error('Failed to load Storyous settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadMappings = async () => {
      if (!activeTenantSlug) {
        setMappingDrafts({});
        return;
      }

      setMappingLoading(true);
      try {
        const currentMappings = await getStoryousModifierMappings(activeTenantSlug);
        const byOptionId = new Map(
          currentMappings.map((mapping) => [
            mapping.optionId,
            {
              externalAdditionId: mapping.externalAdditionId,
              labelOverride: mapping.labelOverride || '',
            },
          ]),
        );

        const nextDrafts: Record<string, MappingDraft> = {};
        for (const option of STORYOUS_MAPPING_OPTIONS) {
          nextDrafts[option.optionId] = {
            optionId: option.optionId,
            label: option.label,
            externalAdditionId: byOptionId.get(option.optionId)?.externalAdditionId || '',
            labelOverride: byOptionId.get(option.optionId)?.labelOverride || '',
          };
        }
        setMappingDrafts(nextDrafts);
      } catch (error) {
        console.error('Failed to load Storyous modifier mappings:', error);
      } finally {
        setMappingLoading(false);
      }
    };

    loadMappings();
  }, [activeTenantSlug]);

  const mappedCount = useMemo(
    () => Object.values(mappingDrafts).filter((draft) => draft.externalAdditionId.trim().length > 0).length,
    [mappingDrafts],
  );

  const handleSave = async () => {
    if (!clientId || !clientSecret || !merchantId || !placeId) {
      alert('Vyplňte všetky povinné polia (ClientID, Secret, MerchantID, PlaceID)');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateStoryousSettings({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        merchantId: merchantId.trim(),
        placeId: placeId.trim(),
        enabled,
        autoSync,
        defaultDeliveryLeadMinutes: Math.max(1, Number(defaultDeliveryLeadMinutes) || 45),
        autoAcceptPrintMode,
        receiptIncludeModifierLines,
        receiptIncludeOrderNumber,
      });

      if (activeTenantSlug) {
        const mappingsToSave: StoryousModifierMappingInput[] = Object.values(mappingDrafts)
          .filter((draft) => draft.externalAdditionId.trim().length > 0)
          .map((draft) => ({
            optionId: draft.optionId,
            externalAdditionId: draft.externalAdditionId.trim(),
            labelOverride: draft.labelOverride.trim() || null,
          }));

        await updateStoryousModifierMappings(activeTenantSlug, mappingsToSave);
      }

      setSettings(updated);
      const readinessData = await getStoryousAutoPrintReadiness();
      setReadiness(readinessData);
      alert('Nastavenia Storyous boli uložené.');
    } catch (error: any) {
      console.error('Failed to update Storyous settings:', error);
      alert('Nepodarilo sa uložiť nastavenia: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFillMappings = async () => {
    if (!activeTenantSlug) {
      alert('Vyber najprv konkrétny brand.');
      return;
    }

    if (!clientId || !clientSecret || !merchantId || !placeId) {
      alert('Najprv doplňte a uložte Storyous credentials a merchant/place.');
      return;
    }

    setAutoFillingMappings(true);
    try {
      const result = await autoFillStoryousModifierMappings(activeTenantSlug);
      const byOptionId = new Map(
        result.mappings.map((mapping) => [
          mapping.optionId,
          {
            externalAdditionId: mapping.externalAdditionId,
            labelOverride: mapping.labelOverride || '',
          },
        ]),
      );

      const nextDrafts: Record<string, MappingDraft> = {};
      for (const option of STORYOUS_MAPPING_OPTIONS) {
        nextDrafts[option.optionId] = {
          optionId: option.optionId,
          label: option.label,
          externalAdditionId: byOptionId.get(option.optionId)?.externalAdditionId || '',
          labelOverride: byOptionId.get(option.optionId)?.labelOverride || '',
        };
      }

      setMappingDrafts(nextDrafts);
      alert(
        `Auto-fill hotový. Spárované: ${result.matchedCount}, nejednoznačné: ${result.ambiguousCount}, bez zhody: ${result.unmatchedCount}.`,
      );
    } catch (error: any) {
      console.error('Failed to auto-fill Storyous mappings:', error);
      alert('Nepodarilo sa načítať Storyous additions: ' + (error.message || 'Unknown error'));
    } finally {
      setAutoFillingMappings(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-24 rounded-[28px]" />;
  }

  return (
    <SettingsCard className="min-h-[214px]">
      <SettingsCardHeader
        eyebrow="POS"
        title="Storyous"
        subtitle={
          activeTenantSlug
            ? `Brand: ${activeTenantSlug}`
            : 'Vyber brand, ak chceš upravovať addition mappings.'
        }
        action={<SettingsIconButton onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? 'Zbaliť' : 'Rozbaliť'}</SettingsIconButton>}
      />

      {!isExpanded ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <SettingsBadge tone={enabled ? 'success' : 'neutral'}>
              {enabled ? 'Aktivované' : 'Deaktivované'}
            </SettingsBadge>
            <SettingsBadge tone={autoSync ? 'accent' : 'neutral'}>
              Auto-sync {autoSync ? 'zap.' : 'vyp.'}
            </SettingsBadge>
          </div>
          {enabled ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Delivery lead</div>
                  <div className="mt-2 text-lg font-black text-zinc-900">{defaultDeliveryLeadMinutes} min</div>
                  <div className="mt-1 text-xs text-zinc-500">Predvolený lead pre auto-sync a preview.</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Modifier mappings</div>
                  <div className="mt-2 text-lg font-black text-zinc-900">{mappedCount}/{STORYOUS_MAPPING_OPTIONS.length}</div>
                  <div className="mt-1 text-xs text-zinc-500">Naspárované additions pre receipt sync.</div>
                </div>
              </div>
              {readiness ? (
                <SettingsBadge tone={readiness.ready ? 'success' : 'warning'}>
                  {readiness.ready ? 'Auto-confirm readiness OK' : 'Auto-confirm readiness treba doladiť'}
                </SettingsBadge>
              ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 space-y-4 border-t border-zinc-200 pt-5">
          {readiness ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs">
              <div className={`font-semibold ${readiness.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
                {readiness.ready ? '✅ Auto-confirm readiness: OK' : '⚠️ Auto-confirm readiness: nie je úplne pripravené'}
              </div>
              {readiness.blockers.length > 0 ? (
                <div className="mt-1 text-red-700">
                  {readiness.blockers.map((item, idx) => (
                    <div key={`blocker-${idx}`}>• {item}</div>
                  ))}
                </div>
              ) : null}
              {readiness.warnings.length > 0 ? (
                <div className="mt-1 text-amber-700">
                  {readiness.warnings.map((item, idx) => (
                    <div key={`warning-${idx}`}>• {item}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">ClientID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">MerchantID</label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={saving}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">PlaceID</label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                disabled={saving}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={saving} className="rounded" />
            <span className="text-xs text-gray-700">Aktivovať Storyous</span>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} disabled={saving || !enabled} className="rounded" />
            <span className="text-xs text-gray-700">Automatické posielanie</span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Default delivery lead (min)</label>
            <input
              type="number"
              min={1}
              max={240}
              value={defaultDeliveryLeadMinutes}
              onChange={(e) => setDefaultDeliveryLeadMinutes(Number(e.target.value))}
              disabled={saving}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={autoAcceptPrintMode} onChange={(e) => setAutoAcceptPrintMode(e.target.checked)} disabled={saving || !enabled} className="rounded" />
            <span className="text-xs text-gray-700">Auto-confirm v Storyous</span>
          </div>

          <div className="text-[11px] text-gray-500">
            Auto-confirm, autoSync a ostatné existujúce Storyous správanie ostáva bezo zmeny. Táto sekcia len dopĺňa modifier addition mappings pre receipt.
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={receiptIncludeModifierLines} onChange={(e) => setReceiptIncludeModifierLines(e.target.checked)} disabled={saving || !enabled} className="rounded" />
            <span className="text-xs text-gray-700">Tlačiť + modifikátory na bloček</span>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={receiptIncludeOrderNumber} onChange={(e) => setReceiptIncludeOrderNumber(e.target.checked)} disabled={saving || !enabled} className="rounded" />
            <span className="text-xs text-gray-700">Tlačiť číslo objednávky</span>
          </div>

          <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-3">
            <div className="mb-1 text-xs font-semibold text-gray-900">Storyous modifier addition mappings</div>
            {activeTenantSlug ? (
              <>
                <div className="mb-2 text-[11px] text-gray-500">
                  Ak modifier nemá addition ID, backend ho pošle fallbackom cez note. To zachová sync, ale preview ukáže warning.
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillMappings}
                    disabled={saving || mappingLoading || autoFillingMappings}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {autoFillingMappings ? 'Načítavam additions...' : 'Auto-fill zo Storyous'}
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Načíta additions z aktuálneho Storyous menu a doplní len jednoznačné zhody podľa názvu.
                  </span>
                </div>
                {mappingLoading ? (
                  <div className="text-xs text-gray-500">Načítavam mappings...</div>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {STORYOUS_MAPPING_OPTIONS.map((option) => {
                      const draft = mappingDrafts[option.optionId] || {
                        optionId: option.optionId,
                        label: option.label,
                        externalAdditionId: '',
                        labelOverride: '',
                      };

                      return (
                        <div key={option.optionId} className="rounded-2xl border border-gray-200 bg-white p-3">
                          <div className="text-[11px] font-semibold text-gray-900">{option.label}</div>
                          <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-gray-400">{option.optionId}</div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <input
                              type="text"
                              value={draft.externalAdditionId}
                              onChange={(e) =>
                                setMappingDrafts((prev) => ({
                                  ...prev,
                                  [option.optionId]: {
                                    ...draft,
                                    externalAdditionId: e.target.value,
                                  },
                                }))
                              }
                              disabled={saving}
                              className="rounded-xl border border-zinc-200 px-2 py-1.5 text-xs"
                              placeholder="Storyous additionId"
                            />
                            <input
                              type="text"
                              value={draft.labelOverride}
                              onChange={(e) =>
                                setMappingDrafts((prev) => ({
                                  ...prev,
                                  [option.optionId]: {
                                    ...draft,
                                    labelOverride: e.target.value,
                                  },
                                }))
                              }
                              disabled={saving}
                              className="rounded-xl border border-zinc-200 px-2 py-1.5 text-xs"
                              placeholder="Preview label override"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-500">Vyber konkrétny brand v hornej lište. Mappings sú tenant-specific.</div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Ukladá sa...' : 'Uložiť'}
          </button>
        </div>
      )}
    </SettingsCard>
  );
}
