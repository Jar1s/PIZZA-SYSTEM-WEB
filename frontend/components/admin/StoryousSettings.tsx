'use client';

import { useState, useEffect } from 'react';
import {
  getStoryousSettings,
  updateStoryousSettings,
  getStoryousAutoPrintReadiness,
  StoryousSettings as StoryousSettingsType,
  StoryousAutoPrintReadiness,
} from '@/lib/api';

export function StoryousSettings() {
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
      
      setSettings(updated);
      const readinessData = await getStoryousAutoPrintReadiness();
      setReadiness(readinessData);
      alert('Nastavenia Storyous boli uložené!');
    } catch (error: any) {
      console.error('Failed to update Storyous settings:', error);
      alert('Nepodarilo sa uložiť nastavenia: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">📦 Storyous</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {!isExpanded ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={saving}
              className="rounded"
            />
            <span className="text-xs text-gray-700">
              {enabled ? '✅ Aktivované' : '❌ Deaktivované'}
            </span>
          </div>
          {enabled && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  disabled={saving}
                  className="rounded"
                />
                <span className="text-xs text-gray-700">Automatické posielanie</span>
              </div>
              <div className="text-xs text-gray-600">
                Delivery lead: <span className="font-semibold">{defaultDeliveryLeadMinutes} min</span>
              </div>
              {readiness && (
                <div
                  className={`text-xs rounded px-2 py-1 ${
                    readiness.ready
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {readiness.ready ? '✅ Auto-confirm readiness: OK' : '⚠️ Auto-confirm readiness: potrebuje doladiť'}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {readiness && (
            <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs">
              <div className={`font-semibold ${readiness.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
                {readiness.ready ? '✅ Auto-confirm readiness: OK' : '⚠️ Auto-confirm readiness: nie je úplne pripravené'}
              </div>
              {readiness.blockers.length > 0 && (
                <div className="mt-1 text-red-700">
                  {readiness.blockers.map((item, idx) => (
                    <div key={`blocker-${idx}`}>• {item}</div>
                  ))}
                </div>
              )}
              {readiness.warnings.length > 0 && (
                <div className="mt-1 text-amber-700">
                  {readiness.warnings.map((item, idx) => (
                    <div key={`warning-${idx}`}>• {item}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ClientID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={saving}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="692eba51dc0b299f172d5893"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={saving}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="op6V11jOLpHaXq1B"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">MerchantID</label>
            <input
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              disabled={saving}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="690da5715b2744002d9cf9cb"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">PlaceID</label>
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              disabled={saving}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="690da5715b2744002d9cf9ce"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={saving}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Aktivovať Storyous</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              disabled={saving || !enabled}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Automatické posielanie</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Default delivery lead (min)</label>
            <input
              type="number"
              min={1}
              max={240}
              value={defaultDeliveryLeadMinutes}
              onChange={(e) => setDefaultDeliveryLeadMinutes(Number(e.target.value))}
              disabled={saving}
              className="w-full px-2 py-1 text-xs border rounded"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoAcceptPrintMode}
              onChange={(e) => setAutoAcceptPrintMode(e.target.checked)}
              disabled={saving || !enabled}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Auto-confirm v Storyous</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Backend požiada Storyous, aby objednávka nečakala na ručné prijatie. Samotná tlač ešte závisí od Storyous POS a tlačiarne na prevádzke.
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={receiptIncludeModifierLines}
              onChange={(e) => setReceiptIncludeModifierLines(e.target.checked)}
              disabled={saving || !enabled}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Tlačiť + modifikátory na bloček</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={receiptIncludeOrderNumber}
              onChange={(e) => setReceiptIncludeOrderNumber(e.target.checked)}
              disabled={saving || !enabled}
              className="rounded"
            />
            <span className="text-xs text-gray-700">Tlačiť číslo objednávky</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukladá sa...' : 'Uložiť'}
          </button>
        </div>
      )}
    </div>
  );
}
