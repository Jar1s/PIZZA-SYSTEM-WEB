'use client';

import { useEffect, useState } from 'react';
import { useAdminContext } from '@/app/admin/admin-context';
import { getTenantSlug } from '@/lib/tenant-utils';
import {
  getTenantPaymentSettings,
  updateTenantPaymentSettings,
  TenantPaymentSettings,
} from '@/lib/api';
import { SettingsBadge, SettingsCard, SettingsCardHeader, SettingsToggle } from '@/components/admin/SettingsCard';

function normalizeSlug(slug: string | null): string {
  if (!slug) return 'pornopizza';
  if (slug === 'p0rnopizza') return 'pornopizza';
  if (slug === 'pizzaparty') return 'partypizza';
  return slug;
}

export function PaymentSettings() {
  const { selectedTenant } = useAdminContext();
  const [tenantSettings, setTenantSettings] = useState<TenantPaymentSettings | null>(null);
  const [tenantSlug, setTenantSlug] = useState('pornopizza');
  const [cashEnabled, setCashEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        setLoading(true);
        const activeSlug = normalizeSlug(
          selectedTenant && selectedTenant !== 'all' ? selectedTenant : getTenantSlug(),
        );
        setTenantSlug(activeSlug);
        const settings = await getTenantPaymentSettings(activeSlug);
        setTenantSettings(settings);
        const paymentConfig = settings.paymentConfig || {};
        setCashEnabled(paymentConfig.cashOnDeliveryEnabled === true);
        setCardEnabled(paymentConfig.cardOnDeliveryEnabled === true);
      } catch (error) {
        console.error('Failed to load payment settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [selectedTenant]);

  const handleSave = async () => {
    if (!tenantSettings) return;

    setSaving(true);
    try {
      const paymentConfig = {
        ...(tenantSettings.paymentConfig || {}),
        cashOnDeliveryEnabled: cashEnabled,
        cardOnDeliveryEnabled: cardEnabled,
      };

      const updated = await updateTenantPaymentSettings(tenantSlug, paymentConfig);
      setTenantSettings(updated);

      alert('Nastavenia platieb boli uložené.');
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
    <SettingsCard className="min-h-[214px]">
      <SettingsCardHeader
        eyebrow="Checkout"
        title="Platby pri dodaní"
        subtitle={`Brand: ${tenantSettings?.tenantSubdomain || tenantSlug}`}
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Ukladám...' : 'Uložiť'}
          </button>
        }
      />

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Hotovosť</div>
              <div className="mt-1 text-sm text-zinc-500">Zákazník zaplatí vodičovi alebo na dverách.</div>
            </div>
            <SettingsToggle checked={cashEnabled} onClick={() => setCashEnabled(!cashEnabled)} disabled={saving} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900">Platba kartou</div>
              <div className="mt-1 text-sm text-zinc-500">Ponúkne sa ako dobierka pri dodaní.</div>
            </div>
            <SettingsToggle checked={cardEnabled} onClick={() => setCardEnabled(!cardEnabled)} disabled={saving} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <SettingsBadge tone={cashEnabled ? 'success' : 'neutral'}>Hotovosť {cashEnabled ? 'zap.' : 'vyp.'}</SettingsBadge>
        <SettingsBadge tone={cardEnabled ? 'success' : 'neutral'}>Karta {cardEnabled ? 'zap.' : 'vyp.'}</SettingsBadge>
      </div>
    </SettingsCard>
  );
}
