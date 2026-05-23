'use client';

import { useState, useEffect } from 'react';
import { SettingsBadge, SettingsCard, SettingsCardHeader, SettingsToggle } from '@/components/admin/SettingsCard';

const SOUND_NOTIFICATION_KEY = 'admin_sound_notifications_enabled';

export function SoundNotificationSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Načítaj preferenciu z localStorage (default: true)
    const saved = localStorage.getItem(SOUND_NOTIFICATION_KEY);
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
    setLoading(false);
  }, []);

  const handleToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(SOUND_NOTIFICATION_KEY, String(newValue));
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <SettingsCard className="min-h-[214px]">
      <SettingsCardHeader
        eyebrow="Dashboard"
        title="Zvukové upozornenia"
        subtitle="Lokálna preferencia pre nové objednávky v tomto prehliadači."
        action={<SettingsToggle checked={soundEnabled} onClick={handleToggle} />}
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <SettingsBadge tone={soundEnabled ? 'accent' : 'neutral'}>
            {soundEnabled ? 'Zvuk zapnutý' : 'Zvuk vypnutý'}
          </SettingsBadge>
          <SettingsBadge tone="neutral">Len tento browser</SettingsBadge>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Správanie</div>
          <div className="mt-2 text-sm font-semibold text-zinc-900">Zvuk pri novej objednávke</div>
          <div className="mt-2 text-sm text-zinc-500">
            Používa sa rovnaký dashboard flow, len bez backend nastavení. Vhodné na tichý office alebo hlasnú kuchyňu.
          </div>
        </div>

        <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Zmena sa uloží okamžite do local storage a platí po obnovení stránky.
        </div>
      </div>
    </SettingsCard>
  );
}

// Export funkcie na kontrolu, či sú zvuky zapnuté
export function isSoundNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return true; // SSR default
  const saved = localStorage.getItem(SOUND_NOTIFICATION_KEY);
  return saved === null ? true : saved === 'true'; // Default: enabled
}
