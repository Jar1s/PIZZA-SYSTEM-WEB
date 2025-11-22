'use client';

import { useState, useEffect } from 'react';

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
    <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-blue-700 mb-2">
            Zvukové upozornenia
          </h2>
          <div className="flex items-center gap-2 text-gray-700">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
            <span className="text-sm">
              Zvukové upozornenie pri novej objednávke
            </span>
          </div>
        </div>
        
        <div className="ml-6 flex items-center gap-3">
          <span className={`text-sm font-medium ${soundEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
            {soundEnabled ? 'Zapnuté' : 'Vypnuté'}
          </span>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Export funkcie na kontrolu, či sú zvuky zapnuté
export function isSoundNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return true; // SSR default
  const saved = localStorage.getItem(SOUND_NOTIFICATION_KEY);
  return saved === null ? true : saved === 'true'; // Default: enabled
}

