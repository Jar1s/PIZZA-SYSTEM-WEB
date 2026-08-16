'use client';

import { useEffect, useState } from 'react';
import { useAdminContext } from '@/app/admin/admin-context';
import { getTenantSlug } from '@/lib/tenant-utils';
import {
  getTenantDeliverySettings,
  listWoltWebhooks,
  refreshWoltDeliveryAreas,
  registerWoltWebhook,
  updateTenantDeliverySettings,
  TenantDeliverySettings,
  WoltWebhookRegistrationResult,
} from '@/lib/api';

const WOLT_PROD_URL = 'https://daas-public-api.wolt.com';
const WOLT_DEV_URL = 'https://daas-public-api.development.dev.woltapi.com';

// Empty URL falls back to the production host on the backend, so only an
// explicit development host counts as the test environment.
function isTestEnvironment(apiUrl: string): boolean {
  return apiUrl.includes('development.dev.woltapi');
}
import { SettingsBadge, SettingsCard, SettingsCardHeader, SettingsIconButton } from '@/components/admin/SettingsCard';

function normalizeSlug(slug: string | null): string {
  if (!slug) return 'pornopizza';
  if (slug === 'p0rnopizza') return 'pornopizza';
  if (slug === 'pizzaparty') return 'partypizza';
  return slug;
}

function compactValue(value: string, visible = 6): string {
  const normalized = String(value || '').trim();
  if (!normalized) return 'n/a';
  if (normalized.length <= visible * 2 + 1) return normalized;
  return `${normalized.slice(0, visible)}…${normalized.slice(-visible)}`;
}

function isPresent(value: string): boolean {
  return Boolean(String(value || '').trim());
}

export function WoltSettings() {
  const { selectedTenant } = useAdminContext();
  const [tenantSlug, setTenantSlug] = useState('pornopizza');
  const [tenantSettings, setTenantSettings] = useState<TenantDeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhookSyncing, setWebhookSyncing] = useState(false);
  const [areasTesting, setAreasTesting] = useState(false);
  const [areasResult, setAreasResult] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<WoltWebhookRegistrationResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [defaultFeeCents, setDefaultFeeCents] = useState('0');
  const [pickupStreet, setPickupStreet] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [pickupCountry, setPickupCountry] = useState('SK');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const activeSlug = normalizeSlug(
          selectedTenant && selectedTenant !== 'all' ? selectedTenant : getTenantSlug(),
        );
        setTenantSlug(activeSlug);
        const settings = await getTenantDeliverySettings(activeSlug);
        setTenantSettings(settings);

        const deliveryConfig = settings.deliveryConfig || {};
        const woltConfig = deliveryConfig.woltConfig || {};
        const pickupAddress = deliveryConfig.pickupAddress || {};

        setApiKey(woltConfig.apiKey || '');
        setApiUrl(woltConfig.apiUrl || '');
        setMerchantId(woltConfig.merchantId || '');
        setVenueId(woltConfig.venueId || '');
        setWebhookSecret(woltConfig.webhookSecret || '');
        setDefaultFeeCents(String(deliveryConfig.defaultFeeCents ?? 0));
        setPickupStreet(pickupAddress.street || '');
        setPickupCity(pickupAddress.city || '');
        setPickupPostalCode(pickupAddress.postalCode || '');
        setPickupCountry(pickupAddress.country || 'SK');
        setPickupPhone(pickupAddress.phone || '');
        setPickupLat(pickupAddress.coordinates?.lat?.toString() || '');
        setPickupLng(pickupAddress.coordinates?.lng?.toString() || '');
        setPickupInstructions(pickupAddress.instructions || '');
      } catch (error) {
        console.error('Failed to load Wolt settings:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedTenant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = tenantSettings?.deliveryConfig || {};
      const nextWoltConfig = {
        ...(existing.woltConfig || {}),
        apiKey: apiKey.trim() || undefined,
        apiUrl: apiUrl.trim() || undefined,
        merchantId: merchantId.trim() || undefined,
        venueId: venueId.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
      };
      const hasPickupAddress =
        pickupStreet.trim() &&
        pickupCity.trim() &&
        pickupPostalCode.trim() &&
        pickupCountry.trim();
      const nextDeliveryConfig: Record<string, any> = {
        ...existing,
        defaultFeeCents: Number(defaultFeeCents) || 0,
        woltConfig: nextWoltConfig,
        pickupAddress: hasPickupAddress
          ? {
              street: pickupStreet.trim(),
              city: pickupCity.trim(),
              postalCode: pickupPostalCode.trim(),
              country: pickupCountry.trim() || 'SK',
              phone: pickupPhone.trim() || undefined,
              instructions: pickupInstructions.trim() || undefined,
              coordinates:
                pickupLat.trim() && pickupLng.trim()
                  ? {
                      lat: Number(pickupLat),
                      lng: Number(pickupLng),
                    }
                  : undefined,
            }
          : existing.pickupAddress,
      };

      const updated = await updateTenantDeliverySettings(tenantSlug, nextDeliveryConfig);
      setTenantSettings(updated);
      alert('Wolt a delivery nastavenia boli uložené.');
    } catch (error: any) {
      console.error('Failed to save Wolt settings:', error);
      alert(`Nepodarilo sa uložiť Wolt nastavenia: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleListWebhooks = async () => {
    setWebhookSyncing(true);
    try {
      const result = await listWoltWebhooks(tenantSlug);
      setWebhookStatus(result);
    } catch (error: any) {
      alert(`Nepodarilo sa načítať Wolt webhooky: ${error?.message || 'Unknown error'}`);
    } finally {
      setWebhookSyncing(false);
    }
  };

  const handleRegisterWebhook = async () => {
    setWebhookSyncing(true);
    try {
      const result = await registerWoltWebhook(tenantSlug);
      setWebhookStatus(result);
      alert(`Wolt webhook bol ${result.action === 'updated' ? 'aktualizovaný' : 'vytvorený'}.`);
    } catch (error: any) {
      alert(`Nepodarilo sa registrovať Wolt webhook: ${error?.message || 'Unknown error'}`);
    } finally {
      setWebhookSyncing(false);
    }
  };

  // Proves the SAVED credentials against the Wolt API by fetching the live
  // delivery-area polygons — the definitive "keys work" check after an
  // environment switch.
  const handleTestAreas = async () => {
    setAreasTesting(true);
    setAreasResult(null);
    try {
      const result = await refreshWoltDeliveryAreas(tenantSlug);
      if (result.polygons === 0) {
        setAreasResult('⚠️ Pripojenie funguje, ale Wolt nevrátil žiadne zóny — over Merchant ID pre toto prostredie.');
      } else {
        setAreasResult(`✅ Pripojenie OK — Wolt vrátil ${result.polygons} ${result.polygons === 1 ? 'zónu' : result.polygons < 5 ? 'zóny' : 'zón'}.`);
      }
    } catch (error: any) {
      setAreasResult(`❌ Test zlyhal: ${error?.message || 'neznáma chyba'}. Skontroluj API key/URL a či sú zmeny uložené.`);
    } finally {
      setAreasTesting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse rounded-[28px] bg-gray-200 h-24" />;
  }

  return (
    <SettingsCard className="min-h-[214px]">
      <SettingsCardHeader
        eyebrow="Courier"
        title="Wolt + Delivery"
        subtitle={`Brand: ${tenantSettings?.tenantSubdomain || tenantSlug}`}
        action={<SettingsIconButton onClick={() => setIsExpanded((value) => !value)}>{isExpanded ? 'Zbaliť' : 'Rozbaliť'}</SettingsIconButton>}
      />

      {!isExpanded ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <SettingsBadge tone={isTestEnvironment(apiUrl) ? 'warning' : 'success'}>
              {isTestEnvironment(apiUrl) ? '🧪 TESTOVACIE prostredie' : '🟢 OSTRÉ prostredie'}
            </SettingsBadge>
            <SettingsBadge tone={isPresent(apiKey) ? 'success' : 'warning'}>API key {isPresent(apiKey) ? 'OK' : 'chýba'}</SettingsBadge>
            <SettingsBadge tone={isPresent(apiUrl) ? 'success' : 'warning'}>API URL {isPresent(apiUrl) ? 'OK' : 'chýba'}</SettingsBadge>
            <SettingsBadge tone={isPresent(venueId) ? 'success' : 'warning'}>Venue {isPresent(venueId) ? 'OK' : 'chýba'}</SettingsBadge>
            <SettingsBadge tone={isPresent(merchantId) ? 'success' : 'warning'}>Merchant {isPresent(merchantId) ? 'OK' : 'chýba'}</SettingsBadge>
            <SettingsBadge tone={isPresent(webhookSecret) ? 'success' : 'warning'}>Webhook secret {isPresent(webhookSecret) ? 'OK' : 'env/DB chýba?'}</SettingsBadge>
            <SettingsBadge tone={isPresent(pickupStreet) && isPresent(pickupCity) && isPresent(pickupPostalCode) ? 'success' : 'warning'}>
              Pickup {isPresent(pickupStreet) && isPresent(pickupCity) && isPresent(pickupPostalCode) ? 'OK' : 'chýba'}
            </SettingsBadge>
          </div>
          <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Venue ID</div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">{compactValue(venueId)}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Merchant ID</div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">{compactValue(merchantId)}</div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Pickup adresa</div>
              <div className="mt-2 text-sm font-semibold text-zinc-900">
                {pickupStreet ? `${pickupStreet}${pickupCity ? `, ${pickupCity}` : ''}` : 'n/a'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4 border-t border-zinc-200 pt-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Wolt API key</label>
              <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Wolt API URL</label>
              <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm" placeholder={WOLT_PROD_URL} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isTestEnvironment(apiUrl) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isTestEnvironment(apiUrl) ? '🧪 TESTOVACIE prostredie — kuriéri sú len simulovaní' : '🟢 OSTRÉ prostredie — objednáva skutočných kuriérov'}
                </span>
                <button
                  type="button"
                  onClick={() => setApiUrl(WOLT_PROD_URL)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Použiť ostré URL
                </button>
                <button
                  type="button"
                  onClick={() => setApiUrl(WOLT_DEV_URL)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Použiť testovacie URL
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Pri prepnutí prostredia treba vymeniť aj API key, Merchant ID a Venue ID za hodnoty z daného prostredia — potom ulož a spusti „Otestovať zóny".
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Merchant ID</label>
              <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Venue ID</label>
              <input value={venueId} onChange={(e) => setVenueId(e.target.value)} className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Webhook secret</label>
              <input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm" />
              <div className="mt-1 text-[11px] text-zinc-500">
                Backend použije najprv Render env WOLT_WEBHOOK_SECRET, potom túto tenant hodnotu.
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Default fee (cents)</label>
              <input value={defaultFeeCents} onChange={(e) => setDefaultFeeCents(e.target.value)} className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm" type="number" min="0" />
            </div>
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Wolt webhook</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Registruje callback do Woltu cez merchant webhook endpoint.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleListWebhooks}
                  disabled={webhookSyncing}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  Skontrolovať
                </button>
                <button
                  type="button"
                  onClick={handleRegisterWebhook}
                  disabled={webhookSyncing}
                  className="rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {webhookSyncing ? 'Pracujem...' : 'Registrovať webhook'}
                </button>
                <button
                  type="button"
                  onClick={handleTestAreas}
                  disabled={areasTesting}
                  className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {areasTesting ? 'Testujem...' : 'Otestovať zóny'}
                </button>
              </div>
            </div>
            {areasResult && (
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800" role="status">
                {areasResult}
              </div>
            )}
            {webhookStatus && (
              <div className="mt-4 rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-700">
                <div><strong>Callback:</strong> {webhookStatus.callbackUrl}</div>
                {webhookStatus.action && <div><strong>Akcia:</strong> {webhookStatus.action}</div>}
                {webhookStatus.webhookId && <div><strong>Webhook ID:</strong> {compactValue(webhookStatus.webhookId, 10)}</div>}
                {Array.isArray(webhookStatus.webhooks) && (
                  <div><strong>Počet webhookov:</strong> {webhookStatus.webhooks.length}</div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Pickup address</div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={pickupStreet} onChange={(e) => setPickupStreet(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Street" />
              <input value={pickupCity} onChange={(e) => setPickupCity(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="City" />
              <input value={pickupPostalCode} onChange={(e) => setPickupPostalCode(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Postal code" />
              <input value={pickupCountry} onChange={(e) => setPickupCountry(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Country" />
              <input value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Kitchen phone" />
              <input value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Instructions" />
              <input value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Latitude" />
              <input value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm" placeholder="Longitude" />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Ukladám...' : 'Uložiť Wolt nastavenia'}
          </button>
        </div>
      )}
    </SettingsCard>
  );
}
