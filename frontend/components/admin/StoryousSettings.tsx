'use client';

import { useState, useEffect } from 'react';
import { getStoryousSettings, updateStoryousSettings, StoryousSettings as StoryousSettingsType } from '@/lib/api';

export function StoryousSettings() {
  const [settings, setSettings] = useState<StoryousSettingsType | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getStoryousSettings();
        if (data) {
          setSettings(data);
          setClientId(data.clientId || '');
          setClientSecret(data.clientSecret || '');
          setMerchantId(data.merchantId || '');
          setPlaceId(data.placeId || '');
          setEnabled(data.enabled || false);
          setAutoSync(data.autoSync || false);
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
      });
      
      setSettings(updated);
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
          )}
        </div>
      ) : (
        <div className="space-y-3">
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
