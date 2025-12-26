'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme } from '@/lib/tenant-utils';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { tenant } = useTenant();
  const isDark = isDarkTheme(tenant);
  const primary = tenant?.theme?.primaryColor || 'var(--color-primary)';
  const secondary = tenant?.theme?.secondaryColor || 'transparent';
  const isSecondaryDark = (() => {
    const hex = secondary.replace('#', '');
    if (hex.length !== 6 && hex.length !== 3) return false;
    const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  })();
  const inactiveColor = isSecondaryDark ? '#e5e7eb' : '#1f2937';

  return (
    <div 
      className={`flex items-center gap-1 rounded-full p-1 border ${
        isDark ? 'bg-white/5 border-white/15' : ''
      }`}
      style={{ borderColor: isDark ? undefined : secondary, backgroundColor: isDark ? undefined : secondary }}
    >
      <button
        onClick={() => setLanguage('sk')}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
          language === 'sk'
            ? 'text-white shadow'
            : isDark ? 'text-gray-400 hover:text-white' : ''
        }`}
        style={language === 'sk' ? { backgroundColor: primary } : { backgroundColor: 'transparent', color: inactiveColor }}
      >
        SK
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
          language === 'en'
            ? 'text-white shadow'
            : isDark ? 'text-gray-400 hover:text-white' : ''
        }`}
        style={language === 'en' ? { backgroundColor: primary } : { backgroundColor: 'transparent', color: inactiveColor }}
      >
        EN
      </button>
    </div>
  );
}
